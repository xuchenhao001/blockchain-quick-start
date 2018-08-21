'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Invoke');
logger.level = 'DEBUG';

let options = require('./config/certConfig');
let util = require('util');
let hfc = require('fabric-client');
let path = require('path');
let fs = require('fs');

hfc.setLogger(logger);

function getKeyFilesInDir(dir) {
  let files = fs.readdirSync(dir);
  let keyFiles = [];
  files.forEach(function (file_name) {
    let filePath = path.join(dir, file_name);
    if (file_name.endsWith('_sk')) {
      keyFiles.push(filePath)
    }
  });
  return keyFiles
}

let invokeChaincode = async function (request) {
  let channel = {};
  let client = null;
  let targets = [];
  let error_message = null;
  let tx_id_string = null;

  try {
    let fcn_request = request;
    console.log("Load privateKey and signedCert");
    // org1
    client = new hfc();
    let createUserOpt = {
      username: options.org1_user_id,
      mspid: options.org1_msp_id,
      cryptoContent: {
        privateKey: getKeyFilesInDir(options.org1_privateKeyFolder)[0],
        signedCert: options.org1_signedCert
      }
    };
    let store = await hfc.newDefaultKeyValueStore({
      path: "/tmp/fabric-client-stateStore/"
    });
    await client.setStateStore(store);
    await client.createUser(createUserOpt);
    channel = client.newChannel(options.channel_id);
    // add org1 peer0
    let data1 = fs.readFileSync(options.org1_peer_tls_cacerts);
    let peer1 = client.newPeer(options.org1_peer_url,
      {
        pem: Buffer.from(data1).toString(),
        'ssl-target-name-override': options.org1_server_hostname
      });
    channel.addPeer(peer1);
    targets.push(peer1);
    // add org2 peer0
    let data2 = fs.readFileSync(options.org2_peer_tls_cacerts);
    let peer2 = client.newPeer(options.org2_peer_url,
      {
        pem: Buffer.from(data2).toString(),
        'ssl-target-name-override': options.org2_server_hostname
      });
    channel.addPeer(peer2);
    targets.push(peer2);

    let odata = fs.readFileSync(options.orderer_tls_cacerts);
    let caroots = Buffer.from(odata).toString();
    let orderer = client.newOrderer(options.orderer_url, {
      'pem': caroots,
      'ssl-target-name-override': "orderer.example.com"
    });
    channel.addOrderer(orderer);

    let tx_id = client.newTransactionID();
    tx_id_string = tx_id.getTransactionID();
    fcn_request.txId = tx_id;
    fcn_request.targets = targets;
    let results = await channel.sendTransactionProposal(fcn_request);

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
        logger.info('invoke chaincode proposal was good');
      } else {
        error_message = 'invoke chaincode proposal was bad';
        logger.error(error_message);
      }
      all_good = all_good && one_good;
    }

    if (all_good) {
      logger.info(
        'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
        proposalResponses[0].response.status, proposalResponses[0].response.message,
        proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);

      // wait for the channel-based event hub to tell us
      // that the commit was good or bad on each peer in our organization
      let promises = [];
      let event_hubs = channel.getChannelEventHubsForOrg();
      event_hubs.forEach((eh) => {
        logger.debug('invokeEventPromise - setting up event');
        let invokeEventPromise = new Promise((resolve, reject) => {
          let event_timeout = setTimeout(() => {
            let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
            logger.error(message);
            eh.disconnect();
          }, 3000);
          eh.registerTxEvent(tx_id_string, (tx, code, block_num) => {
              logger.info('The chaincode invoke chaincode transaction has been committed on peer %s', eh.getPeerAddr());
              logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
              clearTimeout(event_timeout);

              if (code !== 'VALID') {
                error_message = util.format('The invoke chaincode transaction was invalid, code:%s', code);
                logger.error(error_message);
                reject(new Error(message));
              } else {
                let message = 'The invoke chaincode transaction was valid.';
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
        promises.push(invokeEventPromise);
      });

      let orderer_request = {
        txId: tx_id,
        proposalResponses: proposalResponses,
        proposal: proposal
      };
      let sendPromise = channel.sendTransaction(orderer_request);
      // put the send to the orderer last so that the events get registered and
      // are ready for the orderering and committing
      promises.push(sendPromise);
      let results = await Promise.all(promises);
      logger.debug('------->>> R E S P O N S E : %j', results);
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
      logger.debug('Failed to send Proposal and receive all good ProposalResponse');
    }
  } catch (error) {
    error_message = util.format('Failed to invoke due to error: ' + error.stack ? error.stack : error);
    logger.error(error_message);
  }

  if (!error_message) {
    logger.info('Successfully invoked the chaincode \'%s\' to the channel \'%s\' for transaction ID: %s',
      options.chaincode_id, options.channel_id, tx_id_string);
    return ['yes', tx_id_string];
  } else {
    let message = util.format('Failed to invoke chaincode. cause:%s', error_message);
    logger.error(message);
    return ['no', message];
  }
};

exports.invokeChaincode = invokeChaincode;
