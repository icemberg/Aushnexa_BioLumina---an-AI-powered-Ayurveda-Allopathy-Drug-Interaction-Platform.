import json
from pathlib import Path

def main():
    base_dir = Path("../data_pipeline/seed_data")
    herbs_file = base_dir / "herbs.json"
    drugs_file = base_dir / "drugs.json"
    out_file = base_dir / "synonyms.json"

    with open(herbs_file, "r", encoding="utf-8") as f:
        herbs = json.load(f)

    with open(drugs_file, "r", encoding="utf-8") as f:
        drugs = json.load(f)

    synonyms = {}

    # Process herbs
    for herb in herbs:
        canonical = herb.get("name", herb["id"])
        
        # Add id
        synonyms[herb["id"].lower()] = {"canonical": canonical, "type": "herb"}
        
        # Add name
        if canonical:
            synonyms[canonical.lower()] = {"canonical": canonical, "type": "herb"}
        
        # Add scientific
        if herb.get("scientific"):
            synonyms[herb["scientific"].lower()] = {"canonical": canonical, "type": "herb"}
            
        # Add aliases
        for alias in herb.get("aliases", []):
            if alias:
                synonyms[alias.lower()] = {"canonical": canonical, "type": "herb"}

    # Process drugs
    for drug in drugs:
        canonical = drug["id"]
        
        # Add id
        synonyms[drug["id"].lower()] = {"canonical": canonical, "type": "drug_class"}
        
        # Add name
        if drug.get("name"):
            synonyms[drug["name"].lower()] = {"canonical": canonical, "type": "drug_class"}
        
        # Add drugs (specific drugs within class)
        for d in drug.get("drugs", []):
            if d:
                synonyms[d.lower()] = {"canonical": canonical, "type": "drug_class"}
            
        # Add aliases
        for alias in drug.get("aliases", []):
            if alias:
                synonyms[alias.lower()] = {"canonical": canonical, "type": "drug_class"}

    with open(out_file, "w", encoding="utf-8-sig") as f:
        json.dump(synonyms, f, indent=2, ensure_ascii=False)
        
    print(f"Generated {len(synonyms)} synonyms mapping to canonical entities.")

if __name__ == "__main__":
    main()
