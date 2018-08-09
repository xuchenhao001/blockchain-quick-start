//ip config
let ip = '127.0.0.1';
let ipConfig = {
  //org1
  org1_peer_network: 'grpcs://' + ip + ':7051',
  org1_event: 'grpcs://' + ip + ':7053',
  //org2
  org2_peer_network: 'grpcs://' + ip + ':9051',
  org2_event: 'grpcs://' + ip + ':9053',
  //order
  orderer_url: 'grpcs://' + ip + ':7050'
};

module.exports = ipConfig;
