'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('COMMON');
logger.level = 'DEBUG';

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

exports.checkParameters = checkParameters;
