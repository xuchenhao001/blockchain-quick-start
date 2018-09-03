'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('fabricOprator');
logger.level = 'DEBUG';

let deployCC = require('./fabric-lib/deploy-cc');
let channel = require('./fabric-lib/channal');
let invokeCC = require('./fabric-lib/invoke-cc');

let createChannel = async function (channelName) {
  logger.debug('==================== CREATE CHANNEL ==================');

  return await channel.createChannel(channelName);
};

let joinChannel = async function (channelName) {
  logger.debug('==================== JOIN CHANNEL ==================');

  return await channel.joinChannel(channelName);
};

let installChaincode = async function (chaincodeVersion) {
  logger.debug('==================== INSTALL CHAINCODE ==================');

  let chaincodeName = 'mycc';
  let chaincodePath = 'github.com/example_cc';
  let chaincodeType = 'golang';

  return await deployCC.installChaincode(chaincodeName,
    chaincodePath, chaincodeVersion, chaincodeType);
};

let instantiateChaincode = async function (chaincodeName, chaincodeType, chaincodeVersion,
                                           channelName, functionName, args) {
  logger.debug('==================== INSTANTIATE CHAINCODE ==================');

  return await deployCC.instantiateChaincode(chaincodeName, chaincodeType,
      chaincodeVersion, channelName, functionName, args);
};

let invokeChaincode = async function (chaincodeName, channelName, functionName, args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');

  return await invokeCC.invokeChaincode(chaincodeName, channelName, functionName, args);
};

let queryChaincode = async function (chaincodeName, channelName, functionName, args) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');

  return await invokeCC.queryChaincode(chaincodeName, channelName, functionName, args);
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.installChaincode = installChaincode;
exports.instantiateChaincode = instantiateChaincode;
exports.invokeChaincode = invokeChaincode;
exports.queryChaincode = queryChaincode;
