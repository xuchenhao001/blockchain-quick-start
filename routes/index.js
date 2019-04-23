let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('BlockchainQuickStart');
logger.level = 'DEBUG';

let channelRest = require('./rest/channel');
let deployCCRest = require('./rest/deploy-cc');
let invokeRest = require('./rest/invoke-cc');
let explorerRest = require('./rest/explorer');

let helper = require('./fabric-lib/helper');
helper.initFabric();

/* GET home page. */
router.get('/', express.static('public'));

// merge all of the APIs under rest/ directory
router.stack = router.stack.concat(channelRest.stack);
router.stack = router.stack.concat(deployCCRest.stack);
router.stack = router.stack.concat(invokeRest.stack);
router.stack = router.stack.concat(explorerRest.stack);

module.exports = router;
