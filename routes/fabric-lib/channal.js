'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('Channel');
logger.level = 'DEBUG';

const helper = require('./helper');
const hfc = require('fabric-client');
const util = require('util');

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
  let client;

  try {
    // first setup the client for this org
    logger.info('Calling peers in organization "%s" to join the channel', orgName);
    client = await helper.getClientForOrg(orgName);
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
    promises.push(new Promise(resolve => setTimeout(resolve, 2000)));

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
  } catch (error) {
    error_message = util.format('Failed to join channel due to error: ' + error.stack ? error.stack : error);
    logger.error(error_message);
  }

  if (!error_message) {
    let messageJoinChannel = util.format('Successfully joined peers to the channel: %s', channelName);
    logger.info(messageJoinChannel);

    // update anchor peer
    let messageUpdateAnchor;
    let updateAnchorResult = await updateAnchorPeer(channelName, orderers, orgName, peers);
    if (updateAnchorResult[0] === false) {
      messageUpdateAnchor = util.format("Update anchor peer failed: " + updateAnchorResult[1]);
      logger.warn(messageUpdateAnchor);
      // no that we don't judge if automatically update anchor peer success
      // return [false, updateAnchorResult[1]]
    } else {
      messageUpdateAnchor = util.format('Successfully updated anchor peer(s): %s', JSON.stringify(peers));
      logger.info(messageUpdateAnchor);
    }

    return [true, messageJoinChannel + '; ' + messageUpdateAnchor];
  } else {
    let message = util.format('Failed to join all peers to channel. cause:%s', error_message);
    logger.error(message);
    return [false, message];
  }
};

// add org or delete org from your exist fabric network channel's config
// withCerts: boolean, indicate if request carrying certs, update network-config in memory.
let modifyOrg = async function (targetOrg, modifyOrgSignBy, channelName, orderers, orgName, isRemove,
                                         withCerts) {
  logger.debug('\n\n====== modify Org of existing Channel \'' + channelName + '\' ======\n');
  try {

    // judge situations and extract target Org name
    let targetOrgName;
    if (withCerts) {
      if (isRemove) {
        targetOrgName = targetOrg;
      } else {
        targetOrgName = targetOrg.name;
      }
    } else {
      targetOrgName = targetOrg;
    }
    if (!targetOrgName) {
      let errMsg = "Target Org's name doesn't exist";
      logger.error(errMsg);
      return [false, errMsg];
    }

    // If carrying certs, update memory first
    // If add org, update network config & network extend config in memory first
    if (withCerts && !isRemove) {
      let updateNetConfResult = await helper.newOrgUpdateNetworkConfig(targetOrg);
      if (!updateNetConfResult[0]) {
        logger.error(updateNetConfResult[1]);
        return [false, updateNetConfResult[1]];
      }
      logger.debug("Successfully updated network config & network extend config in memory");
    }

    // setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    logger.debug('Successfully got the fabric client for the organization "%s"', 'Org1');

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });


    // STEP 1: get old channel config from orderer
    let fetchResult = await helper.fetchOldChannelConfig(channel);
    if (!fetchResult[0]){
      return [false, fetchResult[1]];
    }
    let oldChannelConfig = fetchResult[1];


    // STEP 2: generate new org's config json
    // export FABRIC_CFG_PATH=$PWD && ../../bin/configtxgen -printOrg Org3MSP > ../channel-artifacts/org3.json
    let newOrgMSPID, newOrgJSON;
    if (!isRemove) {
      let genNewOrgResponse = await helper.generateNewOrgJSON(channelName, targetOrgName);
      if (genNewOrgResponse[0] !== true) {
        logger.error("Generated new org's config json failed!");
        return [false, genNewOrgResponse[1]]
      }
      newOrgJSON = genNewOrgResponse[1];
      logger.debug("Generated new org's config json successfully: " + JSON.stringify(newOrgJSON));
    } else {
      newOrgMSPID = await helper.loadOrgMSP(targetOrgName);
      if (!newOrgMSPID) {
        let errMsg = "Load org's mspid from network-ext-config file failed!";
        logger.error(errMsg);
        return [false, errMsg]
      }
    }


    // STEP 3: merge new org's json with old channelConfig
    // jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}'
    // ...  config.json ./channel-artifacts/org3.json > modified_config.json
    let modifiedChannelConfig = JSON.parse(JSON.stringify(oldChannelConfig)); // Deep copy
    if (!isRemove) {
      modifiedChannelConfig.channel_group.groups.Application.groups[targetOrgName] = newOrgJSON;
    } else {
      delete modifiedChannelConfig.channel_group.groups.Application.groups[targetOrgName];
    }
    logger.debug("After merge: " + JSON.stringify(modifiedChannelConfig));


    // STEP 4: generate the channel config bytes from the envelope to be signed
    let generateResult = await helper.generateNewChannelConfig(channelName, oldChannelConfig, modifiedChannelConfig);
    if (!generateResult[0]) {
      return [false, generateResult[1]];
    }
    let channelConfig = generateResult[1];


    // STEP 5: Signing the new channel config by each org
    let signatures = [];
    for (let signerOrg of modifyOrgSignBy) {
      let signerClient = await helper.getClientForOrg(signerOrg);
      signatures.push(signerClient.signChannelConfig(channelConfig));
      logger.debug('New channel config signed by: ' + signerOrg)
    }

    // STEP 6: Making the request and send to orderer
    let request = {
      config: channelConfig,
      signatures: signatures,
      name: channelName,
      txId: client.newTransactionID(true) // get an admin based transactionID
    };
    let response = await client.updateChannel(request);
    logger.debug('Response ::%j', response);
    if (response && response.status === 'SUCCESS') {
      if (isRemove) {
        logger.debug('Successfully delete org [' + targetOrg + '] from channel ' + channelName);
      } else {
        logger.debug('Successfully add org [' + targetOrg + '] to channel ' + channelName);
      }
      return [true];
    } else {
      let errMessage;
      if (isRemove) {
        errMessage = util.format('Failed to delete org [%s] from channel [%s] due to error: %s',
          targetOrg, channelName, response.info);
      } else {
        errMessage = util.format('Failed to add org [%s] to channel [%s] due to error: %s',
          targetOrg, channelName, response.info);
      }
      logger.error(errMessage);
      return [false, errMessage];
    }

  } catch (err) {
    let errMessage;
    if (isRemove) {
      errMessage = util.format('Failed to delete org [%s] from channel [%s] due to error: %s',
        targetOrg, channelName, err);
    } else {
      errMessage = util.format('Failed to add org [%s] to channel [%s] due to error: %s',
        targetOrg, channelName, err);
    }
    logger.error(errMessage);
    return [false, errMessage];
  }
};

let updateAnchorPeer = async function (channelName, orderers, orgName, peers) {
  logger.debug('\n\n====== Updating Anchor Peer \'' + channelName + '\' ======\n');

  let client = await helper.getClientForOrg(orgName);

  // read in the envelope for the channel config raw bytes
  let genesisOrgNameResult = await helper.loadGenesisOrgName(orgName);
  if (genesisOrgNameResult[0] === false) {
    return [false, genesisOrgNameResult[1]];
  }
  let genesisOrgName = genesisOrgNameResult[1];

  let channel = client.newChannel(channelName);
  // assign orderer to channel
  orderers.forEach(function (ordererName) {
    channel.addOrderer(client.getOrderer(ordererName));
  });

  try {
    // get old channel config from orderer
    let fetchResult = await helper.fetchOldChannelConfig(channel);
    if (!fetchResult[0]){
      return [false, fetchResult[1]];
    }
    let oldChannelConfig = fetchResult[1];

    // generate new channel config json with new anchor peers
    let newChannelConfig = JSON.parse(JSON.stringify(oldChannelConfig)); // Deep copy
    if (oldChannelConfig.channel_group.groups.Application.groups[genesisOrgName]){
      // extract old anchor peers config
      let oldAnchor = oldChannelConfig.channel_group.groups.Application.groups[genesisOrgName].values.AnchorPeers;

      if (oldAnchor) {
        // there are already some anchor peers there
        let oldAnchorPeerList = oldAnchor.value.anchor_peers;
        let genAnchorPeerResult = await helper.generateAnchorPeerList(genesisOrgName, peers);
        if (!genAnchorPeerResult[0]) {
          return [false, genAnchorPeerResult[1]]
        }
        let genAnchorPeerList = genAnchorPeerResult[1];
        let newAnchorPeerList = await helper.mergeAnchorPeers(oldAnchorPeerList, genAnchorPeerList);
        logger.debug("Generated new anchor peer list: " + JSON.stringify(newAnchorPeerList));

        newChannelConfig.channel_group.groups.Application.groups[genesisOrgName].values.AnchorPeers.value.anchor_peers
          = newAnchorPeerList;
      } else {
        // there is no anchor peers before
        let genAnchorPeerResult = await helper.generateAnchorPeerList(genesisOrgName, peers);
        if (!genAnchorPeerResult[0]) {
          return [false, genAnchorPeerResult[1]]
        }
        let genAnchorPeerList = genAnchorPeerResult[1];
        newChannelConfig.channel_group.groups.Application.groups[genesisOrgName].values.AnchorPeers = {
          "mod_policy": "Admins",
          "value": {
            "anchor_peers": genAnchorPeerList
          },
          "version": "0"
        }
      }
    } else {
      return [false, 'Channel [' + channelName + '] doesn\'t contain organization: ' + genesisOrgName ]
    }
    logger.debug('Generate organization ' + genesisOrgName + '\'s new anchor peers config: ' + JSON.stringify(
      newChannelConfig.channel_group.groups.Application.groups[genesisOrgName].values.AnchorPeers));

    // generate the channel config bytes from the envelope to be signed
    let generateResult = await helper.generateNewChannelConfig(channelName, oldChannelConfig, newChannelConfig);
    if (!generateResult[0]) {
      return [false, generateResult[1]];
    }
    let channelConfig = generateResult[1];

    // Signing the new channel config by client
    let signature = client.signChannelConfig(channelConfig);

    // Making the request and send to orderer
    let request = {
      config: channelConfig,
      signatures: [signature],
      name: channelName,
      txId: client.newTransactionID(true) // get an admin based transactionID
    };

    // send to orderer
    let response = await client.updateChannel(request);
    logger.debug(' response ::%j', response);
    if (response && response.status === 'SUCCESS') {
      logger.debug('Successfully updated anchor peer on channel ' + channelName);
      return [true];
    } else {
      let errMessage = util.format('Failed to update anchor peer on channel [%s] due to error: %s',
        channelName, response.info);
      logger.error(errMessage);
      return [false, errMessage];
    }
  } catch (error) {
    let errMessage = util.format('Failed to update anchor peer on channel [%s] due to error: %s', channelName, error);
    logger.error(errMessage);
    return [false, errMessage];
  }
};

let modifyACL = async function (channelName, orderers, orgName, resource, policy, modifyACLSignBy) {
  logger.debug('\n\n====== Modifying Channel \'' + channelName + '\' ACLs ======\n');
  logger.debug('Resource [' + resource + '] to be changed with policy [' + policy + ']');

  let client = await helper.getClientForOrg(orgName);

  let channel = client.newChannel(channelName);
  // assign orderer to channel
  orderers.forEach(function (ordererName) {
    channel.addOrderer(client.getOrderer(ordererName));
  });

  try {
    // get old channel config from orderer
    let fetchResult = await helper.fetchOldChannelConfig(channel);
    if (!fetchResult[0]) {
      return [false, fetchResult[1]];
    }
    let oldChannelConfig = fetchResult[1];

    // generate new channel config json
    let newChannelConfig = JSON.parse(JSON.stringify(oldChannelConfig)); // Deep copy
    if (!newChannelConfig.channel_group.groups.Application.values.ACLs){
      // if ACLs object doesn't exist (formal version's channel config doesn't include this)
      newChannelConfig.channel_group.groups.Application.values.ACLs = helper.generateDefaultACLs();
    }
    let acls = newChannelConfig.channel_group.groups.Application.values.ACLs.value.acls;
    acls[resource] = {
      "policy_ref": policy
    };

    logger.debug('Generate new acls: ' + JSON.stringify(acls));
    // generate the channel config bytes from the envelope to be signed
    let generateResult = await helper.generateNewChannelConfig(channelName, oldChannelConfig, newChannelConfig);
    if (!generateResult[0]) {
      return [false, generateResult[1]];
    }
    let channelConfig = generateResult[1];

    // Signing the new channel config by client
    let signatures = [];
    for (let signerOrg of modifyACLSignBy) {
      let signerClient = await helper.getClientForOrg(signerOrg);
      signatures.push(signerClient.signChannelConfig(channelConfig));
      logger.debug('New channel config signed by: ' + signerOrg)
    }

    // Making the request and send to orderer
    let request = {
      config: channelConfig,
      signatures: signatures,
      name: channelName,
      txId: client.newTransactionID(true) // get an admin based transactionID
    };

    // send to orderer
    let response = await client.updateChannel(request);
    logger.debug(' response ::%j', response);
    if (response && response.status === 'SUCCESS') {
      logger.debug('Successfully updated acl on channel ' + channelName);
      return [true];
    } else {
      let errMessage = util.format('Failed to update acl on channel [%s] due to error: %s', channelName, response.info);
      logger.error(errMessage);
      return [false, errMessage];
    }

  } catch (error) {
    let errMessage = util.format('Failed to update acl on channel [%s] due to error: %s', channelName, error);
    logger.error(errMessage);
    return [false, errMessage];
  }
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.updateAnchorPeer = updateAnchorPeer;
exports.modifyOrg = modifyOrg;
exports.modifyACL = modifyACL;
