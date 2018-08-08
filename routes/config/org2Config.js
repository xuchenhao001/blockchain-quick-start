var ip = require('./ipConfig');
var certDir = '/root/cics-blockchain/sample-network/';
var config = {
  user_id: 'Admin@org2.example.com',
  msp_id: 'Org2MSP',
  channel_id: 'mychannel',
  chaincode_id: 'mycc',
  peer_url: ip.org2_peer_network,
  event_url: ip.org2_event,
  orderer_url: ip.orderer_url,
  network_url: ip.org2_peer_network,
  privateKeyFolder: certDir +
    'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore',
  signedCert: certDir +
    'crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/signcerts/' +
    'Admin@org2.example.com-cert.pem',
  tls_cacerts: certDir +
    'crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt',
  peer_tls_cacerts: certDir +
    'crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt',
  orderer_tls_cacerts: certDir +
    'crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt',
  server_hostname: "peer0.org2.example.com"
};

module.exports = config;
