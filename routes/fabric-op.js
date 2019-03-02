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

let updateAnchorPeer = async function (channelName, orderers, orgName, peers) {
  logger.debug('==================== UPDATE CHANNEL ANCHOR PEER ==================');

  return await channel.updateAnchorPeer(channelName, orderers, orgName, peers);
};

let modifyACL = async function (channelName, orderers, orgName, resource, policy, modifyACLSignBy) {
  logger.debug('==================== MODIFY CHANNEL ACLs ==================');

  return await channel.modifyACL(channelName, orderers, orgName, resource, policy, modifyACLSignBy);
};

let addOrgToChannelWithCerts = async function (newOrgDetail, addOrgSignBy, channelName, orderers, orgName) {
  logger.debug('==================== ADD ORG TO CHANNEL ==================');

  let withCerts = true;
  let isRemove = false;
  return await channel.modifyOrg(newOrgDetail, addOrgSignBy, channelName, orderers, orgName, isRemove, withCerts);
};

let addOrgToChannel = async function (newOrgDetail, addOrgSignBy, channelName, orderers, orgName) {
  logger.debug('==================== ADD ORG TO CHANNEL ==================');

  let withCerts = false;
  let isRemove = false;
  return await channel.modifyOrg(newOrgDetail, addOrgSignBy, channelName, orderers, orgName, isRemove, withCerts);
};

let delOrgFromChannel = async function (delOrgName, delOrgSignBy, channelName, orderers, orgName) {
  logger.debug('==================== DEL ORG TO CHANNEL ==================');

  let withCerts = false;
  let isRemove = true;
  return await channel.modifyOrg(delOrgName, delOrgSignBy, channelName, orderers, orgName, isRemove, withCerts);
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

  return await deployCC.instantiateUpgradeChaincode(chaincodeName, chaincodeType, chaincodeVersion, channelName,
    functionName, args, orderers, orgName, peers, endorsementPolicy, collection, useDiscoverService);
};

let upgradeChaincode = async function (chaincodeName, chaincodeType, chaincodeVersion, channelName, functionName,
                                           args, orderers, orgName, peers, endorsementPolicy, collection,
                                           useDiscoverService) {
  logger.debug('==================== INSTANTIATE CHAINCODE ==================');

  return await deployCC.instantiateUpgradeChaincode(chaincodeName, chaincodeType, chaincodeVersion, channelName,
    functionName, args, orderers, orgName, peers, endorsementPolicy, collection, useDiscoverService, true);
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
exports.updateAnchorPeer = updateAnchorPeer;
exports.modifyACL = modifyACL;
exports.addOrgToChannelWithCerts = addOrgToChannelWithCerts;
exports.addOrgToChannel = addOrgToChannel;
exports.delOrgFromChannel = delOrgFromChannel;
exports.installChaincode = installChaincode;
exports.instantiateChaincode = instantiateChaincode;
exports.upgradeChaincode = upgradeChaincode;
exports.invokeChaincode = invokeChaincode;
exports.queryChaincode = queryChaincode;
