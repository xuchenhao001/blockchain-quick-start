#!/bin/bash

set -e

# read -p "Start a network with docker-compose [Y/n]?" RUN_METHOD
if [[ ${RUN_METHOD} = "N" || ${RUN_METHOD} = "n" ]]; then

  # in k8s mode
  echo
  echo "===== Create a new sample network with Kubernetes [not done yet] ========="
  echo

else

  # in docker-compose mode
  echo
  echo "===== Create a new sample network with docker-compose ========="
  echo

  cd sample-network/docker-compose/

  read -p "Start orderer in raft [Y/n]?" RAFT_ORDERER
  if [[ ${RAFT_ORDERER} = "Y" || ${RAFT_ORDERER} = "y" || ${RAFT_ORDERER} = "" ]]; then
    START_RAFT_ORDERER=true
  fi

  VERSION=$(cat ./.env | grep "IMAGE_TAG" |  cut -d "=" -f2)
  docker run -ti --rm --user 1000:1000 -e DEV_PATH=$PWD -v $PWD/../../:/blockchain-quick-start hyperledger/fabric-tools:${VERSION} bash -c "cd /blockchain-quick-start/sample-network/docker-compose && ./start.sh ${START_RAFT_ORDERER}"

  if [[ ${START_RAFT_ORDERER} ]]; then
    docker-compose -f docker-compose-e2e.yaml -f docker-compose-e2e-etcdraft.yaml up -d 2>&1
  else
    docker-compose -f docker-compose-e2e.yaml up -d 2>&1
  fi
  if [[ $? -ne 0 ]]; then
    echo "ERROR !!!! Unable to start network"
    exit 1
  fi

fi

echo
echo "===== Done ========="
echo
