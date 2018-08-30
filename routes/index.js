let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('blockchainQuickStart');
logger.level = 'DEBUG';

let fabric = require('./fabric-op');

/* GET home page. */
router.get('/', express.static('public'));

router.post('/channel/create', async function (req, res) {
  let channelID = req.body.channelID;
  if (channelID) {
    logger.debug("Get channel name: \"" + channelID + "\"");
    let createResult = await fabric.createChannel(channelID);
    logger.debug(createResult);
    if (createResult[0]===true) {
      res.status(200).json({"result": "success"});
    } else {
      res.status(500).json({"result": "failed", "error": createResult[1]});
    }
  } else {
    let errMessage = "Request Error, parameter \"channelID\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
  }
});

router.post('/channel/join', async function (req, res) {
  let channelID = req.body.channelID;
  if (channelID) {
    logger.debug("Get channel name: \"" + channelID + "\"");
    let joinResult = await fabric.joinChannel(channelID);
    logger.debug(joinResult);
    if (joinResult[0]===true) {
      res.status(200).json({"result": "success"});
    } else {
      res.status(500).json({"result": "failed", "error": joinResult[1]});
    }
  } else {
    let errMessage = "Request Error, parameter \"channelID\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
  }
});

router.post('/chaincode/install', async function (req, res) {
  let chaincodeVersion = req.body.version;
  if (chaincodeVersion) {
    logger.debug("Get chaincode version: \"" + chaincodeVersion + "\"");
    let installResult = await fabric.installChaincode(chaincodeVersion);
    logger.debug(installResult);
    if (installResult[0]===true) {
      res.status(200).json({"result": "success"});
    } else {
      res.status(500).json({"result": "failed", "error": installResult[1]});
    }
  } else {
    let errMessage = "Request Error, parameter \"version\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
  }
});

router.post('/chaincode/instantiate', async function (req, res) {
  let chaincodeVersion = req.body.version;
  if (chaincodeVersion) {
    logger.debug("Get chaincode version: \"" + chaincodeVersion + "\"");
    let instantiateResult = await fabric.instantiateChaincode(chaincodeVersion);
    logger.debug(instantiateResult);
    if (instantiateResult[0]===true) {
      res.status(200).json({"result": "success"});
    } else {
      res.status(500).json({"result": "failed", "error": instantiateResult[1]});
    }
  } else {
    let errMessage = "Request Error, parameter \"version\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
  }
});

router.post('/invoke/:channelName/:chaincodeName', async function (req, res) {
  let channelName = req.params.channelName;
  let chaincodeName = req.params.chaincodeName;

  let args = req.body.args;
  if (typeof args === 'undefined') {
    let errMessage = "Request Error, parameter \"args\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
  }
  logger.debug("Get query args: \"" + args + "\"");

  let functionName = req.body.function;
  if (typeof functionName === 'undefined') {
    let errMessage = "Request Error, parameter \"function\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
  }
  logger.debug("Get function name: \"" + functionName + "\"");

  let invokeResut = await fabric.invokeChaincode(chaincodeName, channelName, functionName, args);
  logger.debug(invokeResut);
  if (invokeResut[0]==='yes') {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": invokeResut[1]});
  }
});

router.post('/query/:channelName/:chaincodeName', async function (req, res) {
  let channelName = req.params.channelName;
  let chaincodeName = req.params.chaincodeName;

  let args = req.body.args;
  if (typeof args === 'undefined') {
    let errMessage = "Request Error, parameter \"args\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"error": errMessage});
  }
  logger.debug("Get query args: \"" + args + "\"");

  let functionName = req.body.function;
  if (typeof functionName === 'undefined') {
    let errMessage = "Request Error, parameter \"function\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"error": errMessage});
  }
  logger.debug("Get function name: \"" + functionName + "\"");

  let queryResult = await fabric.queryChaincode(chaincodeName, channelName, functionName, args);
  logger.debug(queryResult);
  if (queryResult[0]===true) {
    res.status(200).json({"result": queryResult[1]});
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});


module.exports = router;
