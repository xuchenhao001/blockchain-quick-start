echo "Deploying Database (POSTGRES) container at $db_ip"
docker run \
    -d \
    --name blockchain-explorer-db \
    --net net_byfn \
    --restart always \
    -e DATABASE_DATABASE=fabricexplorer \
    -e DATABASE_USERNAME=hppoc \
    -e DATABASE_PASSWORD=password \
    hyperledger/explorer-db:0.3.7.1

echo "Preparing database for Explorer"
echo "Waiting...6s"
sleep 1s
echo "Waiting...5s"
sleep 1s
echo "Waiting...4s"
sleep 1s
echo "Waiting...3s"
sleep 1s
echo "Waiting...2s"
sleep 1s
echo "Waiting...1s"
sleep 1s
echo "Creating default database schemas..."
docker exec blockchain-explorer-db /bin/bash /opt/createdb.sh

echo "Deploying Hyperledger Fabric Explorer container at $explorer_ip"
docker run \
    -d \
    --name blockchain-explorer \
    --net net_byfn \
    --restart always \
    -e DATABASE_HOST=blockchain-explorer-db \
    -e DATABASE_USERNAME=hppoc \
    -e DATABASE_PASSWD=password \
    -v $PWD/config.json:/opt/explorer/app/platform/fabric/config.json \
    -v $PWD/../sample-network/docker-compose/crypto-config:/tmp/crypto \
    -p 8080:8080 \
    --link blockchain-explorer-db:blockchain-explorer-db \
    hyperledger/explorer:0.3.7.1


