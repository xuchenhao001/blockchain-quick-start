'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Query');
logger.level = 'DEBUG';

let options = require('./config/org1Config');
let hfc = require('fabric-client');
let path = require('path');
let fs = require('fs');

hfc.setLogger(logger);

function getKeyFilesInDir(dir) {
  let files = fs.readdirSync(dir);
  let keyFiles = [];
  files.forEach(function (file_name) {
    let filePath = path.join(dir, file_name);
    if (file_name.endsWith('_sk')) {
      keyFiles.push(filePath)
    }
  });
  return keyFiles
}

let queryChaincode = async function (request) {
  try {
    console.log("Load privateKey and signedCert");
    let client = new hfc();
    let createUserOpt = await {
      username: options.user_id,
      mspid: options.msp_id,
      cryptoContent: {
        privateKey: getKeyFilesInDir(options.privateKeyFolder)[0],
        signedCert: options.signedCert
      }
    };
    let store = await hfc.newDefaultKeyValueStore({
      path: "/tmp/fabric-client-stateStore/"
    });
    await client.setStateStore(store);
    await client.createUser(createUserOpt);
    let channel = client.newChannel(options.channel_id);
    let data = await fs.readFileSync(options.tls_cacerts);
    let peer = client.newPeer(options.network_url, {
      pem: Buffer.from(data).toString(),
      'ssl-target-name-override': options.server_hostname
    });
    peer.setName('peer0');
    channel.addPeer(peer);
    console.log("Make query");
    let query_responses = await channel.queryByChaincode(request);
    console.log("returned from query");
    if (!query_responses.length) {
      console.log("No payloads were returned from query");
    } else {
      console.log("Query result count = ", query_responses.length)
    }
    if (query_responses[0] instanceof Error) {
      console.error("error from query = ", query_responses[0]);
    }
    console.log("Response from blockchain is ", query_responses[0].toString());//打印返回的结果
    return query_responses[0].toString();
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};

exports.queryChaincode = queryChaincode;
