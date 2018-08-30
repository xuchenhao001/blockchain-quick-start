'use strict';

let homeDir = '/var/';

// ip config
let ip= {
  order: 'orderer.example.com',
  peer0_org1: 'peer0.org1.example.com',
  peer1_org1: 'peer1.org1.example.com',
  peer0_org2: 'peer0.org2.example.com',
  peer1_org2: 'peer1.org2.example.com',
};


let url = {
  // orderer
  orderer_url: 'grpcs://' + ip.order + ':7050',

  // org1
  org1: {
    peer0_network: 'grpcs://' + ip.peer0_org1 + ':7051',
    peer0_event: 'grpcs://' + ip.peer0_org1 + ':7053',
    peer1_network: 'grpcs://' + ip.peer1_org1 + ':7051',
    peer1_event: 'grpcs://' + ip.peer1_org1 + ':7053'
  },

  // org2
  org2: {
    peer0_network: 'grpcs://' + ip.peer0_org2 + ':7051',
    peer0_event: 'grpcs://' + ip.peer0_org2 + ':7053',
    peer1_network: 'grpcs://' + ip.peer1_org2 + ':7051',
    peer1_event: 'grpcs://' + ip.peer1_org2 + ':7053',
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

  // org1
  org1: {
    user_id: 'Admin@org1.example.com',
    msp_id: 'Org1MSP',
    privateKeyFolder: homeDir +
      'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore',
    signedCert: homeDir +
      'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/' +
      'Admin@org1.example.com-cert.pem',
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

  // org2
  org2: {
    user_id: 'Admin@org2.example.com',
    msp_id: 'Org2MSP',
    privateKeyFolder: homeDir +
      'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore',
    signedCert: homeDir +
      'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/' +
      'Admin@org2.example.com-cert.pem',
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
  },

  keyValueStorePath: homeDir + 'fabric-client-stateStore/',
  channelConfigPath: homeDir + 'channel-artifacts/channel.tx',
  goPath: homeDir + 'chaincode/'
};

module.exports = config;
