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
  return await channel.createChannel(channelName);
};

let joinChannel = async function (channelName) {
  logger.debug('==================== JOIN CHANNEL ==================');
  let orgName = 'org1';
  let joinResult = await channel.joinChannel(channelName, orgName);
  if (joinResult[0] !== true) {
    return [false, joinResult[1]];
  }
  orgName = 'org2';
  joinResult = await channel.joinChannel(channelName, orgName);
  if (joinResult[0] !== true) {
    return [false, joinResult[1]];
  }
  return [true, joinResult[1]];
};

let installChaincode = async function (chaincodeVersion) {
  logger.debug('==================== INSTALL CHAINCODE ==================');
  let orgNames = ['org1', 'org2'];
  let installResult = await deployCC.installChaincode(orgNames, 'mycc',
    'github.com/example_cc', chaincodeVersion, 'golang');
  if (installResult[0] !== true) {
    return [false, installResult[1]];
  }
  return [true, installResult[1]];
};

let instantiateChaincode = async function (chaincodeVersion) {
  logger.debug('==================== INSTANTIATE CHAINCODE ==================');
  let orgNames = ['org1', 'org2'];
  let instantiateResult = await deployCC.instantiateChaincode('mychannel', 'mycc',
    chaincodeVersion, '', 'golang', [], orgNames);
  if (instantiateResult[0] !== true) {
    return [false, instantiateResult[1]];
  }
  return [true, instantiateResult[1]];
};

let initInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "initAccount",
    args: args,
    chainId: "mychannel"
  };
  let orgNames = ['org1', 'org2'];
  return await invoke.invokeChaincode(request, orgNames);
};

let addPointsInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "addPoints",
    args: args,
    chainId: "mychannel"
  };
  let orgNames = ['org1', 'org2'];
  return await invoke.invokeChaincode(request, orgNames);
};

let balanceQuery = async function (args) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');
  let request = {
    chaincodeId: 'mycc',
    fcn: 'balanceQuery',
    args: args
  };
  return await query.queryChaincode(request, 'org1');
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.installChaincode = installChaincode;
exports.instantiateChaincode = instantiateChaincode;
exports.initInvoke = initInvoke;
exports.addPointsInvoke = addPointsInvoke;
exports.balanceQuery = balanceQuery;
