'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('Channel');
logger.level = 'DEBUG';

const helper = require('./helper');
const hfc = require('fabric-client');
const util = require('util');
const superagent = require('superagent');

hfc.setLogger(logger);

const configtxlatorAddr = 'http://127.0.0.1:7059';

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

  if (!error_message) {
    let message = util.format('Successfully joined peers to the channel:%s', channelName);
    logger.info(message);

    // update anchor peer (Asynchronous method)
    // for (let ordererName of orderers) {
    //   let updateAnchorResult = await updateAnchorPeer(client, channelName, orgName, ordererName);
    //   if (updateAnchorResult[0] === false) {
    //     logger.warn("Update anchor peer failed!");
    //     return [false, updateAnchorResult[1]]
    //   }
    // }

    // update anchor peer (Synchronous method)
    orderers.forEach(async function (ordererName) {
      let updateAnchorResult = await updateAnchorPeer(client, channelName, orgName, ordererName);
      if (updateAnchorResult[0] === false) {
        logger.warn("Update anchor peer failed!");
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

// add org or delete org from your exist fabric network channel's config
let modifyOrg = async function (targetOrg, modifyOrgSignBy, channelName, orderers, orgName, isRemove) {
  logger.debug('\n\n====== modify Org of existing Channel \'' + channelName + '\' ======\n');
  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    logger.debug('Successfully got the fabric client for the organization "%s"', 'Org1');

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });


    // STEP 1: get old channel config from orderer
    // peer channel fetch config config_block.pb -o orderer.example.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
    let configEnvelope = await channel.getChannelConfigFromOrderer();
    if (!configEnvelope) {
      let errMsg = "Get old channel's config failed!";
      logger.error(errMsg);
      return [false, errMsg]
    }


    // STEP 2: Decode old channel config
    // configtxlator proto_decode --input config_block.pb --type common.Block |
    // ...  jq .data.data[0].payload.data.config > config.json
    let oldChannelConfig = await superagent.post(configtxlatorAddr + '/protolator/decode/common.Config',
      configEnvelope.config.toBuffer())
      .then((res) => {
        return res;
      }).catch(err => {
        if (err.response && err.response.text) {
          logger.error(err.response.text);
          throw err.response.text;
        } else {
          throw err
        }
      });
    if (!oldChannelConfig) {
      let errMsg = "Decode channel's config failed!";
      logger.error(errMsg);
      return [false, errMsg]
    }
    oldChannelConfig = JSON.parse(oldChannelConfig.text); // Convert string to JSON object
    logger.debug("Fetch channel config json successfully: " + JSON.stringify(oldChannelConfig));


    // STEP 3: generate new org's config json
    // export FABRIC_CFG_PATH=$PWD && ../../bin/configtxgen -printOrg Org3MSP > ../channel-artifacts/org3.json
    let newOrgMSPID, newOrgJSON;
    if (!isRemove) {
      let genNewOrgResponse = await helper.generateNewOrgJSON(channelName, targetOrg);
      if (genNewOrgResponse[0] !== true) {
        logger.error("Generated new org's config json failed!");
        return [false, genNewOrgResponse[1]]
      }
      newOrgMSPID = genNewOrgResponse[1];
      newOrgJSON = genNewOrgResponse[2];
      logger.debug("Generated new org's config json successfully: " + newOrgJSON);
    } else {
      newOrgMSPID = await helper.loadOrgMSP(targetOrg);
      if (!newOrgMSPID) {
        let errMsg = "Load org's mspid from network-ext-config file failed!";
        logger.error(errMsg);
        return [false, errMsg]
      }
    }


    // STEP 4: merge new org's json with old channelConfig
    // jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}'
    // ...  config.json ./channel-artifacts/org3.json > modified_config.json
    let modifiedChannelConfig = JSON.parse(JSON.stringify(oldChannelConfig)); // Deep copy
    if (!isRemove) {
      modifiedChannelConfig.channel_group.groups.Application.groups[newOrgMSPID] = newOrgJSON;
    } else {
      delete modifiedChannelConfig.channel_group.groups.Application.groups[newOrgMSPID];
    }
    logger.debug("After merge: " + JSON.stringify(modifiedChannelConfig));


    // STEP 5: Encode original channel config json to pb block
    // configtxlator proto_encode --input config.json --type common.Config --output config.pb
    let channelConfigPB = await superagent.post(configtxlatorAddr + '/protolator/encode/common.Config',
      JSON.stringify(oldChannelConfig)).buffer()
      .then((res) => {
        return res.body;
      }).catch(err => {
        if (err.response && err.response.text) {
          logger.error(err.response.text);
          throw err.response.text;
        } else {
          throw err
        }
      });
    if (!channelConfigPB) {
      let errMsg = "Encode old channel's config failed!";
      logger.error(errMsg);
      return [false, errMsg]
    }
    logger.debug("Encode old channel's config successfully: " + channelConfigPB);


    // STEP 6: Encode new channel config json to pb block
    // configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
    let newChannelConfigPB = await superagent.post(configtxlatorAddr + '/protolator/encode/common.Config',
      JSON.stringify(modifiedChannelConfig)).buffer()
      .then((res) => {
        return res.body;
      }).catch(err => {
        if (err.response && err.response.text) {
          logger.error(err.response.text);
          throw err.response.text;
        } else {
          throw err
        }
      });
    if (!newChannelConfigPB) {
      let errMsg = "Encode new channel's config failed!";
      logger.error(errMsg);
      return [false, errMsg]
    }
    logger.debug("Encode new channel's config successfully: " + newChannelConfigPB);


    // STEP 7: Finding delta between old and new channel config pb block
    // configtxlator compute_update --channel_id $CHANNEL_NAME --original config.pb
    // ...  --updated modified_config.pb --output org3_update.pb
    let computeUpdatePB = await superagent.post(configtxlatorAddr + '/configtxlator/compute/update-from-configs')
      .attach("original", new Buffer(channelConfigPB), "config.pb")
      .attach("updated", new Buffer(newChannelConfigPB), "modified_config.pb")
      .field("channel", channelName)
      .buffer()
      .then((res) => {
        return res.body;
      }).catch(err => {
        if (err.response && err.response.text) {
          logger.error(err.response.text);
          throw err.response.text;
        } else {
          throw err
        }
      });
    logger.debug("Compute update from configs successfully: " + computeUpdatePB);


    // STEP 8: decode updatePB file to computeUpdate json
    // configtxlator proto_decode --input org3_update.pb --type common.ConfigUpdate | jq . > org3_update.json
    let computeUpdate = await superagent.post(configtxlatorAddr + '/protolator/decode/common.ConfigUpdate',
      computeUpdatePB)
      .then((res) => {
        return JSON.parse(res.text);
      }).catch(err => {
        if (err.response && err.response.text) {
          logger.error(err.response.text);
          throw err.response.text;
        } else {
          throw err
        }
      });
    logger.debug("Decoded update PB file to json successfully: " + computeUpdate);


    // STEP 9: envelop computeUpdate json to computeUpdateEnvelop json
    // echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},
    // ...  "data":{"config_update":'$(cat org3_update.json)'}}}' | jq . > org3_update_in_envelope.json
    let computeUpdateEnvelop = {
      "payload": {
        "header": {
          "channel_header": {
            "channel_id": channelName,
            "type": 2
          }
        },
        "data": {
          "config_update": computeUpdate
        }
      }
    };

    // STEP 10: encode to computeUpdateEnvelop pb file
    // configtxlator proto_encode --input org3_update_in_envelope.json
    // ...  --type common.Envelope --output org3_update_in_envelope.pb
    let computeUpdateEnvelopPB = await superagent.post(configtxlatorAddr + '/protolator/encode/common.Envelope',
      JSON.stringify(computeUpdateEnvelop))
      .buffer()
      .then((res) => {
        return res.body;
      }).catch(err => {
        if (err.response && err.response.text) {
          logger.error(err.response.text);
          throw err.response.text;
        } else {
          throw err
        }
      });

    // STEP 11: extract the channel config bytes from the envelope to be signed
    let channelConfig = client.extractChannelConfig(computeUpdateEnvelopPB);

    // STEP 12: Signing the new channel config by each org
    let signatures = [];
    for (let signerOrg of modifyOrgSignBy) {
      let signerClient = await helper.getClientForOrg(signerOrg);
      signatures.push(signerClient.signChannelConfig(channelConfig));
      logger.debug('New channel config signed by: ' + signerOrg)
    }

    // STEP 13: Making the request and send to orderer
    let request = {
      config: channelConfig,
      signatures: signatures,
      name: channelName,
      txId: client.newTransactionID(true) // get an admin based transactionID
    };
    let response = await client.updateChannel(request);
    logger.debug('Response ::%j', response);
    if (response && response.status === 'SUCCESS') {
      logger.debug('Successfully updated the channel.');
      return [true];
    } else {
      let errMsg = util.format('Failed to modify new org the channel %s: %s', channelName, response.info);
      return [false, errMsg];
    }

  } catch (err) {
    let errMessage = util.format('Failed to modify new org the channel: ' + err);
    logger.error(errMessage);
    return [false, errMessage];
  }
};

let updateAnchorPeer = async function (client, channelName, orgName, ordererName) {
  logger.debug('\n\n====== Updating Anchor Peer \'' + channelName + '\' ======\n');

  // read in the envelope for the channel config raw bytes
  let genesisOrgNameResult = await helper.loadGenesisOrgName(orgName);
  if (genesisOrgNameResult[0] === false) {
    return [false, genesisOrgNameResult[1]];
  }
  let createTxResult = await helper.generateUpdateAnchorTx(channelName, [orgName], genesisOrgNameResult[1]);
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

  // get an admin based transactionID.
  // This should be set to false, but if that, you must call function:
  // client.setUserContext({username:'admin', password:'adminpw'}, false);
  // to setup a new User object. And since that, you have to enable your CA
  // with you all the time.
  // For convenience, I just do all of these transactions with admin user.
  let tx_id = client.newTransactionID(true);
  let request = {
    config: channelConfig,
    name: channelName,
    orderer: orderer,
    signatures: [signature],
    txId: tx_id
  };

  // send to orderer
  let response = await client.updateChannel(request);
  logger.debug(' response ::%j', response);
  if (response && response.status === 'SUCCESS') {
    logger.debug('Successfully updated anchor peer');
    return [true];
  } else {
    let errMessage = util.format('Failed to update anchor peer %s: %s', channelName, response.info);
    logger.warn(errMessage);
    return [false, errMessage];
  }
};

exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.modifyOrg = modifyOrg;
