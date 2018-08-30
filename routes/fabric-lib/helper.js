'use strict';

let fs = require('fs');
let hfc = require('fabric-client');
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

let getClientForOrg = async function(org){
  let client = new hfc();
  let pKey = await getKeyFilesInDir(org.privateKeyFolder);
  let userOptions = {
    username: org.user_id,
    mspid: org.msp_id,
    cryptoContent: {
      privateKey: pKey[0],
      signedCert: org.signedCert
    },
    skipPersistence: false
  };
  let store = await hfc.newDefaultKeyValueStore({
    path: org.keyValueStorePath
  });
  await client.setStateStore(store);
  await client.createUser(userOptions);
  return client;
};


exports.getClientForOrg = getClientForOrg;
