# Quincksertly

Quickly insert chains of nodes and relations into a Neo4j database.

## Instructions

1. Download Neo4j from [neo4j.com](http://neo4j.com), and unpack the zip archive into the root of this project.
2. Rename the folder you unpacked to `neo4j` - no version numbers or any other cruft
3. Navigate your shell of choice to the project root, and run `./start.sh`
4. Point your browser to `localhost:7400` to insert stuff, and `localhost:7474` to show it.

## Data requirements

This project relies on every node having a `name` property, and no error handling is performed for nodes that don't;
the UI will just crash. You can check your db with the following Cypher query:

    MATCH (n) WHERE NOT HAS(n.name) RETURN n

If there are any results, you can either update the nodes and add a `name`, update the code to use some other
property which all your nodes have, or execute

    MATCH (n) WHERE NOT HAS(n.name) DELETE n

to delete all nodes without a `name`.
