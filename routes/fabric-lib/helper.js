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
const path = require('path');

const networkConfigPath = 'config/network-config.yaml';
const networkExtConfigPath = 'config/network-config-ext.yaml';

let networkConfig;
let networkExtConfig;
let client;

let isBase64 = function (string) {
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

    let task = pack.entry({name: 'src/github.com/chaincode/chaincode.go'}, chaincodeBuffer);

    Promise.all([task]).then(() => {
      pack.finalize();
    }).catch((err) => {
      reject(err);
    });
  });
};

let decompressTarGz = async function (fileName, targetDir) {
  return new Promise(function (resolve, reject) {
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

let removeFile = async function (fileName) {
  fs.removeSync(fileName)
};

let initClient = async function () {
  logger.debug('Init client with network config...');

  // clean tmp directories
  let appFiles = fs.readdirSync('./');
  appFiles.forEach(function (appFile) {
    if (appFile.indexOf("_") === 0) {
      logger.debug("Remove useless tmp file: " + appFile);
      fs.removeSync(appFile)
    }
  });

  let done = false;
  while (!done) {
    try {
      client = hfc.loadFromConfig(networkConfigPath);
      networkConfig = await loadNetConfig();
      networkExtConfig = await loadNetExtConfig();
      while (!networkExtConfig) {
        let error_message = 'Missing extended network configuration data. Retry after 1 minutes...';
        logger.error(error_message);
        await sleep(30000);
      }
      done = true;
      logger.info("Configurations successfully loaded. Start to serve requests.")
    } catch (e) {
      logger.error(e.toString());
      logger.error('Retry after 1 minutes...');
      await sleep(30000);
    }
  }
};

let sleep = async function (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
};

let loadNetConfig = async function () {
  let fileData = fs.readFileSync(networkConfigPath);
  return yaml.safeLoad(fileData);
};

let loadNetExtConfig = async function () {
  let fileData = fs.readFileSync(networkExtConfigPath);
  return yaml.safeLoad(fileData);
};

// get client for org, just consist with admin User identity
let getClientForOrg = async function (orgName) {
  logger.debug('get admin client for org %s', orgName);

  // prepare a tmp directory for place files
  let tmpDir = await genTmpDir();
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
let getClientForOrg_normUsage = async function (org) {
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
    await client.setUserContext({username: 'admin', password: 'adminpw'}, false);
  }

  return client;
};

// generate channel.tx file with channel name and org names included in this channel
let generateChannelTx = async function (channelName, orgNames) {

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

  let txFile = fs.readFileSync(tmpDir + '/channel.tx');
  fs.removeSync(tmpDir);

  return [true, txFile];
};

// generate anchor peer update tx file
let generateUpdateAnchorTx = async function (channelName, orgNames, orgMSPId) {

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

  let txFile = fs.readFileSync(tmpDir + '/anchorPeer.tx');
  fs.removeSync(tmpDir);

  return [true, txFile];
};

// Generate configtx yaml file, and return the file path
let genConfigtxYaml = async function (orgNames) {
  // prepare a tmp directory for place files
  let tmpDir = await genTmpDir();
  // compose configtx object
  let configtxObj = await genConfigtxObj(orgNames);
  logger.debug('Generated configtx Obj: ' + JSON.stringify(configtxObj));

  let configData = yaml.dump(configtxObj);
  logger.debug('Generated configtx yaml file: ' + configData);
  fs.writeFileSync(tmpDir + '/configtx.yaml', configData);
  logger.debug('Successfully written configtx.yaml file');
  return tmpDir;
};

let genConfigtxObj = async function (orgNames) {
  // generate channel config yaml
  let orgObjs = [];
  let networkData = networkExtConfig;
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

let generateOrgObj = function (networkData, orgData) {
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

let loadGenesisOrgName = async function (orgName) {
  let networkData = networkExtConfig;
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
let loadOrgMSP = async function (orgName) {
  let networkData = networkExtConfig;
  if (networkData) {
    let orgData = networkData.organizations[orgName];
    return orgData.mspid;
  }
  return null;
};

// generate new org's config json file for updating channel
let generateNewOrgJSON = async function (channelName, orgName) {
  // prepare a tmp directory for place files
  let tmpDir = await genTmpDir();
  let networkData = networkExtConfig;
  if (networkData) {
    let orgData = networkData.organizations[orgName];

    // compose configtx object
    let orgObj = generateOrgObj(networkData, orgData);
    let configtxObj = {
      Organizations: [orgObj]
    };
    logger.debug('Generated configtx Obj: ' + JSON.stringify(configtxObj));

    let configData = yaml.safeDump(configtxObj);
    fs.writeFileSync(tmpDir + '/configtx.yaml', configData);
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

    let newOrg = fs.readFileSync(tmpDir + '/newOrg.json');
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

let decodeEndorsementPolicy = async function (endorsementPolicyBase64Encoded) {
  if (!isBase64(endorsementPolicyBase64Encoded)) {
    logger.debug("Your endorsement policy is not base64 encoded!");
    return null;
  }

  let epBuffer = new Buffer(endorsementPolicyBase64Encoded, 'base64');
  return JSON.parse(epBuffer.toString());
};


let loadCollection = async function (collectionBase64Encoded) {
  if (!isBase64(collectionBase64Encoded)) {
    return [false, 'Collection is not a valid base64 string!']
  }

  let collectionContent = new Buffer(collectionBase64Encoded, 'base64');
  let fileName = './_' + uuid.v4();
  fs.writeFileSync(fileName, collectionContent);

  return [true, fileName]
};

// when do add org to an existing network, update network config & network extend config with new Org to memory
let newOrgUpdateNetworkConfig = async function (newOrgDetail) {
  // prepare a tmp directory for place files
  let tmpDir = await genTmpDir();
  let networkConfigYamlFile = tmpDir + '/new-org-network-config.yaml';

  // update network config yaml with new Org
  if (!newOrgDetail.peers) {
    let errMsg = "Cannot find any peer in new Org's detail";
    logger.error(errMsg);
    return [false, errMsg];
  }
  let newOrgPeerNames = [];
  newOrgDetail.peers.forEach(function (peer) {
    logger.debug("Added peer name " + peer.name + " to network config new org's peer list");
    newOrgPeerNames.push(peer.name);
  });
  // update organization definition
  networkConfig.organizations[newOrgDetail.name] = {
    mspid: newOrgDetail.mspid,
    peers: newOrgPeerNames,
    adminPrivateKey: newOrgDetail.adminPrivateKey,
    signedCert: newOrgDetail.signedCert
  };
  // update peers definition
  newOrgDetail.peers.forEach(function (peer) {
    logger.debug("Added peer " + peer.name + " to network config new org's peer list");
    networkConfig.peers[peer.name] = {
      url: peer.url,
      eventUrl: peer.eventUrl,
      grpcOptions: peer.grpcOptions,
      tlsCACerts: peer.tlsCACerts
    }
  });

  logger.debug("Successfully updated network config yaml with new Org: " + JSON.stringify(networkConfig));

  let networkConfigYaml = yaml.safeDump(networkConfig);

  // write down the new network configuration yaml
  fs.writeFileSync(networkConfigYamlFile, networkConfigYaml);

  // load new network config yaml to client
  client.loadFromConfig(networkConfigYamlFile);

  // prepare msp directory for create channel (extend network config), include admincerts, cacerts, and tlscacerts
  let admincertsFile = tmpDir + '/admincerts/admin.crt';
  let admincerts = newOrgDetail.signedCert.pem;
  fs.outputFileSync(admincertsFile, admincerts);
  logger.debug("Successfully write to msp dir new Org's admincerts: " + admincerts);

  let cacertsFile = tmpDir + '/cacerts/ca.crt';
  let cacerts = newOrgDetail.mspCACerts.pem;
  fs.outputFileSync(cacertsFile, cacerts);
  logger.debug("Successfully write to msp dir new Org's cacerts: " + cacerts);

  let tlscacertsFile = tmpDir + '/tlscacerts/ca.crt';
  let tlscacerts = newOrgDetail.tlsCACerts.pem;
  fs.outputFileSync(tlscacertsFile, tlscacerts);
  logger.debug("Successfully write to msp dir new Org's tlscacerts: " + tlscacerts);

  // update network extend config object with new Org

  // update organizations definition
  networkExtConfig.organizations[newOrgDetail.name] = {
    name: newOrgDetail.name,
    mspid: newOrgDetail.mspid,
    peers: newOrgPeerNames,
    mspDir: {
      path: path.resolve(tmpDir) // change to absolute path for configtxgen command
    }
  };
  // update peers definition
  newOrgDetail.peers.forEach(function (peer) {
    logger.debug("Added peer " + peer.name + " to extend network config's peer list");
    networkExtConfig.peers[peer.name] = {
      'url-addr-container': peer['url-addr-container'],
      'url-port-container': peer['url-port-container']
    }
  });
  logger.debug("Successfully updated extend network config yaml with new Org: " + JSON.stringify(networkExtConfig));

  return [true]
};

// For service discovery develop, see: https://fabric-sdk-node.github.io/tutorial-discovery.html
let asLocalhost = async function () {
  let extConfig = networkExtConfig;
  if (extConfig && extConfig.serviceDiscovery && extConfig.serviceDiscovery.asLocalhost) {
    logger.debug("Set service discovery asLocalhost to true");
    return true
  }
  logger.debug("Set service discovery asLocalhost to false");
  return false
};

// Generate tmp directory
let genTmpDir = async function () {
  let tmpDir = './_' + uuid.v4();
  if (fs.existsSync(tmpDir)) {
    fs.removeSync(tmpDir);
  }
  fs.mkdirSync(tmpDir);
  logger.debug('Successfully prepared temp directory: ' + tmpDir);
  return tmpDir;
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
exports.newOrgUpdateNetworkConfig = newOrgUpdateNetworkConfig;
