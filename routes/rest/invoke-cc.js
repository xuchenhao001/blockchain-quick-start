'use strict';

let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('Rest');
logger.level = 'DEBUG';

let fabric = require('../fabric-op');
let common = require('./common');

router.post('/chaincode/instantiate', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'chaincodeName', 'channelName', 'orderers', 'orgName',
    'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let args = req.body.args;
  args = (typeof args === 'undefined') ? [] : args;
  logger.debug("Get args: " + JSON.stringify(args));

  let instantiateResult = await fabric.instantiateChaincode(req.body.chaincodeName, req.body.channelName, args,
    req.body.orderers, req.body.orgName, req.body.peers);
  logger.debug(instantiateResult);
  if (instantiateResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": instantiateResult[1]});
  }
});

router.post('/invoke/:channelName/:chaincodeName', async function (req, res) {
  let channelName = req.params.channelName;
  let chaincodeName = req.params.chaincodeName;

  let checkResult = common.checkParameters(req.body, 'args', 'functionName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
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

  let invokeResut = await fabric.invokeChaincode(chaincodeName, channelName, req.body.functionName, req.body.args,
    req.body.orderers, req.body.orgName, req.body.peers, transient, useDiscoverService);
  logger.debug(invokeResut);
  if (invokeResut[0] === 'yes') {
    res.status(200).json({"result": "success", "txId": invokeResut[1], "payload": invokeResut[2]});
  } else {
    res.status(500).json({"result": "failed", "error": invokeResut[1]});
  }
});

router.post('/query/:channelName/:chaincodeName', async function (req, res) {
  let channelName = req.params.channelName;
  let chaincodeName = req.params.chaincodeName;

  let checkResult = common.checkParameters(req.body, 'args', 'functionName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
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

  let queryResult = await fabric.queryChaincode(chaincodeName, channelName, req.body.functionName, req.body.args,
    req.body.orderers, req.body.orgName, req.body.peers, transient, useDiscoverService);
  logger.debug(queryResult);
  if (queryResult[0] === true) {
    res.status(200).json({"result": queryResult[1]});
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});

module.exports = router;
