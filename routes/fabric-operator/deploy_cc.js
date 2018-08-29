'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Chaincode');
logger.level = 'DEBUG';

let fs = require('fs');
let helper = require('./helper');
let hfc = require('fabric-client');
let options = require('./config/config');
let path = require('path');
let util = require('util');

hfc.setLogger(logger);

let installChaincode = async function (orgNames, chaincodeName, chaincodePath,
                                       chaincodeVersion, chaincodeType) {
  logger.debug('\n\n============ Install chaincode on organizations ============\n');
  let error_message = null;
  try {
    logger.info('Calling peers in organization "%s" to join the channel', orgNames);
    process.env.GOPATH = path.join(__dirname, '../../sample-network/chaincode');

    // install chaincode for each org
    for (let i in orgNames) {
      if (orgNames.hasOwnProperty(i)) {
        let targets = [];
        // first setup the client for this org
        let client = await helper.getClientForOrg(orgNames[i]);
        logger.debug('Successfully got the fabric client for the organization "%s"', orgNames[0]);
        let peers = options[orgNames[i]].peers;

        // load all of the peers of this org
        for (let j in peers) {
          if (peers.hasOwnProperty(j)) {
            let caData = fs.readFileSync(peers[j].tls_ca);
            let peer = client.newPeer(peers[j].peer_url, {
              pem: Buffer.from(caData).toString(),
              'ssl-target-name-override': peers[j].server_hostname
            });
            targets.push(peer);
          }
        }

        let request = {
          targets: targets,
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
          error_message = 'Failed to send install Proposal or receive valid response. Response null or status is not 200';
          logger.error(error_message);
        }
      }
    }
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

exports.installChaincode = installChaincode;
