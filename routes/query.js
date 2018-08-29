'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Query');
logger.level = 'DEBUG';

let fs = require('fs');
let helper = require('./helper');
let hfc = require('fabric-client');
let options = require('./config/certConfig');

hfc.setLogger(logger);

let queryChaincode = async function (request) {
  try {
    console.log("Load privateKey and signedCert");
    let client = new hfc();
    let createUserOpt = await {
      username: options.org1_user_id,
      mspid: options.org1_msp_id,
      cryptoContent: {
        privateKey: helper.getKeyFilesInDir(options.org1_privateKeyFolder)[0],
        signedCert: options.org1_signedCert
      },
      skipPersistence: false
    };
    let store = await hfc.newDefaultKeyValueStore({
      path: "/tmp/fabric-client-stateStore/"
    });
    await client.setStateStore(store);
    await client.createUser(createUserOpt);
    let channel = client.newChannel(options.channel_id);
    let data = await fs.readFileSync(options.org1_tls_cacerts);
    let peer = client.newPeer(options.org1_network_url, {
      pem: Buffer.from(data).toString(),
      'ssl-target-name-override': options.org1_server_hostname
    });
    peer.setName('peer0');
    channel.addPeer(peer);
    console.log("Make query");
    let response_payloads = await channel.queryByChaincode(request);
    if (response_payloads) {
      let queryResult = response_payloads[0].toString();
      logger.info('Successfully queried the chaincode \'%s\' to the channel \'%s\', query result: %s',
        options.chaincode_id, options.channel_id, queryResult);
      return queryResult;
    } else {
      logger.error('response_payloads is null');
      return 'response_payloads is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};

exports.queryChaincode = queryChaincode;
