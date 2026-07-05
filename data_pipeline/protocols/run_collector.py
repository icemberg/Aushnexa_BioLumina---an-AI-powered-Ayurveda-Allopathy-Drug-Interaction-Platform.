import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

from loguru import logger
from neo4j import GraphDatabase

# Add parent directory to path so we can import from backend
sys.path.append(os.path.join(os.path.dirname(__file__), "../../backend"))
try:
    # pyrefly: ignore [missing-import]
    from app.config import get_settings
    settings = get_settings()
    NEO4J_URI = settings.neo4j_uri
    NEO4J_USER = settings.neo4j_user
    NEO4J_PASSWORD = settings.neo4j_password
except Exception as e:
    logger.warning(f"Could not load Neo4j settings from backend: {e}")
    NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

from utils.normalizer import NameNormalizer, PRIORITY_PAIRS
from collectors.pubmed_collector import PubMedCollector
from collectors.openalex_collector import OpenAlexCollector
from collectors.web_collector import WebCollector
from collectors.tavily_collector import TavilyCollector
from collectors.existing_evidence import ExistingEvidenceCollector
from extraction.gemini_extractor import GeminiExtractor
from extraction.groq_validator import GroqValidator
from validation.cross_validator import CrossValidator
from validation.contradiction_detector import ContradictionDetector
from output.neo4j_writer import Neo4jWriter
from output.json_builder import JsonBuilder

async def main():
    logger.info("Starting Targeted Web Collection Pipeline")
    
    # Initialize components
    normalizer = NameNormalizer()
    pubmed = PubMedCollector()
    openalex = OpenAlexCollector()
    web = WebCollector()
    tavily = TavilyCollector()
    existing_evidence = ExistingEvidenceCollector()
    
    extractor = GeminiExtractor()
    groq_val = GroqValidator()
    cross_val = CrossValidator()
    contradiction = ContradictionDetector()
    
    json_builder = JsonBuilder()
    
    # Setup Neo4j
    driver = None
    writer = None
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        driver.verify_connectivity()
        writer = Neo4jWriter(driver)
        logger.info("Connected to Neo4j successfully.")
    except Exception as e:
        logger.warning(f"Failed to connect to Neo4j: {e}. Graph writing will be disabled.")
        
    for botanical, common, drug, drug_aliases in PRIORITY_PAIRS:
        logger.info(f"Processing Pair: {common} ({botanical}) + {drug}")
        
        # 1. Collect from all sources concurrently
        tasks = [
            pubmed.collect(botanical, common, drug),
            openalex.collect(botanical, common, drug),
            web.collect(botanical, common, drug),
            tavily.collect(botanical, common, drug)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_sources = []
        pubmed_sources = []
        openalex_sources = []
        tavily_sources = []
        web_sources = []
        
        if not isinstance(results[0], Exception):
            pubmed_sources = results[0]
            all_sources.extend(pubmed_sources)
        if not isinstance(results[1], Exception):
            openalex_sources = results[1]
            all_sources.extend(openalex_sources)
        if not isinstance(results[2], Exception):
            web_sources = results[2]
            all_sources.extend(web_sources)
        if not isinstance(results[3], Exception):
            tavily_sources = results[3]
            all_sources.extend(tavily_sources)
            
        pdf_evidence = existing_evidence.get_for_pair(common, drug)
        # Convert PDF evidence into a source-like format for Claude/Gemini
        for pdf_ev in pdf_evidence:
            all_sources.append({
                "title": f"PDF Evidence: {pdf_ev.get('evidence_id')}",
                "abstract": pdf_ev.get("claim", ""),
                "source": "PDF Database",
                "evidence_level": 2,
                "url": "",
                "year": 2024,
                "citation_count": 0,
                "herb_mentioned": True,
                "drug_mentioned": True
            })

        logger.info(f"Collected {len(all_sources)} total pieces of evidence for {common}+{drug}")
        
        # 2. Extract Protocol
        protocol = await extractor.extract(botanical, common, drug, all_sources)
        if not protocol:
            continue
            
        # 3. Validation
        protocol = contradiction.detect(protocol, all_sources)
        
        # We need a summarized context for Groq
        context = ""
        for src in all_sources[:10]:  # Top 10 sources
            context += f"Source ({src.get('source')}): {src.get('abstract', '')}\n"
            
        groq_result = await groq_val.validate(protocol, context)
        
        protocol = cross_val.score_and_validate(
            protocol=protocol,
            groq_result=groq_result,
            existing_evidence_count=len(pdf_evidence),
            pubmed_count=len(pubmed_sources),
            openalex_count=len(openalex_sources),
            tavily_count=len(tavily_sources)
        )
        
        # 4. Output
        json_builder.add_protocol(protocol, all_sources)
        json_builder.save()
        
        if writer:
            await writer.write_protocol(protocol)
            
        # Small delay between pairs to be polite
        await asyncio.sleep(2)
        
    if driver:
        driver.close()
    logger.info("Pipeline completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
