#!/bin/bash

set -x

rm -rf ./tmp

# Prepare binary
VERSION=$(cat sample-network/docker-compose/.env | grep "IMAGE_TAG" |  cut -d "=" -f2)
docker run --rm -v $PWD/tmp/:/var/tmp/ hyperledger/fabric-tools:${VERSION} bash -c "cp /usr/local/bin/configtx* /var/tmp/"

# Prepare git hash
GITHASH=$(git rev-parse --short HEAD)

# Build docker image
cp -r app.js bin docker-entrypoint.sh Dockerfile package.json package-lock.json public routes chaincode ./tmp
docker build -t blockchain-rest-server:$GITHASH ./tmp
rm -rf ./tmp

