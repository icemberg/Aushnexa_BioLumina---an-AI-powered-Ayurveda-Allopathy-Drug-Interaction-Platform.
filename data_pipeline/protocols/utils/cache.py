import sqlite3
import json
import hashlib
import os
from loguru import logger

class PipelineCache:

  def __init__(self,
               db_path="data_pipeline/protocols/cache/web_cache.db"):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    self.conn = sqlite3.connect(db_path, check_same_thread=False)
    self.conn.execute("""
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    """)
    self.conn.commit()

  def make_key(self, *args) -> str:
    content = "|".join(str(a) for a in args)
    return hashlib.md5(content.encode()).hexdigest()

  def get(self, key: str) -> dict | list | None:
    row = self.conn.execute(
      "SELECT value FROM cache WHERE key = ?", [key]
    ).fetchone()
    if row:
      return json.loads(row[0])
    return None

  def set(self, key: str, value, source: str = ""):
    self.conn.execute(
      "INSERT OR REPLACE INTO cache (key, value, source)"
      " VALUES (?, ?, ?)",
      [key, json.dumps(value, ensure_ascii=False), source]
    )
    self.conn.commit()

  def exists(self, key: str) -> bool:
    row = self.conn.execute(
      "SELECT 1 FROM cache WHERE key = ?", [key]
    ).fetchone()
    return row is not None

# Module-level singleton
_cache = None
def get_cache() -> PipelineCache:
  global _cache
  if _cache is None:
    _cache = PipelineCache()
  return _cache
