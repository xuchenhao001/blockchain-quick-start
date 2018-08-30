'use strict';

let homeDir = '/root/blockchain-quick-start/sample-network/';

/*
// url config
let url = {
  // orderer
  orderer_url: 'grpcs://orderer.example.com:7050',

  // org1
  org1: {
    peer0_network: 'grpcs://peer0.org1.example.com:7051',
    peer0_event: 'grpcs://peer0.org1.example.com:7053',
    peer1_network: 'grpcs://peer1.org1.example.com:7051',
    peer1_event: 'grpcs://peer1.org1.example.com:7053'
  },

  // org2
  org2: {
    peer0_network: 'grpcs://peer0.org2.example.com:7051',
    peer0_event: 'grpcs://peer0.org2.example.com:7053',
    peer1_network: 'grpcs://peer1.org2.example.com:7051',
    peer1_event: 'grpcs://peer1.org2.example.com:7053',
  }
};*/

let url = {
  // orderer
  orderer_url: 'grpcs://localhost:7050',

  // org1
  org1: {
    peer0_network: 'grpcs://localhost:7051',
    peer0_event: 'grpcs://localhost:7053',
    peer1_network: 'grpcs://localhost:8051',
    peer1_event: 'grpcs://localhost:8053'
  },

  // org2
  org2: {
    peer0_network: 'grpcs://localhost:9051',
    peer0_event: 'grpcs://localhost:9053',
    peer1_network: 'grpcs://localhost:10051',
    peer1_event: 'grpcs://localhost:10053',
  }
};

let config = {
  // orderer
  orderer: {
    server_hostname: 'orderer.example.com',
    url: url.orderer_url,
    tls_ca: homeDir +
      'crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt'
  },

  orgs: [
    { // org1
      name: 'org1',
      user_id: 'Admin@org1.example.com',
      msp_id: 'Org1MSP',
      privateKeyFolder: homeDir +
        'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore',
      signedCert: homeDir +
        'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/' +
        'Admin@org1.example.com-cert.pem',
      keyValueStorePath: homeDir + 'fabric-client-stateStore/org1/',
      peers: [
        {
          server_hostname: 'peer0.org1.example.com',
          peer_url: url.org1.peer0_network,
          event_url: url.org1.peer0_event,
          tls_ca: homeDir +
            'crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt'
        },
        {
          server_hostname: 'peer1.org1.example.com',
          peer_url: url.org1.peer1_network,
          event_url: url.org1.peer1_event,
          tls_ca: homeDir +
            'crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt'
        }
      ]
    },
    { // org2
      name: 'org2',
      user_id: 'Admin@org2.example.com',
      msp_id: 'Org2MSP',
      privateKeyFolder: homeDir +
        'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore',
      signedCert: homeDir +
        'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/' +
        'Admin@org2.example.com-cert.pem',
      keyValueStorePath: homeDir + 'fabric-client-stateStore/org2/',
      peers: [
        {
          server_hostname: 'peer0.org2.example.com',
          peer_url: url.org2.peer0_network,
          event_url: url.org2.peer0_event,
          tls_ca: homeDir +
            'crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt'
        },
        {
          server_hostname: 'peer1.org2.example.com',
          peer_url: url.org2.peer1_network,
          event_url: url.org2.peer1_event,
          tls_ca: homeDir +
            'crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt'
        }
      ]
    }
  ],

  channelConfigPath: homeDir + 'channel-artifacts/channel.tx',
  goPath: homeDir + 'chaincode/'
};

module.exports = config;
