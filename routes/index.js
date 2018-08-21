let express = require('express');
let router = express.Router();
let query = require('./query');
let invoke = require('./invoke');
let log4js = require('log4js');
let logger = log4js.getLogger('blockchainQuickStart');


/* GET home page. */
router.get('/', express.static('public'));


initInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "initAccount",
    args: args,
    chainId: "mychannel"
  };
  return await invoke.invokeChaincode(request);
};

addPointsInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "addPoints",
    args: args,
    chainId: "mychannel"
  };
  return await invoke.invokeChaincode(request);
};

balanceQuery = async function (args) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');
  let request = {
    chaincodeId: 'mycc',
    fcn: 'balanceQuery',
    args: args
  };
  return await query.queryChaincode(request);
};

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
