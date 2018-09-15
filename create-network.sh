#!/bin/bash

echo
echo "===== Create a new sample network ========="
echo

cd sample-network/

docker run -ti --rm -e DEV_PATH=$PWD -v $PWD/../:/blockchain-quick-start hyperledger/fabric-tools:1.2.0 bash -c "cd /blockchain-quick-start/sample-network/ && ./start.sh"

docker-compose -f docker-compose-e2e.yaml up -d 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR !!!! Unable to start network"
  exit 1
fi

