let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('blockchainQuickStart');
logger.level = 'DEBUG';

let fabric = require('./fabric-op');
let helper = require('./fabric-lib/helper');

helper.initClient();

/* GET home page. */
router.get('/', express.static('public'));

router.post('/channel/create', async function (req, res) {
  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let includeOrgNames = req.body.includeOrgNames;
  if (typeof includeOrgNames === 'undefined') {
    let errMessage = "Request Error, parameter \"includeOrgNames\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org names included in channel: \"" + includeOrgNames + "\"");

  let ordererName = req.body.ordererName;
  if (typeof ordererName === 'undefined') {
    let errMessage = "Request Error, parameter \"ordererName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderer name: \"" + ordererName + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let createResult = await fabric.createChannel(channelName, includeOrgNames, ordererName, orgName);
  logger.debug(createResult);
  if (createResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }

});

router.post('/channel/addorg', async function (req, res) {
  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let addOrg = req.body.addOrg;
  if (typeof addOrg === 'undefined') {
    let errMessage = "Request Error, parameter \"addOrg\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get add org name: \"" + addOrg + "\"");

  let addOrgSignBy = req.body.addOrgSignBy;
  if (typeof addOrgSignBy === 'undefined') {
    let errMessage = "Request Error, parameter \"addOrgSignBy\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get add org signers: \"" + addOrgSignBy + "\"");

  let createResult = await fabric.addOrgToChannel(addOrg, addOrgSignBy, channelName, orderers, orgName);
  logger.debug(createResult);
  if (createResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }

});

router.post('/channel/delorg', async function (req, res) {
  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let delOrg = req.body.delOrg;
  if (typeof delOrg === 'undefined') {
    let errMessage = "Request Error, parameter \"delOrg\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get del org name: \"" + delOrg + "\"");

  let delOrgSignBy = req.body.delOrgSignBy;
  if (typeof delOrgSignBy === 'undefined') {
    let errMessage = "Request Error, parameter \"delOrgSignBy\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get del org signers: \"" + delOrgSignBy + "\"");

  let createResult = await fabric.delOrgFromChannel(delOrg, delOrgSignBy, channelName, orderers, orgName);
  logger.debug(createResult);
  if (createResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }

});

router.post('/channel/join', async function (req, res) {
  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let peers = req.body.peers;
  if (typeof peers === 'undefined') {
    let errMessage = "Request Error, parameter \"peers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get peers names: \"" + peers + "\"");

  let joinResult = await fabric.joinChannel(channelName, orderers, orgName, peers);
  logger.debug(joinResult);
  if (joinResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": joinResult[1]});
  }

});

router.post('/chaincode/install', async function (req, res) {
  let chaincode = req.body.chaincode;
  if (typeof chaincode === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincode\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode base64 string: \"" + chaincode + "\"");

  let chaincodeName = req.body.chaincodeName;
  if (typeof chaincodeName === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode name: \"" + chaincodeName + "\"");

  let chaincodePath = req.body.chaincodePath;
  if (typeof chaincodePath === 'undefined') {
    chaincodePath = 'github.com/chaincode';
    logger.debug("Chaincode path not found, set to default: \"" + chaincodePath + "\"");
  }
  logger.debug("Get chaincode path: \"" + chaincodePath + "\"");

  let chaincodeType = req.body.chaincodeType;
  if (chaincodeType) {
    logger.debug("Get chaincode type: \"" + chaincodeType + "\"");
  }

  let chaincodeVersion = req.body.chaincodeVersion;
  if (typeof chaincodeVersion === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeVersion\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode version: \"" + chaincodeVersion + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let peers = req.body.peers;
  if (typeof peers === 'undefined') {
    let errMessage = "Request Error, parameter \"peers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get peers names: \"" + peers + "\"");

  let localPath = req.body.localPath;
  if (localPath) {
    logger.debug('Detected localPath, install from local path: ' + localPath);
  }

  let installResult = await fabric.installChaincode(chaincode, chaincodeName, chaincodePath, chaincodeType,
    chaincodeVersion, orgName, peers, localPath);
  logger.debug(installResult);
  if (installResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": installResult[1]});
  }

});

router.post('/chaincode/instantiate', async function (req, res) {
  let chaincodeName = req.body.chaincodeName;
  if (typeof chaincodeName === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode name: \"" + chaincodeName + "\"");

  let chaincodeType = req.body.chaincodeType;
  if (typeof chaincodeType === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeType\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode type: \"" + chaincodeType + "\"");

  let chaincodeVersion = req.body.chaincodeVersion;
  if (typeof chaincodeVersion === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeVersion\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode version: \"" + chaincodeVersion + "\"");

  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let functionName = req.body.functionName;
  if (typeof functionName === 'undefined') {
    logger.debug("Parameter \"functionName\" doesn't exist, set as null");
    functionName = "";
  } else {
    logger.debug("Get function name: \"" + functionName + "\"");
  }

  let args = req.body.args;
  if (typeof args === 'undefined') {
    logger.debug("Parameter \"args\" doesn't exist, set as null");
    args = [];
  } else {
    logger.debug("Get args: \"" + args + "\"");
  }

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let peers = req.body.peers;
  if (typeof peers === 'undefined') {
    let errMessage = "Request Error, parameter \"peers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get peers names: \"" + peers + "\"");

  // endorsementPolicy could be undefined (default is "any member of the organizations in the channel")
  let endorsementPolicy = req.body.endorsementPolicy;
  if (endorsementPolicy) {
    logger.debug("Get endorsement policy: " + endorsementPolicy)
  }

  // collection can be undefined
  let collection = req.body.collection;
  if (collection) {
    logger.debug("Get collection: " + collection)
  }

  let useDiscoverService = req.body.useDiscoverService;
  if (useDiscoverService) {
    logger.debug("Get 'useDiscoverService', do request with discovery service")
  } else {
    logger.debug("Does not get parameter 'useDiscoverService', do request without discovery service")
  }

  let instantiateResult = await fabric.instantiateChaincode(chaincodeName, chaincodeType, chaincodeVersion,
    channelName, functionName, args, orderers, orgName, peers, endorsementPolicy, collection, useDiscoverService);
  logger.debug(instantiateResult);
  if (instantiateResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": instantiateResult[1]});
  }

});

router.post('/chaincode/upgrade', async function (req, res) {
  let chaincodeName = req.body.chaincodeName;
  if (typeof chaincodeName === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode name: \"" + chaincodeName + "\"");

  let chaincodeType = req.body.chaincodeType;
  if (typeof chaincodeType === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeType\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode type: \"" + chaincodeType + "\"");

  let chaincodeVersion = req.body.chaincodeVersion;
  if (typeof chaincodeVersion === 'undefined') {
    let errMessage = "Request Error, parameter \"chaincodeVersion\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get chaincode version: \"" + chaincodeVersion + "\"");

  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let functionName = req.body.functionName;
  if (typeof functionName === 'undefined') {
    logger.debug("Parameter \"functionName\" doesn't exist, set as null");
    functionName = "";
  } else {
    logger.debug("Get function name: \"" + functionName + "\"");
  }

  let args = req.body.args;
  if (typeof args === 'undefined') {
    logger.debug("Parameter \"args\" doesn't exist, set as null");
    args = [];
  } else {
    logger.debug("Get args: \"" + args + "\"");
  }

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let peers = req.body.peers;
  if (typeof peers === 'undefined') {
    let errMessage = "Request Error, parameter \"peers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get peers names: \"" + peers + "\"");

  // endorsementPolicy could be undefined (default is "any member of the organizations in the channel")
  let endorsementPolicy = req.body.endorsementPolicy;
  if (endorsementPolicy) {
    logger.debug("Get endorsement policy: " + endorsementPolicy)
  }

  // collection can be undefined
  let collection = req.body.collection;
  if (collection) {
    logger.debug("Get collection: " + collection)
  }

  let useDiscoverService = req.body.useDiscoverService;
  if (useDiscoverService) {
    logger.debug("Get 'useDiscoverService', do request with discovery service")
  } else {
    logger.debug("Does not get parameter 'useDiscoverService', do request without discovery service")
  }

  let instantiateResult = await fabric.upgradeChaincode(chaincodeName, chaincodeType, chaincodeVersion,
    channelName, functionName, args, orderers, orgName, peers, endorsementPolicy, collection, useDiscoverService);
  logger.debug(instantiateResult);
  if (instantiateResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": instantiateResult[1]});
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
    return;
  }
  logger.debug("Get invoke args: \"" + args + "\"");

  let functionName = req.body.functionName;
  if (typeof functionName === 'undefined') {
    let errMessage = "Request Error, parameter \"functionName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get function name: \"" + functionName + "\"");

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let peers = req.body.peers;
  if (typeof peers === 'undefined') {
    let errMessage = "Request Error, parameter \"peers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get peers names: \"" + peers + "\"");

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

  let invokeResut = await fabric.invokeChaincode(chaincodeName, channelName,
    functionName, args, orderers, orgName, peers, transient, useDiscoverService);
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
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get query args: \"" + args + "\"");

  let functionName = req.body.functionName;
  if (typeof functionName === 'undefined') {
    let errMessage = "Request Error, parameter \"functionName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get function name: \"" + functionName + "\"");

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let peers = req.body.peers;
  if (typeof peers === 'undefined') {
    let errMessage = "Request Error, parameter \"peers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get peers names: \"" + peers + "\"");

  // transient can be undefined
  let transient = req.body.transient;

  let useDiscoverService = req.body.useDiscoverService;
  if (useDiscoverService) {
    logger.debug("Get 'useDiscoverService', do request with discovery service")
  } else {
    logger.debug("Does not get parameter 'useDiscoverService', do request without discovery service")
  }

  let queryResult = await fabric.queryChaincode(chaincodeName, channelName,
    functionName, args, orderers, orgName, peers, transient, useDiscoverService);
  logger.debug(queryResult);
  if (queryResult[0]===true) {
    res.status(200).json({"result": queryResult[1]});
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }

});

router.post('/api/v1.1/channel/addorg', async function (req, res) {
  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let newOrgDetail = req.body.newOrgDetail;
  if (typeof newOrgDetail === 'undefined') {
    let errMessage = "Request Error, parameter \"newOrgDetail\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get new org's detail: \"" + JSON.stringify(newOrgDetail) + "\"");

  let addOrgSignBy = req.body.addOrgSignBy;
  if (typeof addOrgSignBy === 'undefined') {
    let errMessage = "Request Error, parameter \"addOrgSignBy\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get add org signers: \"" + addOrgSignBy + "\"");

  let createResult = await fabric.addOrgToChannelWithCerts(newOrgDetail, addOrgSignBy, channelName, orderers, orgName);
  logger.debug(createResult);
  if (createResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }

});

router.post('/api/v1.1/channel/delorg', async function (req, res) {
  let channelName = req.body.channelName;
  if (typeof channelName === 'undefined') {
    let errMessage = "Request Error, parameter \"channelName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get channel name: \"" + channelName + "\"");

  let orderers = req.body.orderers;
  if (typeof orderers === 'undefined') {
    let errMessage = "Request Error, parameter \"orderers\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get orderers names: \"" + orderers + "\"");

  let orgName = req.body.orgName;
  if (typeof orgName === 'undefined') {
    let errMessage = "Request Error, parameter \"orgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get org name: \"" + orgName + "\"");

  let delOrgName = req.body.delOrgName;
  if (typeof delOrgName === 'undefined') {
    let errMessage = "Request Error, parameter \"delOrgName\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get del org name: \"" + delOrgName + "\"");

  let delOrgSignBy = req.body.delOrgSignBy;
  if (typeof delOrgSignBy === 'undefined') {
    let errMessage = "Request Error, parameter \"delOrgSignBy\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"result": "failed", "error": errMessage});
    return;
  }
  logger.debug("Get del org signers: \"" + delOrgSignBy + "\"");

  let createResult = await fabric.delOrgFromChannel(delOrgName, delOrgSignBy, channelName, orderers, orgName);
  logger.debug(createResult);
  if (createResult[0]===true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }

});

module.exports = router;
