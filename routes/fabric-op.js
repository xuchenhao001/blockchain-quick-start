'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('fabricOprator');
logger.level = 'DEBUG';

let deployCC = require('./fabric-lib/deploy-cc');
let channel = require('./fabric-lib/channal');
let invokeCC = require('./fabric-lib/invoke-cc');

let createChannel = async function (channelName, includeOrgNames, ordererName, orgName) {
  logger.debug('==================== CREATE CHANNEL ==================');

  return await channel.createChannel(channelName, includeOrgNames, ordererName, orgName);
};

let joinChannel = async function (channelName, orderers, orgName, peers) {
  logger.debug('==================== JOIN CHANNEL ==================');

  return await channel.joinChannel(channelName, orderers, orgName, peers);
};

let installChaincode = async function (chaincode, chaincodeName, chaincodePath, chaincodeType,
                                       chaincodeVersion, orgName, peers, localPath) {
  logger.debug('==================== INSTALL CHAINCODE ==================');

  return await deployCC.installChaincode(chaincode, chaincodeName, chaincodePath, chaincodeType,
    chaincodeVersion, orgName, peers, localPath);
};

let instantiateChaincode = async function (chaincodeName, chaincodeType, chaincodeVersion, channelName, functionName,
                                           args, orderers, orgName, peers, endorsementPolicy, collection,
                                           useDiscoverService) {
  logger.debug('==================== INSTANTIATE CHAINCODE ==================');

  return await deployCC.instantiateChaincode(chaincodeName, chaincodeType, chaincodeVersion, channelName, functionName,
    args, orderers, orgName, peers, endorsementPolicy, collection, useDiscoverService);
};

let invokeChaincode = async function (chaincodeName, channelName, functionName, args,
                                      orderers, orgName, peers, transient, useDiscoverService) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');

  return await invokeCC.invokeChaincode(chaincodeName, channelName, functionName, args,
    orderers, orgName, peers, transient, useDiscoverService);
};

let queryChaincode = async function (chaincodeName, channelName, functionName, args,
                                     orderers, orgName, peers, transient, useDiscoverService) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');

  return await invokeCC.queryChaincode(chaincodeName, channelName, functionName, args,
    orderers, orgName, peers, transient, useDiscoverService);
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.installChaincode = installChaincode;
exports.instantiateChaincode = instantiateChaincode;
exports.invokeChaincode = invokeChaincode;
exports.queryChaincode = queryChaincode;
