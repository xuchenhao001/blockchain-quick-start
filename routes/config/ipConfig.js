//ip config
let org1IP = 'peer0.org1.example.com';
let org2IP = 'peer0.org2.example.com';
let orderIP = 'orderer.example.com'
let ipConfig = {
  //org1
  org1_peer_network: 'grpcs://' + org1IP + ':7051',
  org1_event: 'grpcs://' + org1IP + ':7053',
  //org2
  org2_peer_network: 'grpcs://' + org2IP + ':9051',
  org2_event: 'grpcs://' + org2IP + ':9053',
  //order
  orderer_url: 'grpcs://' + orderIP + ':7050'
};

module.exports = ipConfig;
