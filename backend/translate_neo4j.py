import asyncio
from deep_translator import GoogleTranslator
from app.graph.connection import init_driver, close_driver, get_driver

translator = GoogleTranslator(source='es', target='en')

def safe_translate(text):
    if not text or not isinstance(text, str): return text
    try:
        return translator.translate(text)
    except Exception as e:
        print(f"Error translating: {e}")
        return text

async def run_translation():
    await init_driver()
    driver = get_driver()
    try:
        async with driver.session() as session:
            # 1. Translate Herb descriptions
            print("Fetching Herbs...")
            result = await session.run("MATCH (h:Herb) RETURN id(h) AS id, h.description AS desc, h.name AS name")
            herbs = await result.data()
            print(f"Found {len(herbs)} herbs")
            for h in herbs:
                desc = h['desc']
                if desc:
                    en_desc = safe_translate(desc)
                    await session.run("MATCH (h:Herb) WHERE id(h) = $id SET h.description_en = $en_desc", id=h['id'], en_desc=en_desc)
                # Also translate the name if it looks Spanish
                name = h['name']
                if name:
                    en_name = safe_translate(name)
                    await session.run("MATCH (h:Herb) WHERE id(h) = $id SET h.name_en = $en_name", id=h['id'], en_name=en_name)
                    
            # 2. Translate Drugs
            print("Fetching Drugs...")
            result = await session.run("MATCH (d:Drug) RETURN id(d) AS id, d.description AS desc, d.name AS name")
            drugs = await result.data()
            for d in drugs:
                desc = d['desc']
                if desc:
                    en_desc = safe_translate(desc)
                    await session.run("MATCH (d:Drug) WHERE id(d) = $id SET d.description_en = $en_desc", id=d['id'], en_desc=en_desc)
                name = d['name']
                if name:
                    en_name = safe_translate(name)
                    await session.run("MATCH (d:Drug) WHERE id(d) = $id SET d.name_en = $en_name", id=d['id'], en_name=en_name)

            # 3. Translate Interactions
            print("Fetching Interactions...")
            result = await session.run("MATCH (i:Interaction) RETURN id(i) AS id, i.mechanism AS mechanism, i.recommendation AS rec")
            interactions = await result.data()
            print(f"Found {len(interactions)} interactions")
            for i in interactions:
                mech = i['mechanism']
                if mech:
                    en_mech = safe_translate(mech)
                    await session.run("MATCH (i:Interaction) WHERE id(i) = $id SET i.mechanism_en = $en_mech", id=i['id'], en_mech=en_mech)
                rec = i['rec']
                if rec:
                    en_rec = safe_translate(rec)
                    await session.run("MATCH (i:Interaction) WHERE id(i) = $id SET i.recommendation_en = $en_rec", id=i['id'], en_rec=en_rec)

            print("Done translating in Neo4j.")
            
    finally:
        await close_driver()

if __name__ == "__main__":
    asyncio.run(run_translation())
