#!/bin/bash

mkdir ./tmp/
cp -r app.js bin docker-entrypoint.sh Dockerfile package.json package-lock.json public routes ./tmp/
docker build -t cics-blockchain:1.0.0 ./tmp/
rm -rf ./tmp
