'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('DeployCC');
logger.level = 'DEBUG';

const helper = require('./helper');
const hfc = require('fabric-client');
const util = require('util');
const uuid = require('uuid');
const path = require('path');

hfc.setLogger(logger);

let installChaincode = async function (chaincode, chaincodeName, chaincodePath, chaincodeType,
                                       chaincodeVersion, orgName, peers, localPath) {
  logger.debug('\n\n============ Install chaincode on organizations ============\n');
  let error_message = null;

  // check if this kind of chaincode supported
  if (chaincodeType !== 'golang') {
    return [false, 'Does not support this kind of chaincode!'];
  }

  process.env.GOPATH = path.join('./');

  // if it's already under local path, just ignore chaincode buffer
  if (!localPath) {

    process.env.GOPATH = path.join(process.env.GOPATH, uuid.v4());

    // check if the chaincode is valid
    if (!helper.isBase64(chaincode)) {
      return [false, 'Chaincode is not a valid base64 string!'];
    }
    let chaincodeBuffer = new Buffer(chaincode, 'base64');

    // check if the chaincode is tar.gz package
    if (helper.isGzip(chaincodeBuffer)) {

      logger.info('Got chaincode tar.gz package, decompress it');

      let tarballName = uuid.v4();
      helper.writeFile(tarballName, chaincodeBuffer);
      await helper.decompressTarGz(tarballName, process.env.GOPATH);
      helper.removeFile(tarballName);
    } else {

      logger.info('Got chaincode single file buffer');

      helper.writeFile(path.join(process.env.GOPATH, 'src', chaincodePath, 'chaincode.go'), chaincodeBuffer)
    }
  } else {
    process.env.GOPATH = path.join(process.env.GOPATH, localPath);
  }

  try {
    // install chaincode for each org
    logger.info('Calling peers in organization "%s" to join the channel', orgName);
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

    let request = {
      targets: peers,
      chaincodePath: chaincodePath,
      chaincodeId: chaincodeName,
      chaincodeVersion: chaincodeVersion,
      chaincodeType: chaincodeType
    };
    let results = await client.installChaincode(request);
    // the returned object has both the endorsement results (results[0])
    // and the actual proposal (results[1])
    let proposalResponses = results[0];

    // lets have a look at the responses to see if they are
    // all good, if good they will also include signatures
    // required to be committed
    let all_good = true;
    for (let i in proposalResponses) {
      if (proposalResponses.hasOwnProperty(i)) {
        let one_good = false;
        if (proposalResponses && proposalResponses[i].response &&
          proposalResponses[i].response.status === 200) {
          one_good = true;
          logger.info('install proposal was good');
        } else {
          logger.error('install proposal was bad %s', proposalResponses.toString());
        }
        all_good = all_good && one_good;
      }
    }
    if (all_good) {
      logger.info('Successfully sent install Proposal and received ProposalResponse');
    } else {
      error_message = 'Failed to send install Proposal or receive valid response. ' +
        'Response null or status is not 200';
      logger.error(error_message);
    }
  }
  catch (error) {
    logger.error('Failed to install due to error: ' + error.stack ? error.stack : error);
    error_message = error.toString();
  }

  // remove useless chaincode directory
  if (!localPath) {
    await helper.removeFile(process.env.GOPATH);
  }

  if (!error_message) {
    let message = util.format('Successfully install chaincode');
    logger.info(message);
    return [true, message];
  } else {
    let message = util.format('Failed to install due to:%s', error_message);
    logger.error(message);
    return [false, message];
  }
};


let instantiateUpgradeChaincode = async function(chaincodeName, chaincodeType, chaincodeVersion, channelName,
                                                 functionName, args, orderers, orgName, peers, endorsementPolicy,
                                                 collection, useDiscoverService, isUpgrade) {
  logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
    ' ============\n');
  let error_message = '';

  try {
    // first setup the client for this org
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

    if (useDiscoverService) {
      logger.debug("Got useDiscoverService, do request with service discovery");
      let asLocalhost = await helper.asLocalhost();
      await channel.initialize({discover: true, asLocalhost: asLocalhost});
    }

    let tx_id = client.newTransactionID(true); // Get an admin based transactionID
    // An admin based transactionID will
    // indicate that admin identity should
    // be used to sign the proposal request.
    // will need the transaction ID string for the event registration later
    let deployId = tx_id.getTransactionID();

    // send proposal to endorser
    let request = {
      chaincodeId: chaincodeName,
      chaincodeType: chaincodeType,
      chaincodeVersion: chaincodeVersion,
      args: args,
      txId: tx_id
    };

    logger.debug("Instantiate chaincode request: " + JSON.stringify(request));

    // load endorsement policy if exists
    if (endorsementPolicy) {
      request['endorsement-policy'] = await helper.decodeEndorsementPolicy(endorsementPolicy);
      logger.debug("Get endorsement policy, update init request: " + JSON.stringify(request));
    }

    // load collection if exists
    if (collection) {
      let result = await helper.loadCollection(collection);
      if (result[0]) {
        request['collections-config'] = result[1];
        logger.debug('Get collection, update init request: ' + JSON.stringify(request));
      } else {
        logger.error(result[1]);
        return [false, result[1]]
      }
    }

    if (functionName) {
      request.fcn = functionName;
    }

    let results;
    if (isUpgrade) {
      results = await channel.sendUpgradeProposal(request, 600000); //upgrade takes much longer
    } else {
      results = await channel.sendInstantiateProposal(request, 600000); //instantiate takes much longer
    }

    // wipe collection config file
    if (request['collections-config']) {
      await helper.removeFile(request['collections-config']);
    }

    // the returned object has both the endorsement results
    // and the actual proposal, the proposal will be needed
    // later when we send a transaction to the orderer
    let proposalResponses = results[0];
    let proposal = results[1];

    // lets have a look at the responses to see if they are
    // all good, if good they will also include signatures
    // required to be committed
    let all_good = true;
    for (let i in proposalResponses) {
      let one_good = false;
      if (proposalResponses && proposalResponses[i].response &&
        proposalResponses[i].response.status === 200) {
        one_good = true;
        logger.info('instantiate success');
      } else {
        let err_detail = 'instantiate failed: ' + proposalResponses[i];
        logger.error(err_detail);
        error_message = error_message + err_detail;
      }
      all_good = all_good && one_good;
    }

    if (all_good) {
      logger.info(util.format(
        'Successfully sent Proposal and received ProposalResponse: ' +
        'Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
        proposalResponses[0].response.status, proposalResponses[0].response.message,
        proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

      // wait for the channel-based event hub to tell us that the
      // instantiate transaction was committed on the peer
      let promises = [];
      let event_hubs = channel.getChannelEventHubsForOrg();
      logger.debug('found %s eventhubs for this organization %s',event_hubs.length, orgName);
      event_hubs.forEach((eh) => {
        let instantiateEventPromise = new Promise((resolve, reject) => {
          logger.debug('instantiateEventPromise - setting up event');
          let event_timeout = setTimeout(() => {
            let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
            logger.error(message);
            eh.disconnect();
            return [false, message];
          }, 600000);
          eh.registerTxEvent(deployId, (tx, code, block_num) => {
              logger.info('The chaincode instantiate transaction has been committed on peer %s',eh.getPeerAddr());
              logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
              clearTimeout(event_timeout);

              if (code !== 'VALID') {
                let message = util.format('The chaincode instantiate transaction was invalid, code:%s',code);
                logger.error(message);
                reject(new Error(message));
              } else {
                let message = 'The chaincode instantiate transaction was valid.';
                logger.info(message);
                resolve(message);
              }
            }, (err) => {
              clearTimeout(event_timeout);
              logger.error(err);
              reject(err);
            },
            // the default for 'unregister' is true for transaction listeners
            // so no real need to set here, however for 'disconnect'
            // the default is false as most event hubs are long running
            // in this use case we are using it only once
            {unregister: true, disconnect: true}
          );
          eh.connect();
        });
        promises.push(instantiateEventPromise);
      });

      let orderer_request = {
        txId: tx_id, // must include the transaction id so that the outbound
                     // transaction to the orderer will be signed by the admin
        // id as was the proposal above, notice that transactionID
        // generated above was based on the admin id not the current
        // user assigned to the 'client' instance.
        proposalResponses: proposalResponses,
        proposal: proposal
      };
      let sendPromise = channel.sendTransaction(orderer_request);
      // put the send to the orderer last so that the events get registered and
      // are ready for the orderering and committing
      promises.push(sendPromise);
      let results = await Promise.all(promises);
      logger.debug(util.format('------->>> R E S P O N S E : %j', results));
      let response = results.pop(); //  orderer results are last in the results
      if (response.status === 'SUCCESS') {
        logger.info('Successfully sent transaction to the orderer.');
      } else {
        error_message = util.format('Failed to order the transaction. Error code: %s',response.status);
        logger.debug(error_message);
      }

      // now see what each of the event hubs reported
      for(let i in results) {
        let event_hub_result = results[i];
        let event_hub = event_hubs[i];
        logger.debug('Event results for event hub :%s',event_hub.getPeerAddr());
        if(typeof event_hub_result === 'string') {
          logger.debug(event_hub_result);
        } else {
          if(!error_message) error_message = event_hub_result.toString();
          logger.debug(event_hub_result.toString());
        }
      }
    } else {
      if (!error_message) {
        error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
      }
      logger.debug(error_message);
    }
  } catch (error) {
    logger.error('Failed to send instantiate due to error: ' + error.stack ? error.stack : error);
    error_message = error.toString();
  }

  if (!error_message) {
    let message = util.format(
      'Successfully instantiate chaingcode in organization %s to the channel \'%s\'',
      orgName, channelName);
    logger.info(message);
    // build a response to send back to the REST caller
    return [true, message];
  } else {
    let message = util.format('Failed to instantiate. cause: %s',error_message);
    logger.error(message);
    return [false, message]
  }
};

exports.installChaincode = installChaincode;
exports.instantiateUpgradeChaincode = instantiateUpgradeChaincode;
