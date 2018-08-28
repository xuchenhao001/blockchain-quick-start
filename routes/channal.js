'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('CreateChannel');
logger.level = 'DEBUG';

let fs = require('fs');
let hfc = require('fabric-client');
let options = require('./config/certConfig');
let path = require('path');
let util = require('util');

hfc.setLogger(logger);

function getKeyFilesInDir(dir) {
  let files = fs.readdirSync(dir);
  let keyFiles = [];
  files.forEach(function (file_name) {
    let filePath = path.join(dir, file_name);
    if (file_name.endsWith('_sk')) {
      keyFiles.push(filePath);
    }
  });
  return keyFiles;
}

//Attempt to send a request to the orderer with the sendTransaction method
let createChannel = async function(channelName) {
  logger.debug('\n====== Creating Channel \'' + channelName + '\' ======\n');
  try {
    // first setup the client for this org1
    let client = new hfc();
    let createUserOpt = {
      username: options.org1_user_id,
      mspid: options.org1_msp_id,
      cryptoContent: {
        privateKey: getKeyFilesInDir(options.org1_privateKeyFolder)[0],
        signedCert: options.org1_signedCert
      },
      skipPersistence: false
    };
    let store = await hfc.newDefaultKeyValueStore({
      path: "/tmp/fabric-client-stateStore/"
    });
    await client.setStateStore(store);
    await client.createUser(createUserOpt);
    logger.debug('Successfully got the fabric client for the organization "%s"', options.org1_msp_id);

    // read in the envelope for the channel config raw bytes
    let envelope = fs.readFileSync(path.join(__dirname, "/../sample-network/channel-artifacts/channel.tx"));
    // extract the channel config bytes from the envelope to be signed
    let channelConfig = client.extractChannelConfig(envelope);

    // Acting as a client in the given organization provided with "orgName" param
    // sign the channel config bytes as "endorsement", this is required by
    // the orderer's channel creation policy
    // this will use the admin identity assigned to the client when the connection profile was loaded
    let signature = client.signChannelConfig(channelConfig);

    let odata = fs.readFileSync(options.orderer_tls_cacerts);
    let caroots = Buffer.from(odata).toString();
    let orderer = client.newOrderer(options.orderer_url, {
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
      let errMessage = util.format('Failed to create the channel %s', channelName);
      logger.error(errMessage);
      return [false, errMessage];
    }
  } catch (err) {
    let errMessage = util.format('Failed to initialize the channel: ' + err.stack ? err.stack :	err);
    logger.error(errMessage);
    return [false, errMessage];
  }
};

exports.createChannel = createChannel;
