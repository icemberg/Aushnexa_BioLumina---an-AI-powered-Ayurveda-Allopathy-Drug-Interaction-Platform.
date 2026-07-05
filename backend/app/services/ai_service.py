import httpx
import hashlib
import json
from loguru import logger

from app.config import get_settings
from app.cache.redis import cache_get, cache_set
from app.graph.connection import get_driver
from app.graph.queries import check_all_pairs

EXTRACT_PROMPT = """You are a clinical NLP extractor. Extract entities from the user query.
Return ONLY a valid JSON object matching exactly this schema:
{
  "intent": "interaction_analysis" | "protocol_generation" | "compound_lookup",
  "entities": {
    "herbs": ["list", "of", "herbs"],
    "drugs": ["list", "of", "drugs"],
    "compounds": ["list", "of", "compounds"],
    "conditions": ["list", "of", "medical", "conditions"]
  },
  "patient_parameters": "Any patient specific parameters like age, pregnancy, conditions, dosage modifiers, or constraints found in the query (usually enclosed in brackets). If none, return null."
}
Do not include markdown blocks, just the JSON.
"""

GENERATE_PROMPT = """You are an advanced clinical intelligence engine. 
You must output a structured clinical protocol and interaction matrix.
Return ONLY a valid JSON object matching exactly this schema:
{
  "matrix": {
    "nodes": [
      {"id": "entity_name_lowercase", "label": "Entity Name", "type": "compound|drug", "color": "teal|amber"}
    ],
    "edges": [
      {"from": "id1", "to": "id2", "risk": "low|moderate|high|critical|severe|unknown", "label": "Short mechanism"}
    ],
    "selected_interaction": "Entity1 + Entity2",
    "risk_level": "low|moderate|high|critical|severe|unknown"
  },
  "protocol": {
    "title": "Integrative Protocol",
    "focus": "3-5 word clinical focus",
    "allopathic_base": {
      "name": "Drug Name (dose)",
      "role": "Role description"
    },
    "ayurvedic_integration": {
      "name": "Herb Name (dose)",
      "role": "Role description"
    },
    "insights": [
      {
        "type": "warning|success|info",
        "title": "Short title",
        "body": "Insight description"
      }
    ]
  }
}

Use the provided Neo4j Graph Data to inform your response. CRITICAL: The graph data may be in Spanish. You MUST translate all medical mechanisms, effects, and text into English. Your entire generated JSON response MUST be in English. If graph data is empty, state clearly in the insights that it is a theoretical interaction, but you MUST still evaluate and provide a valid risk_level (low|moderate|high|critical) based on your clinical knowledge. Do not leave the risk level as unknown if a known clinical interaction exists.
Do not include markdown blocks, just the JSON.
"""

class AIService:
    def __init__(self):
        settings = get_settings()
        self.groq_key = settings.groq_api_key
        self.groq_model = settings.groq_model
        
    async def process_query(self, query: str) -> dict:
        # Cache check
        cache_key = "ai_query:" + hashlib.sha256(query.encode()).hexdigest()
        cached = await cache_get(cache_key)
        if cached:
            logger.info("AI Service retrieved from cache")
            try:
                return json.loads(cached)
            except Exception:
                pass

        # Step 1: Entity Extraction
        logger.info(f"Extracting entities for query: {query}")
        try:
            extraction_resp = await self._call_groq(query, EXTRACT_PROMPT, temp=0.1)
            extraction = json.loads(extraction_resp)
        except Exception as e:
            logger.error(f"Entity extraction call or JSON parsing failed: {e}")
            extraction = {"intent": "interaction_analysis", "entities": {"herbs": [], "drugs": [], "compounds": [], "conditions": []}}

        # Step 1.5: Protocol Search
        legacy_response = None
        try:
            from app.services.protocol_search import ProtocolSearch
            from app.services.protocol_adapter import ProtocolAdapter
            
            entities = extraction.get("entities", {})
            conditions = entities.get("conditions", [])
            herbs = entities.get("herbs", [])
            drugs = entities.get("drugs", [])
            patient_parameters = extraction.get("patient_parameters")
            
            async with get_driver().session() as session:
                best_protocol = await ProtocolSearch.find_best_protocol(session, conditions, herbs, drugs)
                
                if best_protocol:
                    logger.info(f"Using validated protocol from library: {best_protocol.get('title')}")
                    legacy_response = ProtocolAdapter.protocol_to_legacy_response(best_protocol)
                    
                    if not patient_parameters or patient_parameters.lower() == "null":
                        await cache_set(cache_key, json.dumps(legacy_response), ttl=3600)
                        return legacy_response
                    else:
                        logger.info("Patient parameters detected. Passing baseline protocol to generator for adaptation.")
        except Exception as e:
            logger.error(f"Protocol search failed: {e}")

        # Step 1.7: Deep Generation Pipeline
        if not legacy_response and herbs and drugs:
            logger.info("No existing protocol found. Triggering Deep AI Scan.")
            try:
                from app.services.collection_service import CollectionService
                collection_svc = CollectionService()
                generated_protocol = await collection_svc.run_single_pair_pipeline(herbs[0], drugs[0])
                from app.services.protocol_adapter import ProtocolAdapter
                legacy_response = ProtocolAdapter.protocol_to_legacy_response(generated_protocol)
                
                if not patient_parameters or patient_parameters.lower() == "null":
                    legacy_response["_source"] = "generated"
                    await cache_set(cache_key, json.dumps(legacy_response), ttl=3600)
                    return legacy_response
                else:
                    logger.info("Patient parameters detected for generated protocol. Passing to generator for adaptation.")
            except Exception as e:
                logger.error(f"Deep AI Scan failed: {e}. Falling back to groq generation.")

        # Step 2: Graph Retrieval
        all_entities = []
        for v in extraction.get("entities", {}).values():
            all_entities.extend(v)
            
        graph_data = []
        if len(all_entities) > 1:
            try:
                from app.services.normalization_service import NormalizationService
                from app.core.exceptions import EntityNormalizationError
                
                norm_service = NormalizationService()
                canonical_entities = []
                for entity in all_entities:
                    try:
                        norm = await norm_service.normalize(entity)
                        canonical_entities.append(norm.canonical)
                    except EntityNormalizationError:
                        canonical_entities.append(entity)
                        
                async with get_driver().session() as session:
                    graph_data = await check_all_pairs(session, canonical_entities)
            except Exception as e:
                logger.error(f"Graph retrieval failed: {e}")

        # Step 3: Structured Generation
        context_prompt = f"User Query: {query}\n\nExtracted Entities: {json.dumps(extraction)}\n\nNeo4j Graph Data: {json.dumps(graph_data)}\n\n"
        
        patient_parameters = extraction.get("patient_parameters")
        if legacy_response and patient_parameters and patient_parameters.lower() != "null":
            context_prompt += f"Baseline Protocol to Adapt:\n{json.dumps(legacy_response)}\n\n"
            context_prompt += f"CRITICAL: You MUST adapt the Baseline Protocol above based on these Patient Parameters: {patient_parameters}. Change dosages, warnings, and add specific insights relevant to the patient's age, pregnancy status, or conditions. Maintain the JSON structure.\n\n"
            
        context_prompt += "Generate structured JSON."
        
        logger.info("Generating structured response...")
        try:
            gen_resp = await self._call_groq(context_prompt, GENERATE_PROMPT, temp=0.3)
            
            # Strip potential markdown formatting that LLMs sometimes add despite instructions
            cleaned_resp = gen_resp.strip()
            if cleaned_resp.startswith("```json"):
                cleaned_resp = cleaned_resp[7:]
            if cleaned_resp.startswith("```"):
                cleaned_resp = cleaned_resp[3:]
            if cleaned_resp.endswith("```"):
                cleaned_resp = cleaned_resp[:-3]
                
            final_data = json.loads(cleaned_resp.strip())
            
            # Save generated protocol as draft
            try:
                from app.services.protocol_search import ProtocolSearch
                async with get_driver().session() as session:
                    await ProtocolSearch.save_draft_protocol(session, final_data, query)
            except Exception as save_err:
                logger.error(f"Failed to save draft protocol: {save_err}")
                
        except Exception as e:
            logger.error(f"Generation API call or parsing failed: {e}")
            raise Exception("AI failed to generate a valid response. Please try again.") from e

        # Cache valid response
        await cache_set(cache_key, json.dumps(final_data), ttl=3600) # 1 hour cache
        
        return final_data

    async def _call_groq(self, prompt: str, system_prompt: str, temp: float) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": temp,
                    "max_tokens": 1500
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
