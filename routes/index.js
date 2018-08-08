let express = require('express');
let router = express.Router();
let query = require('./query');
var log4js = require('log4js');
let logger = log4js.getLogger('cicsBlockchain');

require('./config/config.js');

function getErrorMessage(field) {
  return {
    success: false,
    message: field + ' field is missing or Invalid in the request'
  };
}

/* GET home page. */
router.get('/', async function(req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    let channelName = 'mychannel';
    let chaincodeName = 'mycc';
    let args = '["testAccount"]';
    let fcn = 'query';
    let peer = 'peer0.org1.example.com';

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn : ' + fcn);
    logger.debug('args : ' + args);

    if (!chaincodeName) {
      res.json(getErrorMessage('\'chaincodeName\''));
      return;
    }
    if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
    }
    if (!fcn) {
      res.json(getErrorMessage('\'fcn\''));
      return;
    }
    if (!args) {
      res.json(getErrorMessage('\'args\''));
      return;
    }
    args = args.replace(/'/g, '"');
    args = JSON.parse(args);
    logger.debug(args);

    let request = {
      chaincodeId: 'mycc',
      fcn: 'query',
      args: ['testAccount']
    };
    let message = await query.queryChaincode(request);
    res.send(message);
});

router.post('/', function (req, res) {
  res.send("200")
});

module.exports = router;
