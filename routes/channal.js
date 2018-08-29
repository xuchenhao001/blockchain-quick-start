'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Channel');
logger.level = 'DEBUG';

let fs = require('fs');
let helper = require('./helper');
let hfc = require('fabric-client');
let options = require('./config/certConfig');
let path = require('path');
let util = require('util');

hfc.setLogger(logger);

let createChannel = async function(channelName) {
  logger.debug('\n====== Creating Channel \'' + channelName + '\' ======\n');
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg('org1');
    logger.debug('Successfully got the fabric client for the organization "%s"', options.org1.msp_id);

    // read in the envelope for the channel config raw bytes
    let envelope = fs.readFileSync(path.join(__dirname, "/../sample-network/channel-artifacts/channel.tx"));
    // extract the channel config bytes from the envelope to be signed
    let channelConfig = client.extractChannelConfig(envelope);

    // Acting as a client in the given organization provided with "orgName" param
    // sign the channel config bytes as "endorsement", this is required by
    // the orderer's channel creation policy
    // this will use the admin identity assigned to the client when the connection profile was loaded
    let signature = client.signChannelConfig(channelConfig);

    let odata = fs.readFileSync(options.orderer.tls_ca);
    let caroots = Buffer.from(odata).toString();
    let orderer = client.newOrderer(options.orderer.url, {
      'pem': caroots,
      'ssl-target-name-override': "orderer.example.com"
    });

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
    let errMessage = util.format('Failed to initialize the channel: ' + err.stack ? err.stack :	err);
    logger.error(errMessage);
    return [false, errMessage];
  }
};


let joinChannel = async function(channelName, orgName) {
  logger.debug('\n\n============ Join Channel start ============\n');
  let error_message = null;
  try {
    logger.info('Calling peers in organization "%s" to join the channel', orgName);

    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
    
    let channel = client.newChannel(channelName);

    // add org peers
    let peers = options[orgName].peers;
    for (let i in peers) {
      if (peers.hasOwnProperty(i)) {
        let caData = fs.readFileSync(peers[i].tls_ca);
        let peer = client.newPeer(peers[i].peer_url, {
          pem: Buffer.from(caData).toString(),
          'ssl-target-name-override': peers[i].server_hostname
        });
        channel.addPeer(peer);
      }
    }

    // next step is to get the genesis_block from the orderer,
    // the starting point for the channel that we want to join
    let odata = fs.readFileSync(options.orderer.tls_ca);
    let caroots = Buffer.from(odata).toString();
    let orderer = client.newOrderer(options.orderer.url, {
      'pem': caroots,
      'ssl-target-name-override': "orderer.example.com"
    });
    channel.addOrderer(orderer);
    let request = {
      txId : 	client.newTransactionID(true) //get an admin based transactionID
    };
    let genesis_block = await channel.getGenesisBlock(request);

    // tell each peer to join and wait 10 seconds
    // for the channel to be created on each peer
    let promises = [];
    promises.push(new Promise(resolve => setTimeout(resolve, 10000)));

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
    for(let i in peers_results) {
      if (peers_results.hasOwnProperty(i)) {
        let peer_result = peers_results[i];
        if(peer_result.response && peer_result.response.status === 200) {
          logger.info('Successfully joined peer to the channel %s',channelName);
        } else {
          let message = util.format('Failed to joined peer to the channel %s',channelName);
          error_message = message;
          logger.error(message);
        }
      }
    }
  } catch(error) {
    logger.error('Failed to join channel due to error: ' + error.stack ? error.stack : error);
    error_message = error.toString();
  }

  if (!error_message) {
    let message = util.format(
      'Successfully joined peers in organization %s to the channel:%s',
      orgName, channelName);
    logger.info(message);
    // build a response to send back to the REST caller
    return [true, message];
  } else {
    let message = util.format('Failed to join all peers to channel. cause:%s',error_message);
    logger.error(message);
    return [false, message];
  }
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
