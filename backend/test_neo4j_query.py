import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("d:\\Aushnexa-BioLumina\\aushnexa\\backend"))

from app.graph.connection import init_driver, get_driver
from app.graph.queries import check_all_pairs

async def main():
    await init_driver()
    driver = get_driver()
    async with driver.session() as session:
        res = await check_all_pairs(session, ["chamomile", "warfarin"])
        print(res)

asyncio.run(main())
