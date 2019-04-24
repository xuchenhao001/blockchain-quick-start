'use strict';

let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('REST');
logger.level = 'DEBUG';

let fabric = require('../fabric-op');
let common = require('./common');

router.post('/chaincode/install', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeContent', 'chaincodeName', 'chaincodeType',
    'chaincodeVersion', 'chaincodeSequence', 'orgName', 'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let chaincodePath = req.body.chaincodePath;
  if (typeof chaincodePath === 'undefined') {
    chaincodePath = 'github.com/chaincode';
    logger.debug("Chaincode path not found, set to default: " + JSON.stringify(chaincodePath));
  }
  logger.debug("Get chaincode path: " + JSON.stringify(chaincodePath));

  // endorsementPolicy could be undefined (default is "any member of the organizations in the channel")
  let endorsementPolicy = req.body.endorsementPolicy;
  if (endorsementPolicy) {
    if (typeof endorsementPolicy === 'object') {
      logger.debug("Get endorsement policy object: " + JSON.stringify(endorsementPolicy));
    } else {
      logger.debug("Get endorsement policy: " + endorsementPolicy);
    }
  } else {
    logger.debug("Doesn't get endorsementPolicy, default set to null");
  }

  // collection can be undefined
  let collection = req.body.collection;
  if (collection) {
    if (typeof collection === 'object') {
      logger.debug("Get collection object: " + JSON.stringify(collection));
    } else {
      logger.debug("Get collection: " + collection);
    }
  } else {
    logger.debug("Doesn't get collection, default set to null");
  }

  // initRequired can be undefined
  let initRequired = req.body.initRequired;
  if (initRequired) {
    logger.debug("Get initRequired: " + initRequired);
  } else {
    initRequired = false;
    logger.debug("Doesn't get initRequired, default set to false");
  }

  let localPath = req.body.localPath;
  if (localPath) {
    logger.debug('Detected localPath, install from local path: ' + localPath);
  }

  let result = await fabric.installChaincode(req.body.chaincodeContent, req.body.chaincodeName, chaincodePath,
    req.body.chaincodeType, req.body.chaincodeVersion, req.body.chaincodeSequence, endorsementPolicy, collection,
    initRequired, req.body.orgName, req.body.peers, localPath);
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/chaincode/approve', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName',
    'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  checkResult = common.checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.approveChaincode(req.body.chaincodeInfo.name, req.body.chaincodeInfo.version,
    req.body.chaincodeInfo.endorsementPolicy, req.body.chaincodeInfo.collection, req.body.chaincodeInfo.initRequired,
    req.body.chaincodeInfo.packageId, req.body.chaincodeInfo.sequence, req.body.channelName, req.body.orderers,
    req.body.orgName, req.body.peers);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/chaincode/commit', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName',
    'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  checkResult = common.checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.commitChaincode(req.body.chaincodeInfo.name, req.body.chaincodeInfo.version,
    req.body.chaincodeInfo.endorsementPolicy, req.body.chaincodeInfo.collection, req.body.chaincodeInfo.initRequired,
    req.body.chaincodeInfo.packageId, req.body.chaincodeInfo.sequence, req.body.channelName, req.body.orderers,
    req.body.orgName, req.body.peers);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

module.exports = router;
