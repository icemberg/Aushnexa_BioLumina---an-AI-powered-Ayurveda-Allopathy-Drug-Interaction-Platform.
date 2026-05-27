# Herb-Drug Interaction Checker

A free, open-source tool for checking interactions between medicinal plants and prescription drugs. Covers 250 plants (including Andean and Amazonian species), 53 drug classes, and 592 documented interactions.

**[Try the live tool](https://botanicaandina.com/herramientas/interacciones/)** | **[Botanica Andina](https://botanicaandina.com)**

## What it does

Select a plant and a drug class to see:
- Interaction severity (high/moderate/low)
- Pharmacological mechanism
- Evidence quality and source
- Clinical recommendation

Everything runs client-side. No server, no tracking, no signup.

## Why this exists

Most herb-drug interaction tools cover St. John's Wort, ginkgo, and garlic. They miss the hundreds of plants used daily across Latin America: cat's claw (*Uncaria tomentosa*), maca (*Lepidium meyenii*), sangre de drago (*Croton lechleri*), sacha inchi (*Plukenetia volubilis*).

This tool fills that gap with data compiled from PubMed, EMA/ESCOP monographs, WHO guidelines, and the TRAMIL database.

## Data

The `data/` directory contains three JSON files:

| File | Records | Description |
|------|---------|-------------|
| `herbs.json` | 250 | Medicinal plants with scientific names, common names (ES/EN), and aliases |
| `drug_classes.json` | 53 | Drug classes with individual medications and aliases |
| `interactions.json` | 592 | Documented interactions with severity, mechanism, evidence, and sources |

### Interaction schema

```json
{
  "herb": "hypericum",
  "drugClass": "anticoagulantes",
  "severity": "alta",
  "effect": "Reduces warfarin plasma levels, increasing thrombosis risk",
  "mechanism": "CYP3A4/CYP2C9 induction + P-glycoprotein induction",
  "evidence": "Systematic review + RCTs",
  "source": "PMC6892159",
  "recommendation": "Contraindicated. Do not combine."
}
```

### Severity levels

- **alta** (high): clinically significant, documented adverse events
- **moderada** (moderate): pharmacokinetic interaction with clinical relevance
- **baja** (low): theoretical or minor interaction

## Usage

### As a web tool

Open `index.html` in any browser. No build step, no dependencies.

### As a dataset

Import the JSON files into your own application:

```python
import json

herbs = json.load(open("data/herbs.json"))
interactions = json.load(open("data/interactions.json"))

# Find all high-severity interactions for a specific herb
st_johns = [i for i in interactions if i["herb"] == "hypericum" and i["severity"] == "alta"]
```

```javascript
const interactions = require("./data/interactions.json");
const highSeverity = interactions.filter(i => i.severity === "alta");
```

## Technical details

- Zero dependencies (vanilla HTML/CSS/JS)
- Client-side fuzzy search with accent normalization
- Works offline once loaded
- Total data size: ~120KB
- Core Web Vitals: LCP < 800ms, CLS 0, FID < 50ms

## Sources

- [European Medicines Agency (EMA)](https://www.ema.europa.eu/en/medicines/herbal) herbal monographs
- [ESCOP](https://escop.com/) monographs
- PubMed Central open-access systematic reviews and clinical trials
- WHO monographs on medicinal plants
- TRAMIL (Traditional Medicine in the Islands) database

Every interaction includes a PubMed DOI or monograph reference.

## Disclaimer

This tool is for educational and research purposes. It is not a substitute for professional medical advice. Always consult a healthcare provider before combining herbal supplements with prescription medications.

## License

MIT License. Data and tool are free to use, modify, and distribute.

## About

Built by [Botanica Andina](https://botanicaandina.com) -- evidence-based research on Andean and Latin American medicinal plants.
