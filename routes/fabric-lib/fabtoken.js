'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('FABTOKEN');
logger.level = 'DEBUG';

const helper = require('./helper');

// Issue tokens from user [issuer] to the user [recipient]
let issueFabtoken = async function (issuer, recipient, type, quantity, channelName, orderers, peers) {
  try {
    let client = await helper.getClient();
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
    logger.debug('Set token issuer to: ' + issuer.username);

    let recipientUser = await helper.createUser(recipient.username, recipient.orgMSPId, recipient.privateKeyPEM,
      recipient.signedCertPEM);
    logger.debug('Set token recipient to: ' + recipient.username);

    let tokenClient = client.newTokenClient(channel);

    // build the request to issue tokens to the user
    let tx_id = client.newTransactionID();
    let tx_id_string = tx_id.getTransactionID();
    let param = {
      owner: recipientUser.getIdentity().serialize(),
      type: type,
      quantity: quantity
    };
    let request = {
      params: [param],
      txId: tx_id,
    };

    let results = await tokenClient.issue(request);
    if (results.status !== 'SUCCESS') {
      return [false, results];
    }
    results = await helper.sendTransactionWithEventHub(channel, tx_id_string);

    if (results[0] === true) {
      return [true];
    } else {
      return [false, results];
    }
  } catch (e) {
    let errMsg = 'Issue token failed: ' + e;
    logger.error(errMsg);
    return [false, errMsg];
  }
};

// List tokens of user [owner]
let listFabtoken = async function (owner, channelName, orderers, peers) {
  try {
    let client = await helper.getClient();
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
    logger.debug('Set owner to: ' + owner.username);

    let tokenClient = client.newTokenClient(channel);

    let results = await tokenClient.list();
    return [true, results];
  } catch (e) {
    let errMsg = 'List token failed: ' + e;
    logger.error(errMsg);
    return [false, errMsg];
  }
};

// Transfer tokens from user [owner] to the user [recipient]
let transferFabtoken = async function (owner, recipient, txId, index, type, quantity, channelName, orderers, peers) {
  try {
    let client = await helper.getClient();
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
    logger.debug('Set token owner to: ' + owner.username);

    let recipientUser = await helper.createUser(recipient.username, recipient.orgMSPId, recipient.privateKeyPEM,
      recipient.signedCertPEM);
    logger.debug('Set token recipient to: ' + recipient.username);

    let tokenClient = client.newTokenClient(channel);

    // build the request to issue tokens to the user
    let tx_id = client.newTransactionID();
    let tx_id_string = tx_id.getTransactionID();
    let param = {
      owner: recipientUser.getIdentity().serialize(),
      type: type,
      quantity: quantity,
    };
    let request = {
      tokenIds: [{tx_id: txId, index: parseInt(index)}],
      params: [param],
      txId: tx_id,
    };

    let results = await tokenClient.transfer(request);
    if (results.status !== 'SUCCESS') {
      return [false, results];
    }
    results = await helper.sendTransactionWithEventHub(channel, tx_id_string);

    if (results[0] === true) {
      return [true];
    } else {
      return [false, results];
    }
  } catch (e) {
    let errMsg = 'Transfer token failed: ' + e;
    logger.error(errMsg);
    return [false, errMsg];
  }
};

// Redeem tokens from user [owner]
let redeemFabtoken = async function (owner, txId, index, quantity, channelName, orderers, peers) {
  try {
    let client = await helper.getClient();
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
    logger.debug('Set token owner to: ' + owner.username);

    let tokenClient = client.newTokenClient(channel);

    // build the request to issue tokens to the user
    let tx_id = client.newTransactionID();
    let tx_id_string = tx_id.getTransactionID();
    let param = {
      quantity: quantity,
    };
    let request = {
      tokenIds: [{tx_id: txId, index: parseInt(index)}],
      params: [param],
      txId: tx_id,
    };

    let results = await tokenClient.redeem(request);
    if (results.status !== 'SUCCESS') {
      return [false, results];
    }
    results = await helper.sendTransactionWithEventHub(channel, tx_id_string);

    if (results[0] === true) {
      return [true];
    } else {
      return [false, results];
    }
  } catch (e) {
    let errMsg = 'Redeem token failed: ' + e;
    logger.error(errMsg);
    return [false, errMsg];
  }
};

exports.issueFabtoken = issueFabtoken;
exports.listFabtoken = listFabtoken;
exports.transferFabtoken = transferFabtoken;
exports.redeemFabtoken = redeemFabtoken;
