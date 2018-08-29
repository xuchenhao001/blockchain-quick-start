'use strict';

let fs = require('fs');
let path = require('path');

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

exports.getKeyFilesInDir = getKeyFilesInDir;