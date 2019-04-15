#!/bin/bash

read -p "Start a network with docker-compose (Y/n)?" RUN_METHOD
if [[ ${RUN_METHOD} = "N" || ${RUN_METHOD} = "n" ]]; then

  # in k8s mode
  echo
  echo "===== Create a new sample network with Kubernetes ========="
  echo

else

  # in docker-compose mode
  echo
  echo "===== Create a new sample network with docker-compose ========="
  echo

  cd sample-network/docker-compose/

  docker run -ti --rm -e DEV_PATH=$PWD -v $PWD/../../:/blockchain-quick-start hyperledger/fabric-tools:1.4.0 bash -c "cd /blockchain-quick-start/sample-network/docker-compose && ./start.sh"

  docker-compose -f docker-compose-e2e.yaml up -d 2>&1
  if [[ $? -ne 0 ]]; then
    echo "ERROR !!!! Unable to start network"
    exit 1
  fi

fi

echo
echo "===== Done ========="
echo
