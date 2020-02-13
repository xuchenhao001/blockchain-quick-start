#!/bin/bash

set -x

rm -rf ./tmp
mkdir tmp
# Prepare binary
#VERSION=$(cat sample-network/docker-compose/.env | grep "IMAGE_TAG" |  cut -d "=" -f2)
#docker run --rm -v $PWD/tmp/:/var/tmp/ hyperledger/fabric-tools:${VERSION} bash -c "cp /usr/local/bin/configtx* /var/tmp/"
cp ./fabric_tools/linux/configtxgen ./tmp/
cp ./fabric_tools/linux/configtxlator ./tmp/
# Prepare git hash
GITHASH=$(git rev-parse --short HEAD)

# Build docker image
cp -r app.js bin docker-entrypoint.sh Dockerfile package.json package-lock.json public routes chaincode patch ./tmp
docker build -t blockchain-rest-server:$GITHASH ./tmp
rm -rf ./tmp
docker tag blockchain-rest-server:$GITHASH blockchain-rest-server:2.0.0
docker save blockchain-rest-server:2.0.0 -o blockchain-rest-server_2.0.0.tar.gz
