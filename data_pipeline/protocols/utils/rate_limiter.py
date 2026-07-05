import asyncio
import time
from loguru import logger

class RateLimiter:
  def __init__(self, calls_per_second: float):
    self.min_interval = 1.0 / calls_per_second
    self._last_called = 0.0
    self._lock = asyncio.Lock()

  async def wait(self):
    async with self._lock:
      elapsed = time.monotonic() - self._last_called
      wait_time = self.min_interval - elapsed
      if wait_time > 0:
        await asyncio.sleep(wait_time)
      self._last_called = time.monotonic()

# One limiter per external service
LIMITERS = {
  "pubmed":          RateLimiter(3.0),   # 3/s without key, 10/s with
  "openalex":        RateLimiter(5.0),   # generous free tier
  "web_general":     RateLimiter(0.5),   # 1 per 2 seconds for scraping
  "msk":             RateLimiter(0.5),   # Memorial Sloan Kettering
  "nccih":           RateLimiter(0.5),   # NIH NCCIH
  "examine":         RateLimiter(0.33),  # 1 per 3 seconds
  "gemini":          RateLimiter(1.0),   # conservative (replaced claude)
  "groq":            RateLimiter(2.0),   # free tier generous
  "tavily":          RateLimiter(1.0),   # search API
}
