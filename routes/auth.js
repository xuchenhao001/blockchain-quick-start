let request = require('request');

let log4js = require('log4js');
let logger = log4js.getLogger('AUTH');
logger.level = 'DEBUG';

let auth = function(req, res, next) {
  let token = req.get("Authorization");
  if (!token) {
    logger.debug("Cannot find authorization token!");
    return res.status(401).json({"result": "unauthorized"});
  }
  token = token.split(" ")[1];
  if (!token) {
    logger.debug("Unsupported type of token, should be: Bearer eyJ...")
    return res.status(401).json({"result": "unauthorized"});
  }
  logger.debug("Got user token: " + token);

  // for example: process.env.AUTH_ADDR = http://127.0.0.1/api/login/status
  let authorizeServerAddr = process.env.AUTH_ADDR;
  logger.debug("Got authorize address: " + authorizeServerAddr);

  let authorizeHeader = {
    'auth': {
      'bearer': token
    }
  };
  request.get(authorizeServerAddr, authorizeHeader, function(err, response){
    if(err) {
      logger.error("Failed to send authorize request to server: " + err);
    }
    if(response.statusCode === 200 ){
      logger.debug("Authorize success");
      return next();
    } else {
      logger.debug("Authorize failed: " + response.statusCode);
      return res.status(401).json({"result": "unauthorized"});
    }
  });
};

module.exports = auth;
