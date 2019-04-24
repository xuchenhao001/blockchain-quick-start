'use strict';

let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('REST');
logger.level = 'DEBUG';

let fabric = require('../fabric-op');
let common = require('./common');

router.post('/fabtoken/issue', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'issuer', 'issueTo', 'issueType', 'issueQuantity',
    'channelName', 'orderers', 'peers', 'orgName');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let checkIssuerResult = common.checkParameters(req.body.issuer, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkIssuerResult[0]) {
    common.responseBadRequestError(res, checkIssuerResult[1]);
    return;
  }

  let checkIssueToResult = common.checkParameters(req.body.issueTo, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkIssueToResult[0]) {
    common.responseBadRequestError(res, checkIssueToResult[1]);
    return;
  }

  let result = await fabric.issueFabtoken(req.body.issuer, req.body.issueTo, req.body.issueType,
    req.body.issueQuantity, req.body.channelName, req.body.orderers, req.body.peers, req.body.orgName);
  logger.debug(result);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(result[1]);
  }
});

router.post('/fabtoken/list', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'owner', 'channelName', 'orderers', 'peers', 'orgName');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let checkIssuerResult = common.checkParameters(req.body.owner, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkIssuerResult[0]) {
    common.responseBadRequestError(res, checkIssuerResult[1]);
    return;
  }

  let result = await fabric.listFabtoken(req.body.owner, req.body.channelName, req.body.orderers, req.body.peers,
    req.body.orgName);
  logger.debug(result);
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

module.exports = router;
