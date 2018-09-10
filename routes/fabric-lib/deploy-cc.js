'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Chaincode');
logger.level = 'DEBUG';

let fs = require('fs-extra');
let helper = require('./helper');
let hfc = require('fabric-client');
let util = require('util');

hfc.setLogger(logger);


let isBase64 = function(string){
  let reg = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
  return reg.test(string);
};

let installChaincode = async function (chaincode, chaincodeName, chaincodeType,
                                       chaincodeVersion, orgName, peers) {
  logger.debug('\n\n============ Install chaincode on organizations ============\n');
  let error_message = null;
  process.env.GOPATH = '/tmp/chaincode-cache';

  // check if this kind of chaincode supported
  if (!chaincodeType === 'golang') {
    return [false, 'Does not support this kind of chaincode!'];
  }

  // check if the chaincode is valid
  if (!isBase64(chaincode)) {
    return [false, 'Chaincode is not a valid base64 string!'];
  }

  try {
    // write chaincode to a file
    let tmpDir = process.env.GOPATH + '/src/github.com/cc';
    let chaincodeBuffer = new Buffer(chaincode, 'base64');
    fs.mkdirpSync(tmpDir);
    fs.writeFileSync(tmpDir + '/chaincode.go', chaincodeBuffer.toString());
    let chaincodePath = 'github.com/cc';

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

    // remove chaincode tmp file
    let tmpFile = tmpDir + '/chaincode.go';
    fs.removeSync(tmpFile);
  }
  catch (error) {
    logger.error('Failed to install due to error: ' + error.stack ? error.stack : error);
    error_message = error.toString();
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


let instantiateChaincode = async function(chaincodeName, chaincodeType, chaincodeVersion,
                                          channelName, functionName, args, ordererName, orgName, peers) {
  logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
    ' ============\n');
  let error_message = null;

  try {
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

    let channel = client.newChannel(channelName);
    // assign orderer to channel
    channel.addOrderer(client.getOrderer(ordererName));
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    let tx_id = client.newTransactionID(true); // Get an admin based transactionID
    // An admin based transactionID will
    // indicate that admin identity should
    // be used to sign the proposal request.
    // will need the transaction ID string for the event registration later
    let deployId = tx_id.getTransactionID();

    // send proposal to endorser
    let request = {
      targets: peers,
      chaincodeId: chaincodeName,
      chaincodeType: chaincodeType,
      chaincodeVersion: chaincodeVersion,
      args: args,
      txId: tx_id
    };

    if (functionName)
      request.fcn = functionName;

    let results = await channel.sendInstantiateProposal(request, 600000); //instantiate takes much longer

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
        logger.info('instantiate proposal was good');
      } else {
        logger.error('instantiate proposal was bad');
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
      error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
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
    let message = util.format('Failed to instantiate. cause:%s',error_message);
    logger.error(message);
    return [false, message]
  }
};

exports.installChaincode = installChaincode;
exports.instantiateChaincode = instantiateChaincode;