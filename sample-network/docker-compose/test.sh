#!/bin/bash

set -e

START_RAFT_ORDERER=N
RUN_ENV=N

# Got a path parameter, and then return it's content parsed with '\n'
function getFileParse() {
  local FILEPATH=$1
  local CONTENT=$(cat -e ${FILEPATH})
  local CONTENT=$(echo ${CONTENT} | sed 's/\$ */\\\\n/g')
  local CONTENT=$(echo ${CONTENT} | sed 's/\//\\\//g')
  echo ${CONTENT}
}

function prepareConnectionFileCerts() {
  echo
  echo "===== Prepare network connection profile ========="
  echo
  cp ../../config/network-config-template.yaml ../../config/network-config.yaml

  # Org1 Admin
  PRIV_KEY=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*_sk)
  sed -i "_bak" "s/ORG1_PRIVATE_KEY/${PRIV_KEY}/g" ../../config/network-config.yaml
  ADMIN_CERT=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem)
  sed -i "_bak" "s/ORG1_SIGN_CERT/${ADMIN_CERT}/g" ../../config/network-config.yaml

  # Org2 Admin
  PRIV_KEY=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore/*_sk)
  sed -i "_bak" "s/ORG2_PRIVATE_KEY/${PRIV_KEY}/g" ../../config/network-config.yaml
  ADMIN_CERT=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/Admin@org2.example.com-cert.pem)
  sed -i "_bak" "s/ORG2_SIGN_CERT/${ADMIN_CERT}/g" ../../config/network-config.yaml

  # Org3 Admin
  #PRIV_KEY=$(getFileParse crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/keystore/*_sk)
  #sed -i "s/ORG3_PRIVATE_KEY/${PRIV_KEY}/g" ../../config/network-config.yaml
  #ADMIN_CERT=$(getFileParse crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/signcerts/Admin@org3.example.com-cert.pem)
  #sed -i "s/ORG3_SIGN_CERT/${ADMIN_CERT}/g" ../../config/network-config.yaml

  # Orderer Admin
  PRIV_KEY=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore/*_sk)
  sed -i "_bak" "s/ORDERER_PRIVATE_KEY/${PRIV_KEY}/g" ../../config/network-config.yaml
  ADMIN_CERT=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts/Admin@example.com-cert.pem)
  sed -i "_bak" "s/ORDERER_SIGN_CERT/${ADMIN_CERT}/g" ../../config/network-config.yaml

  # Orderer tls CA
  ORDERER_TLS=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt)
  sed -i "_bak" "s/ORDERER_TLS/$ORDERER_TLS/g" ../../config/network-config.yaml
  

  # peers' tls CA
  PEER0_ORG1_TLS=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt)
  sed -i "_bak" "s/PEER0_ORG1_TLS/$PEER0_ORG1_TLS/g" ../../config/network-config.yaml
  #PEER1_ORG1_TLS=$(getFileParse crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt)
  #sed -i "s/PEER1_ORG1_TLS/$PEER1_ORG1_TLS/g" ../../config/network-config.yaml
  PEER0_ORG2_TLS=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt)
  sed -i "_bak" "s/PEER0_ORG2_TLS/$PEER0_ORG2_TLS/g" ../../config/network-config.yaml
  #PEER1_ORG2_TLS=$(getFileParse crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt)
  #sed -i "s/PEER1_ORG2_TLS/$PEER1_ORG2_TLS/g" ../../config/network-config.yaml
  #PEER0_ORG3_TLS=$(getFileParse crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt)
  #sed -i "s/PEER0_ORG3_TLS/$PEER0_ORG3_TLS/g" ../../config/network-config.yaml
  #PEER1_ORG3_TLS=$(getFileParse crypto-config/peerOrganizations/org3.example.com/peers/peer1.org3.example.com/tls/ca.crt)
  #sed -i "s/PEER1_ORG3_TLS/$PEER1_ORG3_TLS/g" ../../config/network-config.yaml

  # CA's tls CA
  CA_ORG1_TLS=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem)
  sed -i "_bak" "s/CA_ORG1_TLS/$CA_ORG1_TLS/g" ../../config/network-config.yaml
  CA_ORG2_TLS=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/ca/ca.org2.example.com-cert.pem)
  sed -i "_bak" "s/CA_ORG2_TLS/$CA_ORG2_TLS/g" ../../config/network-config.yaml
  #CA_ORG3_TLS=$(getFileParse /Users/huyinsong/workspace/fabric/v2.0.0/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/ca/ca.org3.example.com-cert.pem)
  #sed -i "s/CA_ORG3_TLS/$CA_ORG3_TLS/g" ../../config/network-config.yaml

  cp ../../config/network-config-ext-template.yaml ../../config/network-config-ext.yaml
  echo "Finished."
}


function prepareEnv() {
  echo
  echo "===== Prepare Rest Server container/dev environment ========="
  echo
  if [[ ${RUN_ENV} = "N" || ${RUN_ENV} = "n" ]]; then
    # in dev mode, reset certs' path
    CURRENT_DIR=$(echo ${DEV_PATH} | sed "s/\//\\\\\//g")
    sed -i "_bak" "s/\/var/$CURRENT_DIR/g" ../../config/network-config-ext.yaml

    # in dev mode, reset url
    sed -i "_bak" "s/orderer.example.com:7050/localhost:7050/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer0.org1.example.com:7051/localhost:7051/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer0.org1.example.com:7053/localhost:7053/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer1.org1.example.com:8051/localhost:8051/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer1.org1.example.com:7053/localhost:8053/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer0.org2.example.com:9051/localhost:9051/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer0.org2.example.com:7053/localhost:9053/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer1.org2.example.com:10051/localhost:10051/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer1.org2.example.com:7053/localhost:10053/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer0.org3.example.com:11051/localhost:11051/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer0.org3.example.com:7053/localhost:11053/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer1.org3.example.com:12051/localhost:12051/g" ../../config/network-config.yaml
    sed -i "_bak" "s/peer1.org3.example.com:7053/localhost:12053/g" ../../config/network-config.yaml
    sed -i "_bak" "s/ca.org1.example.com:7054/localhost:7054/g" ../../config/network-config.yaml
    sed -i "_bak" "s/ca.org2.example.com:7054/localhost:8054/g" ../../config/network-config.yaml
    sed -i "_bak" "s/ca.org3.example.com:7054/localhost:9054/g" ../../config/network-config.yaml

    # in dev mode, service discovery needs aslocalhost set to true
    # See: https://fabric-sdk-node.github.io/tutorial-discovery.html
    sed -i "_bak" "s/asLocalhost: false/asLocalhost: true/g" ../../config/network-config-ext.yaml
  fi
  echo "Finished."
}

prepareConnectionFileCerts
prepareEnv

