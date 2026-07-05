import asyncio
import sys
import os
from pathlib import Path
from loguru import logger
import json

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
# Add data_pipeline/protocols to path so internal imports like 'from utils.cache' work
PROTOCOLS_DIR = BASE_DIR / "data_pipeline" / "protocols"
sys.path.append(str(PROTOCOLS_DIR))

from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")

try:
    # pyrefly: ignore [missing-import]
    from collectors.pubmed_collector import PubMedCollector
    # pyrefly: ignore [missing-import]
    from collectors.openalex_collector import OpenAlexCollector
    # pyrefly: ignore [missing-import]
    from collectors.web_collector import WebCollector
    # pyrefly: ignore [missing-import]
    from collectors.tavily_collector import TavilyCollector
    # pyrefly: ignore [missing-import]
    from collectors.existing_evidence import ExistingEvidenceCollector
    # pyrefly: ignore [missing-import]
    from extraction.gemini_extractor import GeminiExtractor
    # pyrefly: ignore [missing-import]
    from extraction.groq_validator import GroqValidator
    # pyrefly: ignore [missing-import]
    from validation.cross_validator import CrossValidator
    # pyrefly: ignore [missing-import]
    from validation.contradiction_detector import ContradictionDetector
    # pyrefly: ignore [missing-import]
    from output.neo4j_writer import Neo4jWriter
    # pyrefly: ignore [missing-import]
    from output.json_builder import JsonBuilder
    # pyrefly: ignore [missing-import]
    from utils.normalizer import NameNormalizer
    PIPELINE_AVAILABLE = True
except ImportError as e:
    logger.error(f"Failed to import data pipeline components: {e}")
    PIPELINE_AVAILABLE = False

from app.graph.connection import get_driver

class CollectionService:
    def __init__(self):
        if PIPELINE_AVAILABLE:
            self.normalizer = NameNormalizer()
            self.pubmed = PubMedCollector()
            self.openalex = OpenAlexCollector()
            self.web = WebCollector()
            self.tavily = TavilyCollector()
            self.existing_evidence = ExistingEvidenceCollector()
            self.extractor = GeminiExtractor()
            self.groq_val = GroqValidator()
            self.cross_val = CrossValidator()
            self.contradiction = ContradictionDetector()
        
    async def run_single_pair_pipeline(self, herb: str, drug: str) -> dict:
        """
        Runs the deep web collection pipeline for a specific herb and drug on-demand.
        Returns the generated protocol as a dictionary.
        """
        if not PIPELINE_AVAILABLE:
            raise Exception("Deep AI Scan is unavailable due to missing pipeline components.")
            
        logger.info(f"Starting on-demand deep scan for: {herb} + {drug}")
        
        # 1. Collect concurrently
        tasks = [
            self.pubmed.collect(herb, herb, drug),
            self.openalex.collect(herb, herb, drug),
            self.web.collect(herb, herb, drug),
            self.tavily.collect(herb, herb, drug)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_sources = []
        pubmed_sources = []
        openalex_sources = []
        tavily_sources = []
        
        if not isinstance(results[0], Exception):
            pubmed_sources = results[0]
            all_sources.extend(pubmed_sources)
        if not isinstance(results[1], Exception):
            openalex_sources = results[1]
            all_sources.extend(openalex_sources)
        if not isinstance(results[2], Exception):
            all_sources.extend(results[2])
        if not isinstance(results[3], Exception):
            tavily_sources = results[3]
            all_sources.extend(tavily_sources)
            
        pdf_evidence = self.existing_evidence.get_for_pair(herb, drug)
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

        logger.info(f"Collected {len(all_sources)} sources for {herb}+{drug}")
        
        # 2. Extract Protocol
        protocol = await self.extractor.extract(herb, herb, drug, all_sources)
        if not protocol:
            raise Exception("AI Extractor failed to generate a protocol from the sources.")
            
        # 3. Validation
        protocol = self.contradiction.detect(protocol, all_sources)
        
        context = ""
        for src in all_sources[:10]:
            context += f"Source ({src.get('source')}): {src.get('abstract', '')}\n"
            
        groq_result = await self.groq_val.validate(protocol, context)
        
        protocol = self.cross_val.score_and_validate(
            protocol=protocol,
            groq_result=groq_result,
            existing_evidence_count=len(pdf_evidence),
            pubmed_count=len(pubmed_sources),
            openalex_count=len(openalex_sources),
            tavily_count=len(tavily_sources)
        )
        
        # 4. Save to Neo4j Graph
        try:
            driver = get_driver()
            writer = Neo4jWriter(driver)
            await writer.write_protocol(protocol)
            logger.info("Successfully saved newly generated protocol to Neo4j.")
        except Exception as e:
            logger.error(f"Failed to write newly generated protocol to Neo4j: {e}")
            
        # Add metadata flag to identify as newly generated
        protocol["_source"] = "generated"
        
        return protocol
