'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('COMMON');
logger.level = 'DEBUG';

/* Parameters check */
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

/* Response handle*/
let responseSuccess = function (responseObj, detail) {
  responseObj.status(200).json({"status": "SUCCESS", "detail": detail});
};

let responseBadRequestError = function (responseObj, errorDetail) {
  responseObj.status(400).json({"status": "BAD_REQUEST", "error": errorDetail});
};

let responseInternalError = function (responseObj, errorDetail) {
  responseObj.status(500).json({"status": "INTERNAL_SERVER_ERROR", "error": errorDetail});
};

exports.checkParameters = checkParameters;
exports.responseSuccess = responseSuccess;
exports.responseBadRequestError = responseBadRequestError;
exports.responseInternalError = responseInternalError;

