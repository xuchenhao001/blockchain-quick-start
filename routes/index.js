let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('BlockchainQuickStart');
logger.level = 'DEBUG';

let fabric = require('./fabric-op');
let helper = require('./fabric-lib/helper');

helper.initFabric();

/* GET home page. */
router.get('/', express.static('public'));

router.post('/channel/create', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'includeOrgNames', 'ordererName', 'orgName');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let createResult = await fabric.createChannel(req.body.channelName, req.body.includeOrgNames, req.body.ordererName,
    req.body.orgName);
  logger.debug(createResult);
  if (createResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }
});

router.post('/channel/join', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let joinResult = await fabric.joinChannel(req.body.channelName, req.body.orderers, req.body.orgName, req.body.peers);
  logger.debug(joinResult);
  if (joinResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": joinResult[1]});
  }
});

router.post('/channel/addorg', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'addOrg', 'addOrgSignBy');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let createResult = await fabric.addOrgToChannel(req.body.addOrg, req.body.addOrgSignBy, req.body.channelName,
    req.body.orderers, req.body.orgName);
  logger.debug(createResult);
  if (createResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }
});

router.post('/channel/delorg', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'delOrg', 'delOrgSignBy');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let createResult = await fabric.delOrgFromChannel(req.body.delOrg, req.body.delOrgSignBy, req.body.channelName,
    req.body.orderers, req.body.orgName);
  logger.debug(createResult);
  if (createResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }
});

router.post('/channel/modifypolicy', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'modifyPolicySignBy',
    'policyName', 'policyType', 'policyValue');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let modifyResult = await fabric.modifyPolicy(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.modifyPolicySignBy, req.body.policyName, req.body.policyType, req.body.policyValue);
  logger.debug(modifyResult);
  if (modifyResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": modifyResult[1]});
  }
});

router.post('/channel/modifyacl', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'resource', 'policy',
    'modifyACLSignBy');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let modifyResult = await fabric.modifyACL(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.resource, req.body.policy, req.body.modifyACLSignBy);
  logger.debug(modifyResult);
  if (modifyResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": modifyResult[1]});
  }

});

router.post('/channel/updateAnchorPeer', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let updateResult = await fabric.updateAnchorPeer(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.peers);
  logger.debug(updateResult);
  if (updateResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": updateResult[1]});
  }
});

router.post('/chaincode/install', async function (req, res) {

  let checkResult = checkParameters(req.body, 'chaincodeContent', 'chaincodeName', 'chaincodeType',
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

  let checkResult = checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  checkResult = checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
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

  let checkResult = checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  checkResult = checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
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

router.post('/chaincode/instantiate', async function (req, res) {

  let checkResult = checkParameters(req.body, 'chaincodeName', 'channelName', 'orderers', 'orgName', 'peers');
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

  let checkResult = checkParameters(req.body, 'args', 'functionName', 'orderers', 'orgName', 'peers');
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

  let checkResult = checkParameters(req.body, 'args', 'functionName', 'orderers', 'orgName', 'peers');
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

router.post('/api/v1.1/channel/addorg', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'newOrgDetail',
    'addOrgSignBy');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let createResult = await fabric.addOrgToChannelWithCerts(req.body.newOrgDetail, req.body.addOrgSignBy,
    req.body.channelName, req.body.orderers, req.body.orgName);
  logger.debug(createResult);
  if (createResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }
});

router.post('/api/v1.1/channel/delorg', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'delOrgName',
    'delOrgSignBy');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let createResult = await fabric.delOrgFromChannel(req.body.delOrgName, req.body.delOrgSignBy, req.body.channelName,
    req.body.orderers, req.body.orgName);
  logger.debug(createResult);
  if (createResult[0] === true) {
    res.status(200).json({"result": "success"});
  } else {
    res.status(500).json({"result": "failed", "error": createResult[1]});
  }
});

router.post('/explorer/queryinfo', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let queryResult = await fabric.queryInfo(req.body.channelName, req.body.orderers, req.body.orgName, req.body.peers);
  logger.debug(JSON.stringify(queryResult));
  if (queryResult[0] === true) {
    res.status(200).json(
      {
        "result": "success",
        "detail": queryResult[1]
      });
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});

router.post('/explorer/queryblock', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers', 'blockNumber');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let queryResult = await fabric.queryBlock(req.body.channelName, req.body.orderers, req.body.orgName, req.body.peers,
    req.body.blockNumber);
  logger.debug(JSON.stringify(queryResult));
  if (queryResult[0] === true) {
    res.status(200).json(
      {
        "result": "success",
        "detail": queryResult[1]
      });
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});

router.post('/explorer/querytransaction', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers', 'txId');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let queryResult = await fabric.queryTransaction(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.peers, req.body.txId);
  logger.debug(JSON.stringify(queryResult));
  if (queryResult[0] === true) {
    res.status(200).json(
      {
        "result": "success",
        "detail": queryResult[1]
      });
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});

router.post('/explorer/queryinstalledchaincodes', async function (req, res) {

  let checkResult = checkParameters(req.body, 'orgName', 'peer');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let queryResult = await fabric.queryInstalledChaincodes(req.body.orgName, req.body.peer);
  logger.debug(JSON.stringify(queryResult));
  if (queryResult[0] === true) {
    res.status(200).json(
      {
        "result": "success",
        "detail": queryResult[1]
      });
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});

router.post('/explorer/querychaincodeapprovalstatus', async function (req, res) {

  let checkResult = checkParameters(req.body, 'chaincodeInfo', 'channelName', 'orderers', 'orgName', 'peer');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  checkResult = checkParameters(req.body.chaincodeInfo, 'name', 'version', 'packageId', 'sequence');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let queryResult = await fabric.queryChaincodeApprovalStatus(req.body.chaincodeInfo.name,
    req.body.chaincodeInfo.version, req.body.chaincodeInfo.endorsementPolicy, req.body.chaincodeInfo.collection,
    req.body.chaincodeInfo.initRequired, req.body.chaincodeInfo.packageId, req.body.chaincodeInfo.sequence,
    req.body.channelName, req.body.orderers, req.body.orgName, req.body.peer);
  logger.debug(JSON.stringify(queryResult));
  if (queryResult[0] === true) {
    res.status(200).json(
      {
        "result": "success",
        "detail": queryResult[1]
      });
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});

router.post('/explorer/querychaincodedefinition', async function (req, res) {

  let checkResult = checkParameters(req.body, 'channelName', 'chaincodeName', 'orderers', 'orgName', 'peer');
  if (!checkResult[0]) {
    res.status(400).json({"result": "failed", "error": checkResult[1]});
    return;
  }

  let queryResult = await fabric.queryChaincodeDefinition(req.body.channelName, req.body.chaincodeName,
    req.body.orderers, req.body.orgName, req.body.peer);
  logger.debug(JSON.stringify(queryResult));
  if (queryResult[0] === true) {
    res.status(200).json(
      {
        "result": "success",
        "detail": queryResult[1]
      });
  } else {
    res.status(500).json({"result": "failed", "error": queryResult[1]});
  }
});

let checkParameters = function(reqBody, ...parameters) {
  for (let parameter of parameters) {
    if (typeof reqBody[parameter] === 'undefined') {
      let errMessage = 'Request Error, parameter [' + parameter + '] doesn\'t exist';
      logger.error(errMessage);
      return [false, errMessage];
    }
    logger.debug('Get ' + parameter + ': ' + JSON.stringify(reqBody[parameter]));
  }
  return [true, null];
};

module.exports = router;
