#!/bin/bash

rm -rf ./tmp

# Prepare binary
docker run --rm -v $PWD/tmp/:/var/tmp/ hyperledger/fabric-tools:1.3.0 bash -c "cp /usr/local/bin/configtxgen /var/tmp/"

# Build docker image
cp -r app.js bin docker-entrypoint.sh Dockerfile package.json package-lock.json public routes ./tmp
docker build -t blockchain-rest-server:1.0.0 ./tmp
rm -rf ./tmp

