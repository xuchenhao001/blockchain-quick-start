'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Channel');
logger.level = 'DEBUG';

let helper = require('./helper');
let hfc = require('fabric-client');
let util = require('util');

hfc.setLogger(logger);


let createChannel = async function (channelName, includeOrgNames, ordererName, orgName) {
  logger.debug('\n\n====== Creating Channel \'' + channelName + '\' ======\n');
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    logger.debug('Successfully got the fabric client for the organization "%s"', 'Org1');

    // read in the envelope for the channel config raw bytes
    let createTxResult = await helper.generateChannelTx(channelName, includeOrgNames);
    if (createTxResult[0] === false) {
      return [false, createTxResult[1]];
    }
    // extract the channel config bytes from the envelope to be signed
    let channelConfig = client.extractChannelConfig(createTxResult[1]);

    // Acting as a client in the given organization provided with "orgName" param
    // sign the channel config bytes as "endorsement", this is required by
    // the orderer's channel creation policy
    // this will use the admin identity assigned to the client when the connection profile was loaded
    let signature = client.signChannelConfig(channelConfig);

    let orderer = client.getOrderer(ordererName);

    let request = {
      config: channelConfig,
      name: channelName,
      orderer: orderer,
      signatures: [signature],
      txId: client.newTransactionID(true) // get an admin based transactionID
    };

    // send to orderer
    let response = await client.createChannel(request);
    logger.debug(' response ::%j', response);
    if (response && response.status === 'SUCCESS') {
      logger.debug('Successfully created the channel.');
      return [true];
    } else {
      let errMessage = util.format('Failed to create the channel %s: %s', channelName, response.info);
      logger.error(errMessage);
      return [false, errMessage];
    }
  } catch (err) {
    let errMessage = util.format('Failed to initialize the channel: ' + err.stack ? err.stack : err);
    logger.error(errMessage);
    return [false, errMessage];
  }
};


let joinChannel = async function (channelName, orderers, orgName, peers) {
  logger.debug('\n\n============ Join Channel start ============\n');
  let error_message = null;

  // first setup the client for this org
  logger.info('Calling peers in organization "%s" to join the channel', orgName);
  let client = await helper.getClientForOrg(orgName);
  logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

  let channel = client.newChannel(channelName);
  // assign orderer to channel
  orderers.forEach(function (ordererName) {
    channel.addOrderer(client.getOrderer(ordererName));
  });
  // assign peers to channel
  peers.forEach(function (peerName) {
    channel.addPeer(client.getPeer(peerName));
  });

  let request = {
    txId: client.newTransactionID(true) //get an admin based transactionID
  };
  let genesis_block = await channel.getGenesisBlock(request);

  // tell each peer to join and wait 2 seconds
  // for the channel to be created on each peer
  let promises = [];
  promises.push(new Promise(resolve => setTimeout(resolve, 1500)));

  let join_request = {
    txId: client.newTransactionID(true), //get an admin based transactionID
    block: genesis_block
  };
  let join_promise = channel.joinChannel(join_request);
  promises.push(join_promise);
  let results = await Promise.all(promises);
  logger.debug(util.format('Join Channel R E S P O N S E : %j', results));

  // lets check the results of sending to the peers which is
  // last in the results array
  let peers_results = results.pop();
  // then each peer results
  for (let i in peers_results) {
    if (peers_results.hasOwnProperty(i)) {
      let peer_result = peers_results[i];
      if (peer_result.response && peer_result.response.status === 200) {
        logger.info('Successfully joined peers of %s to the channel %s', orgName, channelName);
      } else {
        error_message = util.format('Failed to joined peers of %s to the channel %s',
          orgName, channelName);
        logger.error(error_message);
      }
    }
  }

  if (!error_message) {
    let message = util.format('Successfully joined peers to the channel:%s', channelName);
    logger.info(message);

    // update anchor peer
    orderers.forEach(async function (ordererName) {
      let updateAnchorResult = await updateAnchorPeer(client, channelName, orgName, ordererName);
      if (updateAnchorResult[0] === false) {
        logger.error("Update anchor peer failed!");
        return [false, updateAnchorResult[1]]
      }
    });

    return [true, message];
  } else {
    let message = util.format('Failed to join all peers to channel. cause:%s', error_message);
    logger.error(message);
    return [false, message];
  }
};

let updateAnchorPeer = async function (client, channelName, orgName, ordererName) {
  logger.debug('\n\n====== Updating Anchor Peer \'' + channelName + '\' ======\n');

  // read in the envelope for the channel config raw bytes
  let mspId = client.getMspid();
  let createTxResult = await helper.generateUpdateAnchorTx(channelName, [orgName], mspId);
  if (createTxResult[0] === false) {
    return [false, createTxResult[1]];
  }

  // extract the channel config bytes from the envelope to be signed
  let channelConfig = client.extractChannelConfig(createTxResult[1]);

  // Acting as a client in the given organization provided with "orgName" param
  // sign the channel config bytes as "endorsement", this is required by
  // the orderer's channel creation policy
  // this will use the admin identity assigned to the client when the connection profile was loaded
  let signature = client.signChannelConfig(channelConfig);

  let orderer = client.getOrderer(ordererName);

  let request = {
    config: channelConfig,
    name: channelName,
    orderer: orderer,
    signatures: [signature],
    txId: client.newTransactionID()
  };

  // send to orderer
  let response = await client.updateChannel(request);
  logger.debug(' response ::%j', response);
  if (response && response.status === 'SUCCESS') {
    logger.debug('Successfully updated anchor peer');
    return [true];
  } else {
    let errMessage = util.format('Failed to update anchor peer %s: %s', channelName, response.info);
    logger.error(errMessage);
    return [false, errMessage];
  }
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
