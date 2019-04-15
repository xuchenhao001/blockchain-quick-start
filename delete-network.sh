#!/bin/bash

#set -x

# Obtain CONTAINER_IDS and remove them
function clearContainers() {
  CONTAINER_IDS=$(docker ps -a | awk '($2 ~ /dev-peer.*/) {print $1}')
  if [[ -z "$CONTAINER_IDS" || "$CONTAINER_IDS" == " " ]]; then
    echo "---- No containers available for deletion ----"
  else
    docker rm -f ${CONTAINER_IDS}
  fi
}

# Delete any images that were generated as a part of this setup
# specifically the following images are often left behind:
function removeUnwantedImages() {
  DOCKER_IMAGE_IDS=$(docker images | awk '($1 ~ /dev-peer.*/) {print $3}')
  if [[ -z "$DOCKER_IMAGE_IDS" || "$DOCKER_IMAGE_IDS" == " " ]]; then
    echo "---- No images available for deletion ----"
  else
    docker rmi -f ${DOCKER_IMAGE_IDS}
  fi
}

# Tear down running network
function networkDown() {

  # remove blockchain-explorer
  ./blockchain-explorer/stop.sh

  cd sample-network/docker-compose/
  # stop containers
  if [[ -f docker-compose-e2e.yaml ]]; then
    docker-compose -f docker-compose-e2e.yaml down --volumes --remove-orphans
  fi
  # Bring down the network, deleting the volumes
  #Cleanup the chaincode containers
  clearContainers
  #Cleanup images
  removeUnwantedImages
  # remove orderer block and other channel configuration transactions and certs
  rm -rf channel-artifacts/* crypto-config
  # remove the docker-compose yaml file that was customized to the example
  rm -f docker-compose-e2e.yaml
  rm -rf /tmp/fabric-client
  # remove old network connection profile
  rm -rf ../../config/network-config.yaml
  rm -rf ../../config/network-config-ext.yaml
}

networkDown

