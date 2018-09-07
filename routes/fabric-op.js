'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('fabricOprator');
logger.level = 'DEBUG';

let deployCC = require('./fabric-lib/deploy-cc');
let channel = require('./fabric-lib/channal');
let invokeCC = require('./fabric-lib/invoke-cc');

let createChannel = async function (channelName, ordererName, orgName) {
  logger.debug('==================== CREATE CHANNEL ==================');

  return await channel.createChannel(channelName, ordererName, orgName);
};

let joinChannel = async function (channelName, ordererName, orgName, peers) {
  logger.debug('==================== JOIN CHANNEL ==================');

  return await channel.joinChannel(channelName, ordererName, orgName, peers);
};

let installChaincode = async function (chaincodeName, chaincodePath, chaincodeType,
                                       chaincodeVersion, orgName, peers) {
  logger.debug('==================== INSTALL CHAINCODE ==================');

  return await deployCC.installChaincode(chaincodeName, chaincodePath,
    chaincodeType, chaincodeVersion, orgName, peers);
};

let instantiateChaincode = async function (chaincodeName, chaincodeType, chaincodeVersion,
                                           channelName, functionName, args, ordererName, orgName, peers) {
  logger.debug('==================== INSTANTIATE CHAINCODE ==================');

  return await deployCC.instantiateChaincode(chaincodeName, chaincodeType,
      chaincodeVersion, channelName, functionName, args, ordererName, orgName, peers);
};

let invokeChaincode = async function (chaincodeName, channelName, functionName, args, ordererName, orgName, peers) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');

  return await invokeCC.invokeChaincode(chaincodeName, channelName, functionName, args, ordererName, orgName, peers);
};

let queryChaincode = async function (chaincodeName, channelName, functionName, args, ordererName, orgName, peers) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');

  return await invokeCC.queryChaincode(chaincodeName, channelName, functionName, args, ordererName, orgName, peers);
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.installChaincode = installChaincode;
exports.instantiateChaincode = instantiateChaincode;
exports.invokeChaincode = invokeChaincode;
exports.queryChaincode = queryChaincode;
