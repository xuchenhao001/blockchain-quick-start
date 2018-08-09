let express = require('express');
let router = express.Router();
let query = require('./query');
let invoke = require('./invoke');
let log4js = require('log4js');
let logger = log4js.getLogger('cicsBlockchain');

function getErrorMessage(field) {
  return {
    success: false,
    message: field + ' field is missing or Invalid in the request'
  };
}

testQuery = async function () {
  logger.debug('==================== QUERY BY CHAINCODE ==================');
  let request = {
    chaincodeId: 'mycc',
    fcn: 'query',
    args: ['testAccount']
  };
  return await query.queryChaincode(request);
};

testInvoke = async function () {
  logger.debug('==================== INVOKE ON CHAINCODE ==================');
  let request = {
    chaincodeId: "mycc",
    fcn: "invoke",
    args: ["testAccount", "1200", "sdk"],
    chainId: "mychannel"
  };
  return await invoke.invokeChaincode(request);
};

/* GET home page. */
router.get('/', async function (req, res) {
  // let invoke = await testInvoke();
  // console.log(invoke);
  let query = await testQuery();
  console.log(query);
  res.send("200");
});

router.post('/', function (req, res) {
  res.send("200")
});

module.exports = router;
