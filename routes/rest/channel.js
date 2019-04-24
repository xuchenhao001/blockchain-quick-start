'use strict';

let express = require('express');
let router = express.Router();

let log4js = require('log4js');
let logger = log4js.getLogger('REST');
logger.level = 'DEBUG';

let fabric = require('../fabric-op');
let common = require('./common');

router.post('/channel/create', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'includeOrgNames', 'ordererName',
    'orgName');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.createChannel(req.body.channelName, req.body.includeOrgNames, req.body.ordererName,
    req.body.orgName);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/channel/join', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.joinChannel(req.body.channelName, req.body.orderers, req.body.orgName, req.body.peers);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/channel/addorg', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'addOrg',
    'addOrgSignBy');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.addOrgToChannel(req.body.addOrg, req.body.addOrgSignBy, req.body.channelName,
    req.body.orderers, req.body.orgName);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/channel/delorg', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'delOrg',
    'delOrgSignBy');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.delOrgFromChannel(req.body.delOrg, req.body.delOrgSignBy, req.body.channelName,
    req.body.orderers, req.body.orgName);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/channel/modifypolicy', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName',
    'modifyPolicySignBy', 'policyName', 'policyType', 'policyValue');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.modifyPolicy(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.modifyPolicySignBy, req.body.policyName, req.body.policyType, req.body.policyValue);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/channel/modifyacl', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'resource',
    'policy', 'modifyACLSignBy');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.modifyACL(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.resource, req.body.policy, req.body.modifyACLSignBy);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }

});

router.post('/channel/updateAnchorPeer', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'peers');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.updateAnchorPeer(req.body.channelName, req.body.orderers, req.body.orgName,
    req.body.peers);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});


router.post('/api/v1.1/channel/addorg', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'newOrgDetail',
    'addOrgSignBy');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.addOrgToChannelWithCerts(req.body.newOrgDetail, req.body.addOrgSignBy,
    req.body.channelName, req.body.orderers, req.body.orgName);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

router.post('/api/v1.1/channel/delorg', async function (req, res) {

  let checkResult = common.checkParameters(req.body, 'channelName', 'orderers', 'orgName', 'delOrgName',
    'delOrgSignBy');
  if (!checkResult[0]) {
    common.responseBadRequestError(res, checkResult[1]);
    return;
  }

  let result = await fabric.delOrgFromChannel(req.body.delOrgName, req.body.delOrgSignBy, req.body.channelName,
    req.body.orderers, req.body.orgName);
  if (result[0] === true) {
    common.responseSuccess(res, {});
  } else {
    common.responseInternalError(res, result[1]);
  }
});

module.exports = router;
