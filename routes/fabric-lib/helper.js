'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('Helper');
logger.level = 'DEBUG';

const fs = require('fs-extra');
const hfc = require('fabric-client');
const util = require('util');
const execSync = require('child_process').execSync;
const yaml = require('js-yaml');
const uuid = require('uuid');
const tar = require('tar-stream');
const zlib = require('zlib');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
const clonedeep = require('lodash/cloneDeep');

let client;

const extConfigPath = 'config/network-config-ext.yaml';

let isBase64 = function(string){
  let reg = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
  return reg.test(string);
};

let isGzip = function (buf) {
  if (!buf || buf.length < 3) {
    return false;
  }

  return buf[0] === 0x1F && buf[1] === 0x8B && buf[2] === 0x08;
};

let generateTarGz = async function (chaincodeBuffer, chaincodeTarGzBuffer) {
  logger.debug("Generate chaincode tar.gz package");

  return new Promise((resolve, reject) => {
    let pack = tar.pack();

    pack.pipe(zlib.createGzip()).pipe(chaincodeTarGzBuffer).on('finish', () => {
      resolve(true);
    }).on('error', (err) => {
      reject(err);
    });

    let task = pack.entry({ name: 'src/github.com/chaincode/chaincode.go' }, chaincodeBuffer);

    Promise.all([task]).then(() => {
      pack.finalize();
    }).catch((err) => {
      reject(err);
    });
  });
};

let decompressTarGz = async function (fileName, targetDir) {
  return new Promise(function(resolve, reject){
    decompress(fileName, targetDir, {
      plugins: [
        decompressTargz()
      ]
    }).then(() => {
      logger.debug('Successfully decompressed tgz package');
      resolve();
    });
  });
};

let writeFile = async function (fileName, fileBuffer) {
  fs.outputFileSync(fileName, fileBuffer);
};

let removeFile = async function(fileName) {
  fs.removeSync(fileName)
};

let initClient = async function() {
  logger.debug('Init client with network config... ');

  client = hfc.loadFromConfig('config/network-config.yaml');
};

// get client for org, just consist with admin User identity
let getClientForOrg = async function(orgName){
  logger.debug('get admin client for org %s', orgName);

  // prepare a tmp directory for place files
  let tmpDir = './' + uuid.v4();
  if (fs.existsSync(tmpDir)) {
    fs.removeSync(tmpDir);
  }
  fs.mkdirSync(tmpDir);
  logger.debug('Successfully prepared temp directory: ' + tmpDir);

  let clientFile = tmpDir + '/client.yaml';

  // construct a new client configuration
  let orgClient = {
    version: "1.0",
    client: {
      organization: orgName
    }
  };
  logger.debug("Constructed new organization's client: " + JSON.stringify(orgClient));
  let orgClientYaml = yaml.safeDump(orgClient);

  // write down the new client configuration
  fs.writeFileSync(clientFile, orgClientYaml);

  // load it
  client.loadFromConfig(clientFile);

  // clean useless cache file
  fs.removeSync(tmpDir);

  // return a deep clone of client;
  return clonedeep(client);
};

// get client for org. This is a standard usage for client. Normally call
// setUserContext() to sign a normal user identity and then do invoke/query calling.
let getClientForOrg_normUsage = async function(org){
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
    await client.setUserContext({username:'admin', password:'adminpw'}, false);
  }

  return client;
};

// generate channel.tx file with channel name and org names included in this channel
let generateChannelTx = async function(channelName, orgNames) {

  let tmpDir = await genConfigtxYaml(orgNames);

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

// generate anchor peer update tx file
let generateUpdateAnchorTx = async function(channelName, orgNames, orgMSPId) {

  let tmpDir = await genConfigtxYaml(orgNames);

  // generate channel.tx file and return
  let configtxgenExec = 'configtxgen';
  let cmdStr = configtxgenExec + ' -profile GeneratedChannel'
    + ' -configPath ' + tmpDir
    + ' -channelID ' + channelName
    + ' -outputAnchorPeersUpdate ' + tmpDir + '/anchorPeer.tx'
    + ' -asOrg ' + orgMSPId;

  logger.debug('Generate anchorPeer.tx file by command: ' + cmdStr);
  execSync(cmdStr, {stdio: []});
  logger.debug('Successfully generate anchorPeer.tx file');

  let txFile = fs.readFileSync(tmpDir+'/anchorPeer.tx');
  fs.removeSync(tmpDir);

  return [true, txFile];
};

let loadExtConfig = async function() {
  let fileData = fs.readFileSync(extConfigPath);
  return yaml.safeLoad(fileData);
};

// Generate configtx yaml file, and return the file path
let genConfigtxYaml = async function(orgNames) {
  // prepare a tmp directory for place files
  let tmpDir = './' + uuid.v4();
  if (fs.existsSync(tmpDir)) {
    fs.removeSync(tmpDir);
  }
  fs.mkdirSync(tmpDir);
  logger.debug('Successfully prepared temp directory: ' + tmpDir);

  // compose configtx object
  let configtxObj = await genConfigtxObj(orgNames);
  logger.debug('Generated configtx Obj: ' + JSON.stringify(configtxObj));

  let configData = yaml.dump(configtxObj);
  logger.debug('Generated configtx yaml file: ' + configData);
  fs.writeFileSync(tmpDir+'/configtx.yaml', configData);
  logger.debug('Successfully written configtx.yaml file');
  return tmpDir;
};

let genConfigtxObj = async function(orgNames) {
  // generate channel config yaml
  let orgObjs = [];
  let networkData = await loadExtConfig();
  if (networkData) {
    orgNames.forEach(function (orgName) {
      let orgData = networkData.organizations[orgName];
      if (!orgData) {
        let error_message = util.format('Failed to load Org %s from connection profile', orgName);
        logger.error(error_message);
        return [false, error_message];
      }
      // compose anchor peers
      let anchorPeers = [];
      if (orgData.peers > 1) {
        orgData.peers.forEach(function (peer) {
          let anchorPeer = {
            "Host": networkData.peers[peer]['url-addr-container'],
            "Port": networkData.peers[peer]['url-port-container']
          };
          anchorPeers.push(anchorPeer);
        });
      } else {
        anchorPeers.push({
          "Host": networkData.peers[orgData.peers[0]]['url-addr-container'],
          "Port": networkData.peers[orgData.peers[0]]['url-port-container']
        })
      }

      // compose org object
      let orgObj = generateOrgObj(networkData, orgData);
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
  return {
    "Profiles": {
      "GeneratedChannel": {
        "Consortium": "SampleConsortium",
        "Application": {
          "Organizations": orgObjs,
          "Capabilities": {"V1_3": true}
        }
      }
    }
  };
};

let generateOrgObj = function(networkData, orgData) {
  // compose anchor peers
  let anchorPeers = [];
  if (orgData.peers > 1) {
    orgData.peers.forEach(function (peer) {
      let anchorPeer = {
        "Host": networkData.peers[peer]['url-addr-container'],
        "Port": networkData.peers[peer]['url-port-container']
      };
      anchorPeers.push(anchorPeer);
    });
  } else {
    anchorPeers.push({
      "Host": networkData.peers[orgData.peers[0]]['url-addr-container'],
      "Port": networkData.peers[orgData.peers[0]]['url-port-container']
    })
  }

  // compose org object
  let orgObj = {
    "Name": orgData.name,
    "ID": orgData.mspid,
    "MSPDir": orgData.mspDir.path,
    "AnchorPeers": anchorPeers
  };
  return orgObj;
};

let loadGenesisOrgName = async function(orgName) {
  let networkData = await loadExtConfig();
  if (networkData) {
    let orgData = networkData.organizations[orgName];
    if (!orgData) {
      let error_message = util.format('Failed to load Org %s from connection profile', orgName);
      logger.error(error_message);
      return [false, error_message];
    }
    return [true, orgData.name]
  }
};

// load org's mspid from network-ext-config file
let loadOrgMSP = async function(orgName) {
  let networkData = await loadExtConfig();
  if (networkData) {
    let orgData = networkData.organizations[orgName];
    return orgData.mspid;
  }
  return null;
};

// generate new org's config json file for updating channel
let generateNewOrgJSON = async function(channelName, orgName) {
  // prepare a tmp directory for place files
  let tmpDir = './' + uuid.v4();
  if (fs.existsSync(tmpDir)) {
    fs.removeSync(tmpDir);
  }
  fs.mkdirSync(tmpDir);
  logger.debug('Successfully prepared temp directory: ' + tmpDir);

  let networkData = await loadExtConfig();
  if (networkData) {
    let orgData = networkData.organizations[orgName];

    // compose configtx object
    let orgObj = generateOrgObj(networkData, orgData);
    let configtxObj = {
      Organizations: [orgObj]
    };
    logger.debug('Generated configtx Obj: ' + JSON.stringify(configtxObj));

    let configData = yaml.safeDump(configtxObj);
    fs.writeFileSync(tmpDir+'/configtx.yaml', configData);
    logger.debug('Successfully written configtx.yaml file');

    // generate new org's json config and return
    let configtxgenExec = 'configtxgen';
    let cmdStr = configtxgenExec + ' -profile GeneratedChannel'
      + ' -configPath ' + tmpDir
      + ' -printOrg ' + orgName
      + ' > ' + tmpDir + '/newOrg.json';

    logger.debug('Generate new org\'s json file by command: ' + cmdStr);
    execSync(cmdStr, {stdio: []});
    logger.debug('Successfully generate new org\'s json file');

    let newOrg = fs.readFileSync(tmpDir+'/newOrg.json');
    fs.removeSync(tmpDir);
    let newOrgJSON = JSON.parse(newOrg.toString());
    logger.debug('Successfully load new org\'s json file');

    return [true, orgData.mspid, newOrgJSON];
  } else {
    let error_message = 'Missing configuration data';
    logger.error(error_message);
    return [false, error_message];
  }
};

let decodeEndorsementPolicy = async function(endorsementPolicyBase64Encoded) {
  if (!isBase64(endorsementPolicyBase64Encoded)) {
    logger.debug("Your endorsement policy is not base64 encoded!");
    return null;
  }

  let epBuffer = new Buffer(endorsementPolicyBase64Encoded, 'base64');
  return JSON.parse(epBuffer.toString());
};


let loadCollection = async function(collectionBase64Encoded) {
  if (!isBase64(collectionBase64Encoded)) {
    return [false, 'Collection is not a valid base64 string!']
  }

  let collectionContent = new Buffer(collectionBase64Encoded, 'base64');
  let fileName = './' + uuid.v4();
  fs.writeFileSync(fileName, collectionContent);

  return [true, fileName]
};

// For service discovery develop, see: https://fabric-sdk-node.github.io/tutorial-discovery.html
let asLocalhost = async function() {
  let extConfig = await loadExtConfig();
  if (extConfig && extConfig.serviceDiscovery && extConfig.serviceDiscovery.asLocalhost) {
    logger.debug("Set service discovery asLocalhost to true");
    return true
  }
  logger.debug("Set service discovery asLocalhost to false");
  return false
};

exports.initClient = initClient;
exports.isBase64 = isBase64;
exports.isGzip = isGzip;
exports.generateTarGz = generateTarGz;
exports.decompressTarGz = decompressTarGz;
exports.writeFile = writeFile;
exports.removeFile = removeFile;
exports.getClientForOrg = getClientForOrg;
exports.generateChannelTx = generateChannelTx;
exports.generateUpdateAnchorTx = generateUpdateAnchorTx;
exports.decodeEndorsementPolicy = decodeEndorsementPolicy;
exports.loadCollection = loadCollection;
exports.asLocalhost = asLocalhost;
exports.loadOrgMSP = loadOrgMSP;
exports.generateNewOrgJSON = generateNewOrgJSON;
exports.loadGenesisOrgName = loadGenesisOrgName;
