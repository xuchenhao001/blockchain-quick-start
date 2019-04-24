'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('FABTOKEN');
logger.level = 'DEBUG';

const helper = require('./helper');

// Issue tokens from user [issuer] to the user [issueTo]
let issueFabtoken = async function (issuer, issueTo, issueType, issueQuantity, channelName, orderers, peers, orgName) {
  logger.debug('\n\n============ Issue tokens from org \'' + orgName + '\' ============\n');
  try {
    let client = await helper.getClientForOrg(orgName);
    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    let issuerUser = await helper.createUser(issuer.username, issuer.orgMSPId, issuer.privateKeyPEM,
      issuer.signedCertPEM);
    await client.setUserContext(issuerUser, true);
    logger.debug('Set client with issuer: ' + issuer.username);

    let issueToUser = await helper.createUser(issueTo.username, issueTo.orgMSPId, issueTo.privateKeyPEM,
      issueTo.signedCertPEM);
    logger.debug('Set token owner with issueTo: ' + issueTo.username);

    const tokenClient = client.newTokenClient(channel);

    // build the request to issue tokens to the user
    const txId = client.newTransactionID();
    const param = {
      owner: issueToUser.getIdentity().serialize(),
      type: issueType,
      quantity: issueQuantity
    };
    const request = {
      params: [param],
      txId: txId,
    };

    let results = await tokenClient.issue(request);
    if (results.status === 'SUCCESS') {
      return [true];
    } else {
      return [false, results.info];
    }
  } catch (e) {
    let errMsg = 'Issue token failed: ' + e;
    logger.error(errMsg);
    return [false, errMsg];
  }
};

// List tokens of user [owner]
let listFabtoken = async function (owner, channelName, orderers, peers, orgName) {
  logger.debug('\n\n============ List tokens from org \'' + orgName + '\' ============\n');
  try {
    let client = await helper.getClientForOrg(orgName);
    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    let ownerUser = await helper.createUser(owner.username, owner.orgMSPId, owner.privateKeyPEM,
      owner.signedCertPEM);
    await client.setUserContext(ownerUser, true);
    logger.debug('Set client with owner: ' + owner.username);

    const tokenClient = client.newTokenClient(channel);

    let results = await tokenClient.list();
    logger.debug('List token response: %j', results);
    return [true, results];
  } catch (e) {
    let errMsg = 'Issue token failed: ' + e;
    logger.error(errMsg);
    return [false, errMsg];
  }
};

exports.issueFabtoken = issueFabtoken;
exports.listFabtoken = listFabtoken;
