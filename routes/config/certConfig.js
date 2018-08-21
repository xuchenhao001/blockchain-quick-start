let ip = require('./ipConfig');
let certDir = '/var/';
let config = {
  channel_id: 'mychannel',
  chaincode_id: 'mycc',
  orderer_url: ip.orderer_url,
  orderer_tls_cacerts: certDir +
    'crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt',

  // org1
  org1_user_id: 'Admin@org1.example.com',
  org1_msp_id: 'Org1MSP',
  org1_peer_url: ip.org1_peer_network,
  org1_event_url: ip.org1_event,
  org1_network_url: ip.org1_peer_network,
  org1_privateKeyFolder: certDir +
    'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore',
  org1_signedCert: certDir +
    'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/' +
    'Admin@org1.example.com-cert.pem',
  org1_tls_cacerts: certDir +
    'crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt',
  org1_peer_tls_cacerts: certDir +
    'crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt',
  org1_server_hostname: "peer0.org1.example.com",

  // org2
  org2_user_id: 'Admin@org2.example.com',
  org2_msp_id: 'Org2MSP',
  org2_peer_url: ip.org2_peer_network,
  org2_event_url: ip.org2_event,
  org2_network_url: ip.org2_peer_network,
  org2_privateKeyFolder: certDir +
    'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore',
  org2_signedCert: certDir +
    'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/' +
    'Admin@org2.example.com-cert.pem',
  org2_tls_cacerts: certDir +
    'crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt',
  org2_peer_tls_cacerts: certDir +
    'crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt',
  org2_server_hostname: "peer0.org2.example.com"
};

module.exports = config;
