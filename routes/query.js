'use strict';

let util = require('util');
let helper = require('./helper.js');
let logger = helper.getLogger('Query');
let options = require('./config/org1Config');
let hfc = require('fabric-client');

let path = require('path');
let fs = require('fs');
let sdkUtils = require('fabric-client/lib/utils');


function getKeyFilesInDir(dir) {
  let files = fs.readdirSync(dir);
  let keyFiles = [];
  files.forEach(function (file_name) {
    let filePath = path.join(dir,file_name);
    if (file_name.endsWith('_sk')) {
      keyFiles.push(filePath)
    }
  });
  return keyFiles
}

let queryChaincode = async function (request) {
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
  let data = fs.readFileSync(options.tls_cacerts);
  let peer = client.newPeer(options.network_url, {
    pem: Buffer.from(data).toString(),
      'ssl-target-name-override': options.server_hostname
  });
  peer.setName('peer0');
  channel.addPeer(peer);
  console.log("Make query");
  let transaction_id = client.newTransactionID();
  console.log("Assigning transaction_id: ", transaction_id._transaction_id);
  request.txid = transaction_id;
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
  let str = query_responses[0].toString();
  return str;
};


let queryChaincode2 = async function(peer, channelName, chaincodeName, args, fcn, username, org_name) {
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(org_name, username);
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
    let channel = client.getChannel(channelName);
    if(!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    // send query
    let request = {
      targets : [peer], //queryByChaincode allows for multiple targets
      chaincodeId: chaincodeName,
      fcn: fcn,
      args: args
    };
    let response_payloads = await channel.queryByChaincode(request);
    if (response_payloads) {
      for (let i = 0; i < response_payloads.length; i++) {
        logger.info(args[0]+' now has ' + response_payloads[i].toString('utf8') +
          ' after the move');
      }
      return args[0]+' now has ' + response_payloads[0].toString('utf8') +
        ' after the move';
    } else {
      logger.error('response_payloads is null');
      return 'response_payloads is null';
    }
  } catch(error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
let getBlockByNumber = async function(peer, channelName, blockNumber, username, org_name) {
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(org_name, username);
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
    let channel = client.getChannel(channelName);
    if(!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryBlock(parseInt(blockNumber, peer));
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch(error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
let getTransactionByID = async function(peer, channelName, trxnID, username, org_name) {
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(org_name, username);
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
    let channel = client.getChannel(channelName);
    if(!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryTransaction(trxnID, peer);
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch(error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
let getBlockByHash = async function(peer, channelName, hash, username, org_name) {
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(org_name, username);
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
    let channel = client.getChannel(channelName);
    if(!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryBlockByHash(Buffer.from(hash), peer);
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch(error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
let getChainInfo = async function(peer, channelName, username, org_name) {
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(org_name, username);
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
    let channel = client.getChannel(channelName);
    if(!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryInfo(peer);
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch(error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
//getInstalledChaincodes
let getInstalledChaincodes = async function(peer, channelName, type, username, org_name) {
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(org_name, username);
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

    let response = null;
    if (type === 'installed') {
      response = await client.queryInstalledChaincodes(peer, true); //use the admin identity
    } else {
      let channel = client.getChannel(channelName);
      if(!channel) {
        let message = util.format('Channel %s was not defined in the connection profile', channelName);
        logger.error(message);
        throw new Error(message);
      }
      response = await channel.queryInstantiatedChaincodes(peer, true); //use the admin identity
    }
    if (response) {
      if (type === 'installed') {
        logger.debug('<<< Installed Chaincodes >>>');
      } else {
        logger.debug('<<< Instantiated Chaincodes >>>');
      }
      let details = [];
      for (let i = 0; i < response.chaincodes.length; i++) {
        logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
          response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
        );
        details.push('name: ' + response.chaincodes[i].name + ', version: ' +
          response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
        );
      }
      return details;
    } else {
      logger.error('response is null');
      return 'response is null';
    }
  } catch(error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
let getChannels = async function(peer, username, org_name) {
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(org_name, username);
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

    let response = await client.queryChannels(peer);
    if (response) {
      logger.debug('<<< channels >>>');
      let channelNames = [];
      for (let i = 0; i < response.channels.length; i++) {
        channelNames.push('channel id: ' + response.channels[i].channel_id);
      }
      logger.debug(channelNames);
      return response;
    } else {
      logger.error('response_payloads is null');
      return 'response_payloads is null';
    }
  } catch(error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};

exports.queryChaincode = queryChaincode;
exports.getBlockByNumber = getBlockByNumber;
exports.getTransactionByID = getTransactionByID;
exports.getBlockByHash = getBlockByHash;
exports.getChainInfo = getChainInfo;
exports.getInstalledChaincodes = getInstalledChaincodes;
exports.getChannels = getChannels;
