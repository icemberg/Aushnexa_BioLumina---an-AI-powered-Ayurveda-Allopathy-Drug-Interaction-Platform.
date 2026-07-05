class ContradictionDetector:
  def detect(self, protocol: dict, all_sources: list[dict]) -> dict:
    """
    Checks if there are conflicting claims in the sources.
    Since Claude synthesizes one view, we want to flag if
    sources strongly disagree on safety.
    """
    if not protocol:
      return protocol
      
    safe_mentions = 0
    danger_mentions = 0
    
    for src in all_sources:
        text = (src.get("title", "") + " " + src.get("abstract", "")).lower()
        if any(w in text for w in ["safe", "well tolerated", "no interaction", "no significant"]):
            safe_mentions += 1
        if any(w in text for w in ["dangerous", "contraindicated", "avoid", "fatal", "severe interaction"]):
            danger_mentions += 1
            
    if safe_mentions > 0 and danger_mentions > 0:
        protocol["contradiction_flags"] = ["Mixed safety signals found in sources"]
    else:
        protocol["contradiction_flags"] = []
        
    return protocol
