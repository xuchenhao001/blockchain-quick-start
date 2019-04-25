'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('INVOKE');
logger.level = 'DEBUG';

let helper = require('./helper');
let util = require('util');

let instantiateChaincode = async function (chaincodeName, channelName, args, orderers, orgName, peers) {
  logger.debug('\n\n============ Instantiate chaincode from org \'' + orgName + '\' ============\n');
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

    // send transaction to all of the peers
    let tx_id = client.newTransactionID(true);
    let request = {
      chaincodeId : chaincodeName,
      fcn: 'Init',
      args: args,
      txId: tx_id,
      is_init: true
    };
    let init_results = await channel.sendTransactionProposal(request, 600000);
    let proposalResponses = init_results[0];
    let all_good = true;
    for (let i in proposalResponses) {
      let one_good = false;
      if (proposalResponses && proposalResponses[i].response &&
        proposalResponses[i].response.status === 200) {
        one_good = true;
        logger.info('invoke success');
      } else {
        let err_detail = 'invoke failed: ' + proposalResponses[i];
        logger.error(err_detail);
        error_message = error_message + err_detail;
      }
      all_good = all_good && one_good;
    }

    if (all_good) {
      logger.info('Successfully sent Proposal and received ProposalResponse: ' +
        JSON.stringify(proposalResponses[0].response));

      // send transaction to orderer
      let orderer_request = {
        proposalResponses: init_results[0],
        proposal: init_results[1],
        txId: tx_id
      };
      let results = await channel.sendTransaction(orderer_request);
      if (results.status === 'SUCCESS') {
        return [true];
      } else {
        return [false, results.info];
      }
    } else {
      if (!error_message) {
        error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
      }
      logger.error(error_message);
      return [false, error_message];
    }
  } catch (e) {
    let err_msg = 'Instantiate chaincode failed: ' + e;
    logger.error(err_msg);
    return [false, err_msg];
  }
};

let invokeChaincode = async function (chaincodeName, channelName, functionName, args,
                                      orderers, orgName, peers, transient, useDiscoverService) {
  logger.debug('\n\n============ Invoke chaincode from org \'' + orgName + '\' ============\n');
  let error_message = '';
  let tx_id_string = null;
  let response_payload = null;

  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
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
    if (useDiscoverService) {
      logger.debug("Got useDiscoverService, do request with service discovery");
      let asLocalhost = await helper.asLocalhost();
      await channel.initialize({discover: true, asLocalhost: asLocalhost});
    }

    // get an admin based transactionID.
    // This should be set to false, but if that, you must call function:
    // client.setUserContext({username:'admin', password:'adminpw'}, false);
    // to setup a new User object. And since that, you have to enable your CA
    // with you all the time.
    // For convenience, I just do all of these transactions with admin user.
    let tx_id = client.newTransactionID(true);
    tx_id_string = tx_id.getTransactionID();
    let request = {
      args: args,
      chaincodeId: chaincodeName,
      chainId: channelName,
      fcn: functionName,
      txId: tx_id,
      transientMap: transient
    };
    let results = await channel.sendTransactionProposal(request, 600000);

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
        logger.info('invoke success');
      } else {
        let err_detail = 'invoke failed: ' + proposalResponses[i];
        logger.error(err_detail);
        error_message = error_message + err_detail;
      }
      all_good = all_good && one_good;
    }

    if (all_good) {
      logger.info('Successfully sent Proposal and received ProposalResponse: ' +
        JSON.stringify(proposalResponses[0].response));
      response_payload = helper.bufferToString(proposalResponses[0].response.payload, 'utf-8');

      let orderer_request = {
        txId: tx_id,
        proposalResponses: proposalResponses,
        proposal: proposal
      };
      let result = await helper.sendTransactionWithEventHub(channel, tx_id_string, orderer_request);
      if (result[0] && result[1].status === 'SUCCESS') {
        logger.info('Successfully sent transaction to the orderer.');
      } else {
        error_message = util.format('Failed to order the transaction. Error code: %s', result.status);
        logger.error(error_message);
      }
    } else {
      if (!error_message) {
        error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
      }
      logger.error(error_message);
    }
  } catch (error) {
    error_message = util.format('Failed to invoke due to error: ' + error.stack ? error.stack : error);
    logger.error(error_message);
  }

  if (!error_message) {
    logger.info('Successfully invoked the chaincode \'%s\' to the channel \'%s\' for transaction ID: %s',
      chaincodeName, channelName, tx_id_string);
    return ['yes', tx_id_string, response_payload];
  } else {
    let message = util.format('Failed to invoke chaincode. cause: %s', error_message);
    logger.error(message);
    return ['no', message];
  }
};

let queryChaincode = async function (chaincodeName, channelName, functionName, args,
                                     orderers, orgName, peers, transient, useDiscoverService) {
  logger.debug('\n\n============ Query chaincode from org \'' + orgName + '\' ============\n');
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
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

    /*
    * I don't think it's a good idea to bind service discovery function with the query function,
    * because it will return all peer's query result whoever you are. It's not good for demo of
    * private data. (Query from org2 should return an error in that scenario)
    * But these codes indeed works.
    * */

    if (useDiscoverService) {
      logger.debug("Got useDiscoverService, do request with service discovery");
      let asLocalhost = await helper.asLocalhost();
      await channel.initialize({discover: true, asLocalhost: asLocalhost});
    }

    // get an admin based transactionID.
    // This should be set to false, but if that, you must call function:
    // client.setUserContext({username:'admin', password:'adminpw'}, false);
    // to setup a new User object. And since that, you have to enable your CA
    // with you all the time.
    // For convenience, I just do all of these transactions with admin user.
    let tx_id = client.newTransactionID(true);
    let request = {
      chaincodeId: chaincodeName,
      fcn: functionName,
      args: args,
      transientMap: transient,
      txId: tx_id,
      request_timeout: 600000
    };
    logger.debug("Make query");
    let response_payloads = await channel.queryByChaincode(request);
    if (response_payloads) {
      let queryResult = [];
      queryResult[0] = true;
      queryResult[1] = [];
      for (let i in response_payloads) {
        if (response_payloads.hasOwnProperty(i)) {
          queryResult[1].push(response_payloads[i].toString());
          logger.info('Query result from peer [%s]: %s', i, response_payloads[i].toString());
        }
      }
      return queryResult;
    } else {
      logger.error('response_payloads is null');
      return [false, 'response_payloads is null'];
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return [false, error.toString()];
  }
};

exports.instantiateChaincode = instantiateChaincode;
exports.invokeChaincode = invokeChaincode;
exports.queryChaincode = queryChaincode;
