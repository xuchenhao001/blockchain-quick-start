#!/bin/bash

mkdir ./tmp/
cp -r app.js bin docker-entrypoint.sh Dockerfile package.json package-lock.json public routes ./tmp/
docker build -t blockchain-rest-server:1.0.0 ./tmp/
rm -rf ./tmp
