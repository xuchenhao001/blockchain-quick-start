'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Helper');
logger.level = 'DEBUG';

let fs = require('fs-extra');
let hfc = require('fabric-client');
let util = require('util');
let execSync = require('child_process').execSync;
let yaml = require('js-yaml');


let getClientForOrg = async function(org){
  logger.debug('getClientForOrg %s', org);

  // build a client context and load it with a connection profile
  // lets only load the network settings and save the client for later
  let client = hfc.loadFromConfig('config/network-config.yaml');

  // This will load a connection profile over the top of the current one one
  // since the first one did not have a client section and the following one does
  // nothing will actually be replaced.
  // This will also set an admin identity because the organization defined in the
  // client section has one defined

  client.loadFromConfig('config/' + org + '.yaml');

  // this will create both the state store and the crypto store based
  // on the settings in the client section of the connection profile
  await client.initCredentialStores();

  // The getUserContext call tries to get the user from persistence.
  // If the user has been saved to persistence then that means the user has
  // been registered and enrolled. If the user is found in persistence
  // the call will then assign the user to the client object.
  // if(username) {
  //   let user = await client.getUserContext(username, true);
  //   if(!user) {
  //     throw new Error(util.format('User was not found :', username));
  //   } else {
  //     logger.debug('User %s was found to be registered and enrolled', username);
  //   }
  // }
  // logger.debug('getClientForOrg - ****** END %s %s \n\n', userorg, username);
  let user = await client.getUserContext('admin', true);
  if (!user) {
    await client.setUserContext({username:'admin', password:'adminpw'});
  }

  return client;
};


// generate channel.tx file with channel name and org names included in this channel
let generateChannelTx = async function(channelName, orgNames) {
  // prepare a tmp directory for place files
  let tmpDir = './tmp';
  if (fs.existsSync(tmpDir)) {
    fs.removeSync(tmpDir);
  }
  fs.mkdirSync(tmpDir);
  logger.debug('Successfully prepared temp directory for channel config files');

  // generate channel config yaml
  let orgObjs = [];
  let fileData = fs.readFileSync('config/network-config-ext.yaml');
  let networkData = yaml.safeLoad(fileData);
  if (networkData) {
    orgNames.forEach(function (orgName) {
      let orgData = networkData.organizations[orgName];
      if (!orgData) {
        let error_message = util.format('Failed to load Org %s from connection profile', orgName);
        logger.error(error_message);
        return [false, error_message];
      }
      // compose org object
      let orgObj = {
        "Name": orgData.mspid,
        "ID": orgData.mspid,
        "MSPDir": orgData.mspDir.path,
        "AnchorPeers": [
          {
            "Host": networkData.peers[orgData.peers[0]]['url-addr-container'],
            "Port": networkData.peers[orgData.peers[0]]['url-port-container']
          }
        ]
      };
      logger.debug(util.format('Successfully load Org %s from connection profile: %s',
        orgName, JSON.stringify(orgObj)));
      orgObjs.push(orgObj);
    });
  } else {
    let error_message = 'Missing configuration data';
    logger.error(error_message);
    return [false, error_message];
  }
  // compose configtx object
  let configtxObj = {
    "Profiles": {
      "GeneratedChannel": {
        "Consortium": "SampleConsortium",
        "Application": {
          "Organizations":orgObjs,
          "Capabilities": {"V1_2": true}
        }
      }
    }
  };
  let configData = yaml.safeDump(configtxObj);
  fs.writeFileSync(tmpDir+'/configtx.yaml', configData);
  logger.debug('Successfully written configtx.yaml file');

  // generate channel.tx file and return
  let configtxgenExec = 'configtxgen';
  let cmdStr = configtxgenExec + ' -profile GeneratedChannel'
    + ' -configPath ' + tmpDir
    + ' -channelID ' + channelName
    + ' -outputCreateChannelTx ' + tmpDir + '/channel.tx';
  logger.debug('Generate channel.tx file by command: ' + cmdStr);
  execSync(cmdStr, {stdio: []});
  logger.debug('Success generate channel.tx file');
  let txFile = fs.readFileSync(tmpDir+'/channel.tx');
  fs.removeSync(tmpDir);
  return [true, txFile];
};


exports.getClientForOrg = getClientForOrg;
exports.generateChannelTx = generateChannelTx;

