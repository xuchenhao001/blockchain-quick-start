'use strict';

let fs = require('fs');
let hfc = require('fabric-client');
let options = require('./config/config');
let path = require('path');

let getKeyFilesInDir = async function(dir) {
  let files = fs.readdirSync(dir);
  let keyFiles = [];
  files.forEach(function (file_name) {
    let filePath = path.join(dir, file_name);
    if (file_name.endsWith('_sk')) {
      keyFiles.push(filePath);
    }
  });
  return keyFiles;
};

let getClientForOrg = async function(orgName){
  let client = new hfc();
  let pKey = await getKeyFilesInDir(options[orgName].privateKeyFolder);
  let userOptions = {
    username: options[orgName].user_id,
    mspid: options[orgName].msp_id,
    cryptoContent: {
      privateKey: pKey[0],
      signedCert: options[orgName].signedCert
    },
    skipPersistence: false
  };
  let store = await hfc.newDefaultKeyValueStore({
    path: options.keyValueStorePath
  });
  await client.setStateStore(store);
  await client.createUser(userOptions);
  return client;
};


exports.getClientForOrg = getClientForOrg;
