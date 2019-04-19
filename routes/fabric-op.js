'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('FabricOprator');
logger.level = 'DEBUG';

let deployCC = require('./fabric-lib/deploy-cc');
let channel = require('./fabric-lib/channal');
let invokeCC = require('./fabric-lib/invoke-cc');
let explorer = require('./fabric-lib/explorer');

let createChannel = async function (channelName, includeOrgNames, ordererName, orgName) {
  logger.info('==================== CREATE CHANNEL ==================');

  return await channel.createChannel(channelName, includeOrgNames, ordererName, orgName);
};

let joinChannel = async function (channelName, orderers, orgName, peers) {
  logger.info('==================== JOIN CHANNEL ==================');

  return await channel.joinChannel(channelName, orderers, orgName, peers);
};

let updateAnchorPeer = async function (channelName, orderers, orgName, peers) {
  logger.info('==================== UPDATE CHANNEL ANCHOR PEER ==================');

  return await channel.updateAnchorPeer(channelName, orderers, orgName, peers);
};

let modifyPolicy = async function (channelName, orderers, orgName, modifyPolicySignBy, policyName, policyType,
                                   policyValue) {
  logger.info('==================== MODIFY CHANNEL Policy ==================');

  return await channel.modifyPolicy(channelName, orderers, orgName, modifyPolicySignBy, policyName, policyType,
    policyValue);
};

let modifyACL = async function (channelName, orderers, orgName, resource, policy, modifyACLSignBy) {
  logger.info('==================== MODIFY CHANNEL ACLs ==================');

  return await channel.modifyACL(channelName, orderers, orgName, resource, policy, modifyACLSignBy);
};

let addOrgToChannelWithCerts = async function (newOrgDetail, addOrgSignBy, channelName, orderers, orgName) {
  logger.info('==================== ADD ORG TO CHANNEL ==================');

  let withCerts = true;
  let isRemove = false;
  return await channel.modifyOrg(newOrgDetail, addOrgSignBy, channelName, orderers, orgName, isRemove, withCerts);
};

let addOrgToChannel = async function (newOrgDetail, addOrgSignBy, channelName, orderers, orgName) {
  logger.info('==================== ADD ORG TO CHANNEL ==================');

  let withCerts = false;
  let isRemove = false;
  return await channel.modifyOrg(newOrgDetail, addOrgSignBy, channelName, orderers, orgName, isRemove, withCerts);
};

let delOrgFromChannel = async function (delOrgName, delOrgSignBy, channelName, orderers, orgName) {
  logger.info('==================== DEL ORG TO CHANNEL ==================');

  let withCerts = false;
  let isRemove = true;
  return await channel.modifyOrg(delOrgName, delOrgSignBy, channelName, orderers, orgName, isRemove, withCerts);
};

let installChaincode = async function (chaincodeContent, chaincodeName, chaincodePath, chaincodeType,
                                       chaincodeVersion, endorsementPolicy, collection, initRequired,
                                       orgName, peers, localPath) {
  logger.info('==================== INSTALL CHAINCODE ==================');

  return await deployCC.installChaincode(chaincodeContent, chaincodeName, chaincodePath, chaincodeType,
    chaincodeVersion, endorsementPolicy, collection, initRequired, orgName, peers, localPath);
};

let approveChaincode = async function (chaincodeName, chaincodeVersion, chaincodePackageId, chaincodeSequence,
                                       channelName, orderers, orgName, peers) {
  logger.info('==================== APPROVE CHAINCODE ==================');

  return await deployCC.approveChaincode(chaincodeName, chaincodeVersion, chaincodePackageId, chaincodeSequence,
    channelName, orderers, orgName, peers);
};

let commitChaincode = async function (chaincodeName, chaincodeVersion, chaincodeSequence, channelName, orderers,
                                       orgName, peers) {
  logger.info('==================== COMMIT CHAINCODE ==================');

  return await deployCC.commitChaincode(chaincodeName, chaincodeVersion, chaincodeSequence, channelName, orderers,
    orgName, peers);
};

let instantiateChaincode = async function (chaincodeName, channelName, args, orderers, orgName, peers) {
  logger.info('==================== INSTANTIATE CHAINCODE ==================');

  return await invokeCC.instantiateChaincode(chaincodeName, channelName, args, orderers, orgName, peers);
};

let upgradeChaincode = async function (chaincodeName, chaincodeType, chaincodeVersion, channelName, functionName,
                                           args, orderers, orgName, peers, endorsementPolicy, collection,
                                           useDiscoverService) {
  logger.info('==================== INSTANTIATE CHAINCODE ==================');

  return await deployCC.instantiateUpgradeChaincode(chaincodeName, chaincodeType, chaincodeVersion, channelName,
    functionName, args, orderers, orgName, peers, endorsementPolicy, collection, useDiscoverService, true);
};

let invokeChaincode = async function (chaincodeName, channelName, functionName, args,
                                      orderers, orgName, peers, transient, useDiscoverService) {
  logger.info('==================== INVOKE ON CHAINCODE ==================');

  return await invokeCC.invokeChaincode(chaincodeName, channelName, functionName, args,
    orderers, orgName, peers, transient, useDiscoverService);
};

let queryChaincode = async function (chaincodeName, channelName, functionName, args,
                                     orderers, orgName, peers, transient, useDiscoverService) {
  logger.info('==================== QUERY BY CHAINCODE ==================');

  return await invokeCC.queryChaincode(chaincodeName, channelName, functionName, args,
    orderers, orgName, peers, transient, useDiscoverService);
};

let queryInfo = async function (channelName, orderers, orgName, peers) {
  logger.info('==================== QUERY INFO ==================');

  return await explorer.queryInfo(channelName, orderers, orgName, peers);
};

let queryBlock = async function (channelName, orderers, orgName, peers, blockNumber) {
  logger.info('==================== QUERY Block ==================');

  return await explorer.queryBlock(channelName, orderers, orgName, peers, blockNumber);
};

let queryTransaction = async function (channelName, orderers, orgName, peers, txId) {
  logger.info('==================== QUERY Transaction ==================');

  return await explorer.queryTransaction(channelName, orderers, orgName, peers, txId);
};

let queryInstalledChaincodes = async function (orgName, peer) {
  logger.info('==================== QUERY Installed Chaindoes ==================');

  return await explorer.queryInstalledChaincodes(orgName, peer);
};

let queryChaincodeApprovalStatus = async function (chaincodeName, chaincodeVersion, chaincodeSequence, channelName,
                                                   orderers, orgName, peer) {
  logger.info('==================== QUERY Chaincode Approval Status ==================');

  return await explorer.queryChaincodeApprovalStatus(chaincodeName, chaincodeVersion, chaincodeSequence, channelName,
    orderers, orgName, peer);
};

let queryChaincodeDefinition = async function (channelName, chaincodeName, orderers, orgName, peer) {
  logger.info('==================== QUERY Chaincode Definition ==================');

  return await explorer.queryChaincodeDefinition(channelName, chaincodeName, orderers, orgName, peer);
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.updateAnchorPeer = updateAnchorPeer;
exports.modifyPolicy = modifyPolicy;
exports.modifyACL = modifyACL;
exports.addOrgToChannelWithCerts = addOrgToChannelWithCerts;
exports.addOrgToChannel = addOrgToChannel;
exports.delOrgFromChannel = delOrgFromChannel;
exports.installChaincode = installChaincode;
exports.approveChaincode = approveChaincode;
exports.commitChaincode = commitChaincode;
exports.instantiateChaincode = instantiateChaincode;
exports.upgradeChaincode = upgradeChaincode;
exports.invokeChaincode = invokeChaincode;
exports.queryChaincode = queryChaincode;
exports.queryInfo = queryInfo;
exports.queryBlock = queryBlock;
exports.queryTransaction = queryTransaction;
exports.queryInstalledChaincodes = queryInstalledChaincodes;
exports.queryChaincodeApprovalStatus = queryChaincodeApprovalStatus;
exports.queryChaincodeDefinition = queryChaincodeDefinition;
