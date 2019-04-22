'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('Explorer');
logger.level = 'DEBUG';

const helper = require('./helper');

let queryInfo = async function (channelName, orderers, orgName, peers) {
  logger.debug('\n\n============ Query blockchain info from org \'' + orgName + '\' ============\n');
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    let response_payloads = await channel.queryInfo(null, true);
    logger.debug("Channel [" + channelName + "] query info result: " + JSON.stringify(response_payloads));
    let response = {
      height: Number(response_payloads.height),
      currentBlockHash: helper.bufferToString(response_payloads.currentBlockHash.buffer),
      previousBlockHash: helper.bufferToString(response_payloads.previousBlockHash.buffer)
    };
    logger.debug(JSON.stringify(response));
    return [true, response];

  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return [false, error.toString()];
  }
};

let queryBlock = async function (channelName, orderers, orgName, peers, blockNumber) {
  logger.debug('\n\n============ Query block info from org \'' + orgName + '\' ============\n');
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    let response_payloads = await channel.queryBlock(blockNumber, null, true);
    logger.debug("Channel [" + channelName + "] query block [" + blockNumber + "] result: " +
      JSON.stringify(response_payloads));
    helper.bufferToString(response_payloads);
    logger.debug(JSON.stringify(response_payloads));
    return [true, response_payloads];

  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return [false, error.toString()];
  }
};

let queryTransaction = async function (channelName, orderers, orgName, peers, txId) {
  logger.debug('\n\n============ Query Transaction info from org \'' + orgName + '\' ============\n');
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    let response_payloads = await channel.queryTransaction(txId, null, true);
    logger.debug("Channel [" + channelName + "] query transaction [" + txId + "] result: " +
      JSON.stringify(response_payloads));
    helper.bufferToString(response_payloads);
    logger.debug(JSON.stringify(response_payloads));
    return [true, response_payloads];
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return [false, error.toString()];
  }
};

let queryInstalledChaincodes = async function (orgName, peerName) {
  logger.debug('\n\n============ Query Installed Chaincodes from org \'' + orgName + '\' ============\n');
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);

    let response_payloads = await client.queryInstalledChaincodes(client.getPeer(peerName), true);
    logger.debug("Peer [" + peerName + "] query installed chaincodes result: " +
      JSON.stringify(response_payloads));
    helper.bufferToString(response_payloads);
    logger.debug(JSON.stringify(response_payloads));
    return [true, response_payloads];
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return [false, error.toString()];
  }
};

let queryChaincodeApprovalStatus = async function (chaincodeInfo, channelName, orderers, orgName, peerName) {
  logger.debug('\n\n============ Query Chaincode Approval status from org \'' + orgName + '\' ============\n');
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    channel.addPeer(client.getPeer(peerName));

    // construct a new chaincode object
    let chaincode = client.newChaincode(chaincodeInfo.chaincodeName, chaincodeVersion);
    chaincode.setSequence(chaincodeSequence);

    let tx_id = client.newTransactionID(true);
    let request = {
      target: peerName,
      chaincode: chaincode,
      txId: tx_id
    };

    let response_payloads = await channel.queryApprovalStatus(request);
    logger.debug("Channel [" + channelName + "] query chaincode approval status from peer [" + peerName + "] result: " +
      JSON.stringify(response_payloads));
    helper.bufferToString(response_payloads);
    logger.debug(JSON.stringify(response_payloads));
    return [true, response_payloads];
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return [false, error.toString()];
  }
};

let queryChaincodeDefinition = async function (channelName, chaincodeName, orderers, orgName, peerName) {
  logger.debug('\n\n============ Query Chaincode Definition info from org \'' + orgName + '\' ============\n');
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    channel.addPeer(client.getPeer(peerName));

    let tx_id = client.newTransactionID(true);
    let request = {
      target: peerName,
      chaincodeId: chaincodeName,
      txId: tx_id
    };

    let response_payloads = await channel.queryChaincodeDefinition(request);
    logger.debug("Channel [" + channelName + "] query chaincode definition [" + chaincodeName + "] result: " +
      JSON.stringify(response_payloads));
    helper.bufferToString(response_payloads);
    logger.debug(JSON.stringify(response_payloads));
    return [true, response_payloads];
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return [false, error.toString()];
  }
};

exports.queryInfo = queryInfo;
exports.queryBlock = queryBlock;
exports.queryTransaction = queryTransaction;
exports.queryInstalledChaincodes = queryInstalledChaincodes;
exports.queryChaincodeApprovalStatus = queryChaincodeApprovalStatus;
exports.queryChaincodeDefinition = queryChaincodeDefinition;
