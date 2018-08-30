'use strict';

let certDir = '/root/blockchain-quick-start/sample-network/';

// ip config
let org1IP = 'localhost';
let org2IP = 'localhost';
let orderIP = 'localhost';

let url = {
  // orderer
  orderer_url: 'grpcs://' + orderIP + ':7050',

  // org1
  org1: {
    peer0_network: 'grpcs://' + org1IP + ':7051',
    peer0_event: 'grpcs://' + org1IP + ':7053',
    peer1_network: 'grpcs://' + org1IP + ':8051',
    peer1_event: 'grpcs://' + org1IP + ':8053'
  },

  // org2
  org2: {
    peer0_network: 'grpcs://' + org2IP + ':9051',
    peer0_event: 'grpcs://' + org2IP + ':9053',
    peer1_network: 'grpcs://' + org2IP + ':10051',
    peer1_event: 'grpcs://' + org2IP + ':10053',
  }
};

let config = {
  channel_id: 'mychannel',
  chaincode_id: 'mycc',

  // orderer
  orderer: {
    server_hostname: 'orderer.example.com',
    url: url.orderer_url,
    tls_ca: certDir +
      'crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt'
  },

  // org1
  org1: {
    user_id: 'Admin@org1.example.com',
    msp_id: 'Org1MSP',
    privateKeyFolder: certDir +
      'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore',
    signedCert: certDir +
      'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/' +
      'Admin@org1.example.com-cert.pem',
    peers: [
      {
        server_hostname: 'peer0.org1.example.com',
        peer_url: url.org1.peer0_network,
        event_url: url.org1.peer0_event,
        tls_ca: certDir +
          'crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt'
      },
      {
        server_hostname: 'peer1.org1.example.com',
        peer_url: url.org1.peer1_network,
        event_url: url.org1.peer1_event,
        tls_ca: certDir +
          'crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt'
      }
    ]
  },

  // org2
  org2: {
    user_id: 'Admin@org2.example.com',
    msp_id: 'Org2MSP',
    privateKeyFolder: certDir +
      'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore',
    signedCert: certDir +
      'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/' +
      'Admin@org2.example.com-cert.pem',
    peers: [
      {
        server_hostname: 'peer0.org2.example.com',
        peer_url: url.org2.peer0_network,
        event_url: url.org2.peer0_event,
        tls_ca: certDir +
          'crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt'
      },
      {
        server_hostname: 'peer1.org2.example.com',
        peer_url: url.org2.peer1_network,
        event_url: url.org2.peer1_event,
        tls_ca: certDir +
          'crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt'
      }
    ]
  },

  keyValueStore: '/tmp/fabric-client-stateStore/'
};

module.exports = config;
