'use strict';

let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('Rest');
logger.level = 'DEBUG';

let fabric = require('../fabric-op');
let common = require('./common');

router.post('/chaincode/install', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeContent', 'chaincodeName', 'chaincodeType',
    'chaincodeVersion', 'chaincodeSequence', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
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

  let installResult = await fabric.installChaincode(req.body.chaincodeContent, req.body.chaincodeName, chaincodePath,
    req.body.chaincodeType, req.body.chaincodeVersion, req.body.chaincodeSequence, endorsementPolicy, collection,
    initRequired, req.body.orgName, req.body.peers, localPath);
  logger.debug(installResult);
  if (installResult[0] === true) {
    res.status(200).json({"result": "success", "chaincodeInfo": installResult[1]});
  } else {
    res.status(500).json({"result": "failed", "error": installResult[1]});
  }
});

router.post('/chaincode/approve', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName',
    'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  checkResult = common.checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let approveResult = await fabric.approveChaincode(req.body.chaincodeInfo.name, req.body.chaincodeInfo.version,
    req.body.chaincodeInfo.endorsementPolicy, req.body.chaincodeInfo.collection, req.body.chaincodeInfo.initRequired,
    req.body.chaincodeInfo.packageId, req.body.chaincodeInfo.sequence, req.body.channelName, req.body.orderers,
    req.body.orgName, req.body.peers);
  logger.debug(approveResult);
  if (approveResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": approveResult[1]});
  }
});

router.post('/chaincode/commit', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName',
    'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  checkResult = common.checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let commitResult = await fabric.commitChaincode(req.body.chaincodeInfo.name, req.body.chaincodeInfo.version,
    req.body.chaincodeInfo.endorsementPolicy, req.body.chaincodeInfo.collection, req.body.chaincodeInfo.initRequired,
    req.body.chaincodeInfo.packageId, req.body.chaincodeInfo.sequence, req.body.channelName, req.body.orderers,
    req.body.orgName, req.body.peers);
  logger.debug(commitResult);
  if (commitResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": commitResult[1]});
  }
});

module.exports = router;
