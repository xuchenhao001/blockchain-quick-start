'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Query');
logger.level = 'DEBUG';

let fs = require('fs');
let helper = require('./helper');
let hfc = require('fabric-client');
let options = require('./config/certConfig');

hfc.setLogger(logger);

let queryChaincode = async function (request, orgName) {
  try {
    logger.debug("Load privateKey and signedCert");
    // first setup the client for this org
    let client = await helper.getClientForOrg(orgName);
    let channel = client.newChannel(options.channel_id);
    // add peers to channel
    let peers = options[orgName].peers;
    for (let j in peers) {
      if (peers.hasOwnProperty(j)) {
        let caData = fs.readFileSync(peers[j].tls_ca);
        let peer = client.newPeer(peers[j].peer_url, {
          pem: Buffer.from(caData).toString(),
          'ssl-target-name-override': peers[j].server_hostname
        });
        channel.addPeer(peer);
      }
    }

    logger.debug("Make query");
    let response_payloads = await channel.queryByChaincode(request);
    if (response_payloads) {
      let queryResult = response_payloads[0].toString();
      logger.info('Successfully queried the chaincode \'%s\' to the channel \'%s\', query result: %s',
        options.chaincode_id, options.channel_id, queryResult);
      return queryResult;
    } else {
      logger.error('response_payloads is null');
      return 'response_payloads is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};

exports.queryChaincode = queryChaincode;
