import json
import os
from loguru import logger

class JsonBuilder:
    def __init__(self, output_dir="data_pipeline/protocols/output_files"):
        # Relative to data_pipeline/protocols/
        self.output_dir = os.path.join(os.path.dirname(__file__), "../output_files")
        os.makedirs(self.output_dir, exist_ok=True)
        self.library_path = os.path.join(self.output_dir, "protocol_library.json")
        self.evidence_path = os.path.join(self.output_dir, "protocol_evidence.json")
        
        self.library = []
        self.evidence = []
        
        # Load existing if any
        if os.path.exists(self.library_path):
            try:
                with open(self.library_path, "r") as f:
                    self.library = json.load(f)
            except:
                pass
                
        if os.path.exists(self.evidence_path):
            try:
                with open(self.evidence_path, "r") as f:
                    self.evidence = json.load(f)
            except:
                pass

    def add_protocol(self, protocol: dict, sources: list[dict]):
        if not protocol:
            return
            
        # Update or append
        existing = next((p for p in self.library if p.get("herb_canonical") == protocol.get("herb_canonical") and p.get("drug_canonical") == protocol.get("drug_canonical")), None)
        if existing:
            self.library.remove(existing)
        self.library.append(protocol)
        
        # Store sources
        ev_record = {
            "herb_canonical": protocol.get("herb_canonical"),
            "drug_canonical": protocol.get("drug_canonical"),
            "sources": sources
        }
        
        existing_ev = next((e for e in self.evidence if e.get("herb_canonical") == ev_record["herb_canonical"] and e.get("drug_canonical") == ev_record["drug_canonical"]), None)
        if existing_ev:
            self.evidence.remove(existing_ev)
        self.evidence.append(ev_record)
        
    def save(self):
        with open(self.library_path, "w", encoding="utf-8") as f:
            json.dump(self.library, f, indent=2, ensure_ascii=False)
            
        with open(self.evidence_path, "w", encoding="utf-8") as f:
            json.dump(self.evidence, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Saved {len(self.library)} protocols to JSON.")
