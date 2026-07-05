class ProtocolAdapter:
    @staticmethod
    def protocol_to_legacy_response(protocol: dict) -> dict:
        """
        Adapts either a flat Neo4j Protocol node or a deep AI generated dictionary 
        to the legacy nested JSON shape expected by the frontend.
        """
        # Handle allopathic/ayurvedic base which might be a string (Neo4j) or dict (AI)
        allo_obj = protocol.get("allopathic_base")
        allo_str = allo_obj.get("value") if isinstance(allo_obj, dict) else allo_obj
        allo_base = f"{allo_str or 'Unknown'} ({protocol.get('allopathic_dose', 'standard dose')})"
        
        ayur_obj = protocol.get("ayurvedic_base")
        ayur_str = ayur_obj.get("value") if isinstance(ayur_obj, dict) else ayur_obj
        ayur_base = f"{ayur_str or 'Unknown'} ({protocol.get('ayurvedic_dose', 'standard dose')})"

        severity = protocol.get("severity", "moderate").lower()
        if "major" in severity or "high" in severity:
            risk_level = "high"
        elif "minor" in severity or "low" in severity:
            risk_level = "low"
        elif "severe" in severity or "critical" in severity or "contraindicate" in severity:
            risk_level = "critical"
        elif "unknown" in severity:
            risk_level = "unknown"
        else:
            risk_level = "moderate"

        insights = []
        
        # 1. Mechanism
        if protocol.get("mechanism"):
            insights.append({
                "type": "info",
                "title": "Mechanism of Interaction",
                "body": protocol.get("mechanism")
            })

        # 2. Timing Guidance
        timing = protocol.get("timing_guidance")
        timing_str = timing.get("value") if isinstance(timing, dict) else timing
        if timing_str:
            insights.append({
                "type": "info",
                "title": "Administration Timing",
                "body": timing_str
            })
            
        # 3. Monitoring Parameters
        mon_params = protocol.get("monitoring_parameters")
        if mon_params:
            if isinstance(mon_params, list) and len(mon_params) > 0 and isinstance(mon_params[0], dict):
                # AI Format
                mon_str = ", ".join(p.get("parameter", "") for p in mon_params if isinstance(p, dict))
            else:
                # Neo4j format
                mon_str = ", ".join(mon_params) if isinstance(mon_params, list) else str(mon_params)
            
            insights.append({
                "type": "warning",
                "title": "Monitoring Required",
                "body": mon_str
            })
            
        # 4. Contraindications
        contra = protocol.get("contraindications")
        if contra:
            if isinstance(contra, list) and len(contra) > 0 and isinstance(contra[0], dict):
                contra_str = ", ".join(c.get("condition", "") for c in contra if isinstance(c, dict))
            else:
                contra_str = ", ".join(contra) if isinstance(contra, list) else str(contra)
                
            insights.append({
                "type": "error",
                "title": "Contraindications",
                "body": contra_str
            })
            
        # 5. Recommendation
        if protocol.get("recommendation"):
            insights.append({
                "type": "info",
                "title": "Clinical Recommendation",
                "body": protocol.get("recommendation")
            })
            
        # 6. Validation / Sources
        if protocol.get("_source") == "generated":
            sources_str = ", ".join(protocol.get("key_sources", []))
            score = protocol.get("evidence_score", 0.0)
            insights.append({
                "type": "success",
                "title": "AI Extraction",
                "body": f"Synthesized from {protocol.get('source_count', '?')} literature sources ({sources_str}). Evidence Score: {score:.2f}."
            })
        elif protocol.get("status") == "validated":
            insights.append({
                "type": "success",
                "title": "Validation",
                "body": f"This protocol has been validated by: {protocol.get('validated_by', 'Clinical Reviewer')} (Level {protocol.get('evidence_level', '?')} Evidence)"
            })
        else:
            insights.append({
                "type": "info",
                "title": "Draft Protocol",
                "body": "This protocol was AI-generated and is pending clinical review."
            })

        drug_name = protocol.get("drug_canonical", protocol.get("allopathic_base", "Drug"))
        drug_label = drug_name if isinstance(drug_name, str) else "Drug"
        
        herb_name = protocol.get("herb_canonical", protocol.get("ayurvedic_base", "Herb"))
        herb_label = herb_name if isinstance(herb_name, str) else "Herb"

        return {
            "matrix": {
                "nodes": [
                    {
                        "id": drug_label.lower(),
                        "label": drug_label,
                        "type": "drug",
                        "color": "teal"
                    },
                    {
                        "id": herb_label.lower(),
                        "label": herb_label,
                        "type": "compound",
                        "color": "amber"
                    }
                ],
                "edges": [
                    {
                        "from": herb_label.lower(),
                        "to": drug_label.lower(),
                        "risk": risk_level,
                        "label": "Managed Interaction"
                    }
                ],
                "selected_interaction": f"{herb_label} + {drug_label}",
                "risk_level": risk_level
            },
            "protocol": {
                "title": protocol.get("title", f"{herb_label} & {drug_label} Protocol"),
                "focus": protocol.get("condition", "General Management"),
                "allopathic_base": {
                    "name": allo_base,
                    "role": "Primary Conventional Therapy"
                },
                "ayurvedic_integration": {
                    "name": ayur_base,
                    "role": "Integrative Therapy / Support"
                },
                "insights": insights
            }
        }
