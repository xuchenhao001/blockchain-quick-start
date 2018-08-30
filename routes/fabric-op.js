'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('fabricOprator');
logger.level = 'DEBUG';

let deployCC = require('./fabric-lib/deploy-cc');
let channel = require('./fabric-lib/channal');
let query = require('./fabric-lib/query');
let invoke = require('./fabric-lib/invoke');

let createChannel = async function (channelName) {
  logger.debug('==================== CREATE CHANNEL ==================');
  let orgName = 'org1';

  return await channel.createChannel(channelName, orgName);
};

let joinChannel = async function (channelName) {
  logger.debug('==================== JOIN CHANNEL ==================');
  let orgNames = ['org1', 'org2'];

  return await channel.joinChannel(channelName, orgNames);
};

let installChaincode = async function (chaincodeVersion) {
  logger.debug('==================== INSTALL CHAINCODE ==================');
  let chaincodeName = 'mycc';
  let chaincodePath = 'github.com/example_cc';
  let chaincodeType = 'golang';
  let orgNames = ['org1', 'org2'];

  return await deployCC.installChaincode(orgNames, chaincodeName,
    chaincodePath, chaincodeVersion, chaincodeType);
};

let instantiateChaincode = async function (chaincodeVersion) {
  logger.debug('==================== INSTANTIATE CHAINCODE ==================');
  let args = [];
  let chaincodeName = 'mycc';
  let chaincodeType = 'golang';
  let channelName = 'mychannel';
  let functionName = '';
  let orgNames = ['org1', 'org2'];

  return await deployCC.instantiateChaincode(orgNames, channelName,
    chaincodeName, chaincodeVersion, functionName, chaincodeType, args);
};

let initInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let chaincodeName = 'mycc';
  let channelName = 'mychannel';
  let functionName = 'initAccount';
  let orgNames = ['org1', 'org2'];
  return await invoke.invokeChaincode(chaincodeName, channelName, functionName, orgNames, args);
};

let addPointsInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let chaincodeName = 'mycc';
  let channelName = 'mychannel';
  let functionName = 'addPoints';
  let orgNames = ['org1', 'org2'];
  return await invoke.invokeChaincode(chaincodeName, channelName, functionName, orgNames, args);
};

let balanceQuery = async function (args) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');
  let chaincodeName = 'mycc';
  let channelName = 'mychannel';
  let functionName = 'balanceQuery';
  let orgName = 'org1';
  return await query.queryChaincode(chaincodeName, channelName, functionName, orgName, args);
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.installChaincode = installChaincode;
exports.instantiateChaincode = instantiateChaincode;
exports.initInvoke = initInvoke;
exports.addPointsInvoke = addPointsInvoke;
exports.balanceQuery = balanceQuery;
