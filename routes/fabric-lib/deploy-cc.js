'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('DEPLOYCC');
logger.level = 'DEBUG';

const helper = require('./helper');
const uuid = require('uuid');
const path = require('path');

let installChaincode = async function (chaincodeContent, chaincodeName, chaincodePath, chaincodeType, chaincodeVersion,
                                       chaincodeSequence, endorsementPolicy, collection, initRequired, orgName, peers,
                                       localPath) {
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
      logger.debug('Got [initRequired], you need to init your chaincode before invoke it');
      chaincode.setInitRequired(true);
    }
    // set the sequence (modification) number - default is 1
    chaincode.setSequence(chaincodeSequence); // must increment for each definition change

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
        request_timeout: 10000 // give the peers some extra time
      };
      let package_id = await chaincode.install(install_request);
      logger.info('Chaincode has been successfully installed on peer: ' + peerName
        + ' with chaincode package id: ' + package_id);
    }
  } catch (e) {
    let err_msg = 'Install chaincode failed: ' + e;
    logger.error(err_msg);
    return [false, err_msg]
  }

  // dump chaincode key features
  let chaincodeToDump = {
    name: chaincode.getName(),
    version: chaincode.getVersion(),
    endorsementPolicy: chaincode.getEndorsementPolicyDefinition(),
    collection: chaincode.getCollectionConfigPackageDefinition(),
    initRequired: chaincode.getInitRequired(),
    packageId: chaincode.getPackageId(),
    sequence: chaincode.getSequence().toNumber()
  };
  let chaincodeString = JSON.stringify(chaincodeToDump);
  logger.debug("Succesfully installed chaincode: " + chaincodeString);
  return [true, chaincodeToDump];
};

// Approve chaincode for your organization
let approveChaincode = async function (chaincodeName, chaincodeVersion, chaincodeEndorsementPolicy, chaincodeCollection,
                                       chaincodeInitRequired, chaincodePackageId, chaincodeSequence, channelName,
                                       orderers, orgName, peers) {
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
    if (typeof chaincodeEndorsementPolicy !== 'undefined' && chaincodeEndorsementPolicy) {
      chaincode.setEndorsementPolicyDefinition(chaincodeEndorsementPolicy);
    }
    if (typeof chaincodeCollection !== 'undefined' && chaincodeCollection) {
      chaincode.setCollectionConfigPackageDefinition(chaincodeCollection);
    }
    if (typeof chaincodeInitRequired !== 'undefined' && chaincodeInitRequired) {
      chaincode.setInitRequired(chaincodeInitRequired);
    }
    chaincode.setPackageId(chaincodePackageId);
    chaincode.setSequence(chaincodeSequence);

    // =====================================
    // Step 4: Approve for your organization
    // =====================================

    // send a approve chaincode for organization transaction
    let tx_id = client.newTransactionID(true);
    let tx_id_string = tx_id.getTransactionID();
    let request = {
      // @2.0.0-snapshot.221 targets for now are required
      targets: peers,
      chaincode: chaincode, // The chaincode instance fully populated
      txId: tx_id
    };
    // send to the peer to be endorsed
    let approveResponse = await channel.approveChaincodeForOrg(request);
    logger.debug('Approve chaincode response: ' + JSON.stringify(approveResponse));

    // send to the orderer to be committed
    let orderer_request = {
      proposalResponses: approveResponse.proposalResponses,
      proposal: approveResponse.proposal,
      txId: tx_id
    };
    let result = await helper.sendTransactionWithEventHub(channel, tx_id_string, orderer_request);
    if (result[0] && result[1].status === 'SUCCESS') {
      return [true];
    } else {
      return [false, result[1]];
    }
  } catch (e) {
    let err_msg = 'Approve chaincode failed: ' + e;
    logger.error(err_msg);
    return [false, err_msg];
  }
};

// Commit definition to the channel
let commitChaincode = async function (chaincodeName, chaincodeVersion, chaincodeEndorsementPolicy, chaincodeCollection,
                                      chaincodeInitRequired, chaincodePackageId, chaincodeSequence, channelName,
                                      orderers, orgName, peers) {
  logger.debug('\n\n============ Commit chaincode on organizations ============\n');

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
    if (typeof chaincodeEndorsementPolicy !== 'undefined' && chaincodeEndorsementPolicy) {
      chaincode.setEndorsementPolicyDefinition(chaincodeEndorsementPolicy);
    }
    if (typeof chaincodeCollection !== 'undefined' && chaincodeCollection) {
      chaincode.setCollectionConfigPackageDefinition(chaincodeCollection);
    }
    if (typeof chaincodeInitRequired !== 'undefined' && chaincodeInitRequired) {
      chaincode.setInitRequired(chaincodeInitRequired);
    }
    chaincode.setSequence(chaincodeSequence);

    // ========================================
    // Step 5: Commit definition to the channel
    // ========================================

    // send a commit chaincode for channel transaction
    let tx_id = client.newTransactionID(true);
    let tx_id_string = tx_id.getTransactionID();
    let request = {
      // @2.0.0-snapshot.221 targets for now are required
      targets: peers,
      chaincode: chaincode,
      txId: tx_id
    };
    // send to the peers to be endorsed
    let commitChaincodeResponse = await channel.commitChaincode(request);
    logger.debug('Commit chaincode response: ' + JSON.stringify(commitChaincodeResponse));
    // send to the orderer to be committed
    let orderer_request = {
      proposalResponses: commitChaincodeResponse.proposalResponses,
      proposal: commitChaincodeResponse.proposal,
      txId: tx_id
    };
    let result = await helper.sendTransactionWithEventHub(channel, tx_id_string, orderer_request);
    if (result[0] && result[1].status === 'SUCCESS') {
      return [true];
    } else {
      return [false, result[1]];
    }
  } catch (e) {
    let err_msg = 'Commit chaincode failed: ' + e;
    logger.error(err_msg);
    return [false, err_msg]
  }
};

exports.installChaincode = installChaincode;
exports.approveChaincode = approveChaincode;
exports.commitChaincode = commitChaincode;
