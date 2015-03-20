#!/bin/bash

echo "Starting Neo4j server"
./neo4j/bin/neo4j start

echo "Starting web server"
node web-ui/server.js

