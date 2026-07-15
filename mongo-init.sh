#!/bin/bash
# Wait for the mongo shell to be ready
echo "Waiting for mongo to be ready..."
until mongosh --quiet --eval "db.runCommand({hello: 1}).ok" > /dev/null 2>&1; do
  sleep 1
done

# Initiate the replica set
echo "Initiating replica set..."
mongosh --quiet --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'ecommerce_mongodb_server:27017' }] })"

echo "Replica set initiated."
