#!/bin/bash

set -x

rm -rf ./tmp

# Prepare binary
docker run --rm -v $PWD/tmp/:/var/tmp/ hyperledger/fabric-tools:1.4.0 bash -c "cp /usr/local/bin/configtx* /var/tmp/"

# Prepare git hash
GITHASH=$(git rev-parse --short HEAD)

# Build docker image
cp -r app.js bin docker-entrypoint.sh Dockerfile package.json package-lock.json public routes chaincode patch ./tmp
docker build -t blockchain-rest-server:$GITHASH ./tmp
rm -rf ./tmp

