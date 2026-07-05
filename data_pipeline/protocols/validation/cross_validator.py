from loguru import logger

class CrossValidator:

  def score_and_validate(self, protocol: dict,
                          groq_result: dict,
                          existing_evidence_count: int,
                          pubmed_count: int,
                          openalex_count: int,
                          tavily_count: int) -> dict:

    if not protocol or not protocol.get("interaction_found"):
      if protocol:
          protocol["validation_status"] = "Experimental"
          protocol["evidence_score"] = 0.0
      return protocol

    # Score components
    evidence_level = protocol.get("evidence_level", 1)
    base_score = evidence_level / 6.0  # 0.17 to 1.0

    # Source diversity bonus
    source_types = set()
    if pubmed_count > 0: source_types.add("pubmed")
    if openalex_count > 0: source_types.add("openalex")
    if tavily_count > 0: source_types.add("tavily")
    if existing_evidence_count > 0: source_types.add("pdf")
    if protocol.get("source_count", 0) > 2: source_types.add("web")
    diversity_bonus = len(source_types) * 0.08

    # Completeness score
    key_fields = [
      "mechanism", "severity", "recommendation",
      "allopathic_base", "ayurvedic_base"
    ]
    filled = sum(
      1 for f in key_fields
      if protocol.get(f) and (
        isinstance(protocol[f], str) or
        (isinstance(protocol[f], dict)
         and protocol[f].get("value"))
      )
    )
    completeness = filled / len(key_fields) * 0.2

    # Groq validation score
    groq_score = groq_result.get("score", 0.5) * 0.15

    # PDF evidence corroboration bonus
    pdf_bonus = min(0.1, existing_evidence_count * 0.02)

    final_score = min(1.0,
      base_score * 0.45 +
      diversity_bonus +
      completeness +
      groq_score +
      pdf_bonus
    )

    protocol["evidence_score"] = round(final_score, 3)
    protocol["groq_validation_score"] = groq_result.get("score")
    protocol["pubmed_paper_count"] = pubmed_count
    protocol["openalex_paper_count"] = openalex_count
    protocol["pdf_evidence_count"] = existing_evidence_count
    protocol["tavily_result_count"] = tavily_count

    # Assign status
    has_contradictions = bool(
      protocol.get("contradiction_flags")
    )
    groq_unsupported = groq_result.get("unsupported_count", 0)

    if (final_score >= 0.55
        and not has_contradictions
        and groq_unsupported == 0
        and pubmed_count >= 1):
      protocol["validation_status"] = "Validated"

    elif (final_score >= 0.35
          and groq_unsupported <= 1):
      protocol["validation_status"] = "Review Required"

    else:
      protocol["validation_status"] = "Experimental"

    logger.info(
      f"{protocol.get('herb_common', 'Unknown')} + {protocol.get('drug_canonical', 'Unknown')}: "
      f"score={final_score:.2f} "
      f"status={protocol['validation_status']}"
    )
    return protocol
