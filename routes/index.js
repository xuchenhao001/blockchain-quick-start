let express = require('express');
let router = express.Router();
let query = require('./query');
let invoke = require('./invoke');
let log4js = require('log4js');
let logger = log4js.getLogger('cicsBlockchain');


chaincodeQuery = async function (args) {
  logger.debug('==================== QUERY BY CHAINCODE ==================');
  let request = {
    chaincodeId: 'mycc',
    fcn: 'query',
    args: args
  };
  return await query.queryChaincode(request);
};

chaincodeInvoke = async function (args) {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "invoke",
    args: args,
    chainId: "mychannel"
  };
  return await invoke.invokeChaincode(request);
};

/* GET home page. */
router.get('/', async function (req, res) {
  res.send("200");
});

router.post('/query', async function (req, res) {
  let queryArgs = req.body.args;
  if (queryArgs) {
    logger.debug("Get query args: \"" + queryArgs + "\"");
    let queryResut = await chaincodeQuery(queryArgs);
    let resJson;
    if (parseFloat(queryResut).toString() === "NaN") {
      logger.error("Chaincode query failed: " + queryResut);
      resJson = {"status": "500", "result": queryResut};
    } else {
      resJson = {"status": "200", "result": parseFloat(queryResut)};
    }
    res.send(resJson);
  } else {
    logger.error("Request Error: " + req.body);
    res.send("400");
  }
});

router.post('/invoke', async function (req, res) {
  let invokeArgs = req.body.args;
  if (invokeArgs) {
    logger.debug("Get query args: \"" + invokeArgs + "\"");
    let invokeResut = await chaincodeInvoke(invokeArgs);
    console.log(invokeResut);
    let resJson;
    if (invokeResut[0]==='yes') {
      resJson = {"status": "200", "result": invokeResut[1]};
    } else {
      resJson = {"status": "500", "result": invokeResut[1]};
    }
    res.send(resJson);
  } else {
    logger.error("Request Error: " + req.body);
    res.send("400");
  }
});

module.exports = router;
