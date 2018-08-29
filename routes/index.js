let express = require('express');
let router = express.Router();

let channel = require('./channal');
let query = require('./query');
let invoke = require('./invoke');
let log4js = require('log4js');
let logger = log4js.getLogger('blockchainQuickStart');


/* GET home page. */
router.get('/', express.static('public'));

createChannel = async function (channelName) {
  logger.debug('==================== CREATE CHANNEL ==================');
  return await channel.createChannel(channelName);
};

joinChannel = async function (channelName) {
  logger.debug('==================== JOIN CHANNEL ==================');
  let orgName = 'org1';
  let joinResult = await channel.joinChannel(channelName, orgName);
  if (joinResult[0] !== true) {
    return [false, joinResult[1]];
  }
  orgName = 'org2';
  joinResult = await channel.joinChannel(channelName, orgName);
  if (joinResult[0] !== true) {
    return [false, joinResult[1]];
  }
  return [true, joinResult[1]];
};

initInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "initAccount",
    args: args,
    chainId: "mychannel"
  };
  let orgNames = ['org1', 'org2'];
  return await invoke.invokeChaincode(request, orgNames);
};

addPointsInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "addPoints",
    args: args,
    chainId: "mychannel"
  };
  let orgNames = ['org1', 'org2'];
  return await invoke.invokeChaincode(request, orgNames);
};

balanceQuery = async function (args) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');
  let request = {
    chaincodeId: 'mycc',
    fcn: 'balanceQuery',
    args: args
  };
  return await query.queryChaincode(request, 'org1');
};

router.post('/createChannel', async function (req, res) {
  let channelID = req.body.channelID;
  if (channelID) {
    logger.debug("Get channel name: \"" + channelID + "\"");
    let createResult = await createChannel(channelID);
    console.log(createResult);
    res.status(200);
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

router.post('/joinChannel', async function (req, res) {
  let channelID = req.body.channelID;
  if (channelID) {
    logger.debug("Get channel name: \"" + channelID + "\"");
    let joinResult = await joinChannel(channelID);
    console.log(joinResult);
    res.status(200);
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

router.post('/invoke/init', async function (req, res) {
  let initAccount = req.body.account;
  if (initAccount) {
    logger.debug("Get init account: \"" + initAccount + "\"");
    let initResut = await initInvoke([initAccount]);
    console.log(initResut);
    if (initResut[0]==='yes') {
      res.status(200).json({"tx_id": initResut[1]});
    } else {
      res.status(500).json({"error": initResut[1]});
    }
  } else {
    let errMessage = "Request Error, parameter \"account\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"error": errMessage});
  }
});

router.post('/invoke/addPoints', async function (req, res) {
  let addAccount = req.body.account;
  let addPoints = req.body.points;
  if (addAccount && addPoints) {
    logger.debug("Add " + addPoints + " points to account: \"" + addAccount + "\"");
    let invokeResut = await addPointsInvoke([addAccount, addPoints]);
    console.log(invokeResut);
    if (invokeResut[0]==='yes') {
      res.status(200).json({"tx_id": invokeResut[1]});
    } else {
      res.status(500).json({"error": invokeResut[1]});
    }
  } else {
    let errMessage;
    if (!addAccount) {
      errMessage = "Request Error, parameter \"account\" doesn't exist";
      logger.error(errMessage);
      res.status(400).json({"error": errMessage});
    }
    if (!addPoints) {
      errMessage = "Request Error, parameter \"points\" doesn't exist";
      logger.error(errMessage);
      res.status(400).json({"error": errMessage});
    }
  }
});

router.post('/query/balance', async function (req, res) {
  let queryAccount = req.body.account;
  if (queryAccount) {
    logger.debug("Get query account: \"" + queryAccount + "\"");
    let queryResult = await balanceQuery([queryAccount]);
    if (parseFloat(queryResult).toString() === "NaN") {
      logger.error("Chaincode query failed: " + queryResult);
      res.status(500).json({"error": queryResult});
    } else {
      res.status(200).json({"result": parseFloat(queryResult)});
    }
  } else {
    let errMessage = "Request Error, parameter \"account\" doesn't exist";
    logger.error(errMessage);
    res.status(400).json({"error": errMessage});
  }
});


module.exports = router;
