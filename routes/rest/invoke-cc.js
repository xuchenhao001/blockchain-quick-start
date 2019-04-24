'use strict';

let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('REST');
logger.level = 'DEBUG';

let fabric = require('../fabric-op');
let common = require('./common');

router.post('/chaincode/instantiate', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeName', 'channelName', 'orderers', 'orgName',
    'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let args = req.body.args;
  args = (typeof args === 'undefined') ? [] : args;
  logger.debug("Get args: " + JSON.stringify(args));

  let result = await fabric.instantiateChaincode(req.body.chaincodeName, req.body.channelName, args, req.body.orderers,
    req.body.orgName, req.body.peers);
  logger.debug(result);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/invoke/:channelName/:chaincodeName', async function (req, res) {
  let channelName = req.params.channelName;
  let chaincodeName = req.params.chaincodeName;

  let checkResult = common.checkParameters(req.body, 'args', 'functionName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  // transient can be undefined
  let transient = req.body.transient;
  if (transient) {
    logger.debug("Get transient: " + transient)
  }

  let useDiscoverService = req.body.useDiscoverService;
  if (useDiscoverService) {
    logger.debug("Get 'useDiscoverService', do request with discovery service")
  } else {
    logger.debug("Does not get parameter 'useDiscoverService', do request without discovery service")
  }

  let resut = await fabric.invokeChaincode(chaincodeName, channelName, req.body.functionName, req.body.args,
    req.body.orderers, req.body.orgName, req.body.peers, transient, useDiscoverService);
  logger.debug(resut);
  if (resut[0] === 'yes') {
    common.responseSuccess(res, {"txId": resut[1], "payload": resut[2]});
  } else {
    common.responseInternalError(res, resut[1]);
  }
});

router.post('/query/:channelName/:chaincodeName', async function (req, res) {
  let channelName = req.params.channelName;
  let chaincodeName = req.params.chaincodeName;

  let checkResult = common.checkParameters(req.body, 'args', 'functionName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  // transient can be undefined
  let transient = req.body.transient;

  let useDiscoverService = req.body.useDiscoverService;
  if (useDiscoverService) {
    logger.debug("Get 'useDiscoverService', do request with discovery service")
  } else {
    logger.debug("Does not get parameter 'useDiscoverService', do request without discovery service")
  }

  let result = await fabric.queryChaincode(chaincodeName, channelName, req.body.functionName, req.body.args,
    req.body.orderers, req.body.orgName, req.body.peers, transient, useDiscoverService);
  logger.debug(result);
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

module.exports = router;
