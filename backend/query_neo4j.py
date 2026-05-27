from neo4j import GraphDatabase

uri = "bolt://localhost:7687"
user = "neo4j"
password = "aushnexa_neo4j_2024"

driver = GraphDatabase.driver(uri, auth=(user, password))

def find_nodes():
    with driver.session() as session:
        result = session.run("MATCH (n) WHERE toLower(n.name) CONTAINS 'hypericum' RETURN labels(n), n.name")
        nodes = list(result)
        if nodes:
            for record in nodes:
                print(f"Found node: labels={record['labels(n)']}, name={record['n.name']}")
        else:
            print("No nodes found for 'hypericum'.")

if __name__ == "__main__":
    find_nodes()
    driver.close()
