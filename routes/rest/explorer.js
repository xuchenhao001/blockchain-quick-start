'use strict';

let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('REST');
logger.level = 'DEBUG';

let fabric = require('../fabric-op');
let common = require('./common');

router.post('/explorer/queryinfo', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.queryInfo(req.body.channelName, req.body.orderers, req.body.orgName, req.body.peers);
  logger.debug(JSON.stringify(result));
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/explorer/queryblock', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers',
    'blockNumber');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.queryBlock(req.body.channelName, req.body.orderers, req.body.orgName, req.body.peers,
    req.body.blockNumber);
  logger.debug(JSON.stringify(result));
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/explorer/querytransaction', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers', 'txId');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.queryTransaction(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.peers, req.body.txId);
  logger.debug(JSON.stringify(result));
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/explorer/queryinstalledchaincodes', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'orgName', 'peer');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.queryInstalledChaincodes(req.body.orgName, req.body.peer);
  logger.debug(JSON.stringify(result));
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/explorer/querychaincodeapprovalstatus', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName',
    'peer');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  checkResult = common.checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.queryChaincodeApprovalStatus(req.body.chaincodeInfo.name,
    req.body.chaincodeInfo.version, req.body.chaincodeInfo.endorsementPolicy, req.body.chaincodeInfo.collection,
    req.body.chaincodeInfo.initRequired, req.body.chaincodeInfo.packageId, req.body.chaincodeInfo.sequence,
    req.body.channelName, req.body.orderers, req.body.orgName, req.body.peer);
  logger.debug(JSON.stringify(result));
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/explorer/querychaincodedefinition', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'chaincodeName', 'orderers', 'orgName',
    'peer');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.queryChaincodeDefinition(req.body.channelName, req.body.chaincodeName,
    req.body.orderers, req.body.orgName, req.body.peer);
  logger.debug(JSON.stringify(result));
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

module.exports = router;
