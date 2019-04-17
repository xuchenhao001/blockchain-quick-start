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

let installChaincode = async function (chaincodeContent, chaincodeName, chaincodePath, chaincodeType,
                                       chaincodeVersion, endorsementPolicy, collection, initRequired,
                                       orgName, peers, localPath) {
  logger.debug('\n\n============ Install chaincode on organizations ============\n');

  let chaincode = null;

  try {
    // =============
    // Step 1: Setup
    // =============

    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
    // get the chaincode instance associated with the client
    chaincode = client.newChaincode(chaincodeName, chaincodeVersion);
    // The endorsement policy
    chaincode.setEndorsementPolicyDefinition(endorsementPolicy);
    // The collection configuration - optional.
    if (collection) {
      chaincode.setCollectionConfigPackageDefinition(collection);
    }
    if (initRequired) {
      chaincode.setInitRequired(true);
    }
    // set the sequence (modification) number - default is 1
    chaincode.setSequence(1); // must increment for each definition change

    // ===============
    // Step 2: Package
    // language judge priority: localpath, chaincodeType, file extension in tar.gz
    // ===============

    // For local golang chaincode encapsulated in project image
    if (localPath) {
      let gopath = path.join('./', localPath);
      // package the source code
      let package_request = {
        chaincodeType: 'golang',
        goPath: gopath,
        chaincodePath: 'github.com/chaincode'
      };
      let cc_package = await chaincode.package(package_request);
      // use an existing package
      chaincode.setPackage(cc_package);
    }

    // check if the chaincode is valid
    else if (!helper.isBase64(chaincodeContent)) {
      return [false, 'Chaincode is not a valid base64 string!'];
    }

    // For golang type chaincode
    else if (chaincodeType === 'golang') {
      let gopath = path.join('./', uuid.v4());
      let chaincodeBuffer = new Buffer(chaincodeContent, 'base64');

      // check if the chaincode is tar.gz package
      if (helper.isGzip(chaincodeBuffer)) {
        logger.info('Got chaincode tar.gz package, decompress it');
        let tarballName = uuid.v4();
        await helper.writeFile(tarballName, chaincodeBuffer);
        await helper.decompressTarGz(tarballName, gopath);
        await helper.removeFile(tarballName);
      } else {
        logger.info('Got chaincode single file buffer');
        await helper.writeFile(path.join(gopath, 'src', chaincodePath, 'chaincode.go'), chaincodeBuffer);
      }
      // package the source code
      let package_request = {
        chaincodeType: 'golang',
        goPath: gopath,
        chaincodePath: chaincodePath
      };
      let cc_package = await chaincode.package(package_request);
      // use an existing package
      chaincode.setPackage(cc_package);
      // remove useless chaincode directory
      if (!localPath) {
        await helper.removeFile(gopath);
      }
    }

    // For unknown type chaincode in tar.gz
    // Now support nodejs
    else {
      let tmpDir = path.join('./_', uuid.v4());
      let chaincodeBuffer = new Buffer(chaincodeContent, 'base64');
      // check if the chaincode is tar.gz package
      if (helper.isGzip(chaincodeBuffer)) {
        logger.info('Got chaincode tar.gz package, decompress it');
        let tarballName = path.join('./_', uuid.v4());
        await helper.writeFile(tarballName, chaincodeBuffer);
        await helper.decompressTarGz(tarballName, tmpDir);
        await helper.removeFile(tarballName);

        // while in tar.gz format, judge chaincode language, default is golang
        logger.debug("Judge chaincode language type in dir: " + tmpDir);
        // node js chaincode type support
        let isNodeChaincodeFlag = await helper.isNodeChaincode(tmpDir);
        if (isNodeChaincodeFlag[0]) {
          let chaincodeNodePath = isNodeChaincodeFlag[1];
          logger.debug("Got node js chaincode type! chaincode path: " + chaincodeNodePath);
          // node js chaincode install request compose
          let package_request = {
            chaincodeType: 'node',
            chaincodePath: chaincodeNodePath
          };
          let cc_package = await chaincode.package(package_request);
          // use an existing package
          chaincode.setPackage(cc_package);
        }
      } else {
        return [false, 'Got chaincode single file with unknown chaincode language type'];
      }
    }

    // ===============
    // Step 3: Install
    // ===============
    for (let peerName of peers) {
      let peer = client.getPeer(peerName);
      let install_request = {
        target: peer,
        request_timeout: 20000 // give the peers some extra time
      };
      let package_id = await chaincode.install(install_request);
      logger.info('chaincode has been successfully installed on peers: ' + peerName
        + ' with chaincode package id: ' + package_id);
    }
  } catch (e) {
    let err_msg = 'Install chaincode failed: ' + e;
    logger.error(err_msg);
    return [false, err_msg]
  }

  // dump chaincode key features to base64 string
  let chaincodeToDump = {
    name: chaincode.getName(),
    version: chaincode.getVersion(),
    sequence: chaincode.getSequence().toNumber()
  };
  let chaincodeString = JSON.stringify(chaincodeToDump);
  logger.debug("Succesfully installed chaincode: " + chaincodeString);
  return [true, chaincodeToDump];
};

let approveChaincode = async function (chaincodeName, chaincodeVersion, chaincodeSequence, channelName, orderers,
                                       orgName, peers) {
  logger.debug('\n\n============ Approve chaincode on organizations ============\n');

  // first setup the client for this org
  let client = await helper.getClientForOrg(orgName);
  logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

  try {
    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    // construct a new chaincode object for approve
    let chaincode = client.newChaincode(chaincodeName, chaincodeVersion);
    chaincode.setSequence(chaincodeSequence);

    // =====================================
    // Step 4: Approve for your organization
    // =====================================

    // send a approve chaincode for organization transaction
    let tx_id = client.newTransactionID(true);
    let request = {
      // @2.0.0-snapshot.221 targets for now are required
      targets: peers,
      chaincode: chaincode, // The chaincode instance fully populated
      txId: tx_id
    };
    // send to the peer to be endorsed
    let approveResponse = await channel.approveChaincodeForOrg(request);

    // send to the orderer to be committed
    tx_id = client.newTransactionID(true);
    let orderer_request = {
      proposalResponses: approveResponse.proposalResponses,
      proposal: approveResponse.proposal,
      txId: tx_id
    };
    let results = await channel.sendTransaction(orderer_request);
    logger.info('Approve chaincode result: ' + JSON.stringify(results));
    return [true];
  } catch (e) {
    let err_msg = 'Approve chaincode failed: ' + e;
    logger.error(err_msg);
    return [false, err_msg];
  }
};

let commitChaincode = async function (chaincodeName, chaincodeVersion, chaincodeSequence, channelName, orderers,
                                      orgName, peers) {
  logger.debug('\n\n============ Approve chaincode on organizations ============\n');

  // first setup the client for this org
  let client = await helper.getClientForOrg(orgName);
  logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

  try {
    let channel = client.newChannel(channelName);
    // assign orderer to channel
    orderers.forEach(function (ordererName) {
      channel.addOrderer(client.getOrderer(ordererName));
    });
    // assign peers to channel
    peers.forEach(function (peerName) {
      channel.addPeer(client.getPeer(peerName));
    });

    // construct a new chaincode object for approve
    let chaincode = client.newChaincode(chaincodeName, chaincodeVersion);
    chaincode.setSequence(chaincodeSequence);

    // ========================================
    // Step 5: Commit definition to the channel
    // ========================================

    // send a commit chaincode for channel transaction
    let tx_id = client.newTransactionID(true);
    let request = {
      // @2.0.0-snapshot.221 targets for now are required
      targets: peers,
      chaincode: chaincode,
      txId: tx_id
    };
    // send to the peers to be endorsed
    let commitChaincodeResponse = await channel.commitChaincode(request);
    // send to the orderer to be committed
    tx_id = client.newTransactionID(true);
    let orderer_request = {
      proposalResponses: commitChaincodeResponse.proposalResponses,
      proposal: commitChaincodeResponse.proposal,
      txId: tx_id
    };
    let results = await channel.sendTransaction(orderer_request);
    logger.info('Commit definition result: ' + JSON.stringify(results));
    return [true];
  } catch (e) {
    let err_msg = 'Commit chaincode failed: ' + e;
    logger.error(err_msg);
    return [false, err_msg]
  }
};

let instantiateUpgradeChaincode = async function (chaincodeName, chaincodeType, chaincodeVersion, channelName,
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
      if (typeof endorsementPolicy === 'object') {
        request['endorsement-policy'] = endorsementPolicy;
      } else {
        request['endorsement-policy'] = await helper.decodeEndorsementPolicy(endorsementPolicy);
      }
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
      logger.debug('found %s eventhubs for this organization %s', event_hubs.length, orgName);
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
              logger.info('The chaincode instantiate transaction has been committed on peer %s', eh.getPeerAddr());
              logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
              clearTimeout(event_timeout);

              if (code !== 'VALID') {
                let message = util.format('The chaincode instantiate transaction was invalid, code:%s', code);
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
        error_message = util.format('Failed to order the transaction. Error code: %s', response.status);
        logger.debug(error_message);
      }

      // now see what each of the event hubs reported
      for (let i in results) {
        let event_hub_result = results[i];
        let event_hub = event_hubs[i];
        logger.debug('Event results for event hub :%s', event_hub.getPeerAddr());
        if (typeof event_hub_result === 'string') {
          logger.debug(event_hub_result);
        } else {
          if (!error_message) error_message = event_hub_result.toString();
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
    let message = util.format('Failed to instantiate. cause: %s', error_message);
    logger.error(message);
    return [false, message]
  }
};

exports.installChaincode = installChaincode;
exports.approveChaincode = approveChaincode;
exports.commitChaincode = commitChaincode;
exports.instantiateUpgradeChaincode = instantiateUpgradeChaincode;
