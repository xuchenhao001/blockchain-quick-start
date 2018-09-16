#!/bin/bash

VERSION=1.2.0
ARCH=$(echo "linux-$(uname -m | sed 's/x86_64/amd64/g')")
BINARY_FILE=hyperledger-fabric-${ARCH}-${VERSION}.tar.gz
URL="https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/${ARCH}-${VERSION}/${BINARY_FILE}"

rm -rf ./tmp
mkdir -p ./tmp/binary
mkdir -p ./tmp/app

# Prepare binary
cd ./tmp/binary
curl -fsC - ${URL} -o ${BINARY_FILE}
tar -zxf ${BINARY_FILE}
cp bin/configtxgen ../app/
cd -

# Build docker image
cp -r app.js bin docker-entrypoint.sh Dockerfile package.json package-lock.json public routes ./tmp/app/
docker build -t blockchain-rest-server:1.0.0 ./tmp/app
rm -rf ./tmp

