//ip config
var ip = '148.100.5.0';
var ipConfig = {
  //org1
  org1_peer_network: 'grpcs://'+ip+':7051',
  org1_event: 'grpcs://'+ip+':7053',
  //org2
  org2_peer_network: 'grpcs://'+ip+':8051',
  org2_event: 'grpcs://'+ip+':8053',
  //order
  orderer_url: 'grpcs://'+ip+':7050'
};

module.exports = ipConfig;
