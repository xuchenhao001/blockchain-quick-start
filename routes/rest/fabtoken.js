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

  checkResult = common.checkParameters(req.body.issuer, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  checkResult = common.checkParameters(req.body.issueTo, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.issueFabtoken(req.body.issuer, req.body.issueTo, req.body.issueType,
    req.body.issueQuantity, req.body.channelName, req.body.orderers, req.body.peers, req.body.orgName);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/fabtoken/list', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'owner', 'channelName', 'orderers', 'peers', 'orgName');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  checkResult = common.checkParameters(req.body.owner, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.listFabtoken(req.body.owner, req.body.channelName, req.body.orderers, req.body.peers,
    req.body.orgName);
  if (result[0] === true) {
    common.responseSuccess(res, result[1]);
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/fabtoken/transfer', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'owner', 'recipient', 'txId', 'index', 'type',
    'quantity', 'channelName', 'orderers', 'peers', 'orgName');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  checkResult = common.checkParameters(req.body.owner, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  checkResult = common.checkParameters(req.body.recipient, 'username', 'orgMSPId', 'privateKeyPEM',
    'signedCertPEM');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.transferFabtoken(req.body.owner, req.body.recipient, req.body.txId, req.body.index,
    req.body.type, req.body.quantity, req.body.channelName, req.body.orderers, req.body.peers, req.body.orgName);


  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

module.exports = router;
