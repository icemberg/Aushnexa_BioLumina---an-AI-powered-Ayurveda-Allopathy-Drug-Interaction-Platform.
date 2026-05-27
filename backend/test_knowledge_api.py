import asyncio
from app.graph.connection import init_driver, close_driver, get_driver
from app.graph.queries import get_initial_graph, get_node_details, search_nodes

async def test():
    await init_driver()
    try:
        async with get_driver().session() as session:
            print("Testing get_initial_graph...")
            g = await get_initial_graph(session)
            print(f"Nodes: {len(g['nodes'])}, Edges: {len(g['edges'])}")
            
            print("Testing search_nodes 'curcumina'...")
            s = await search_nodes(session, "curcumina")
            print(f"Found: {s}")
            
            if s:
                node_id = s[0]['id']
                print(f"Testing get_node_details for {node_id}...")
                n = await get_node_details(session, node_id)
                print(f"Node detail keys: {list(n.keys()) if n else None}")
    finally:
        await close_driver()

if __name__ == "__main__":
    asyncio.run(test())
