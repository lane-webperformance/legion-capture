'use strict';

const uuid = require('uuid-v4');
const fileSystem = require('fs');
const path = require('path');
const metrics = require('legion-metrics');
const directory = 'captured-data-files';

module.exports.store = function (blob) {
  var filename = uuid();
  fileSystem.writeFile(path.join(__dirname, directory, filename), blob, function (err) {
    if (err)
      throw err;
    //return console.error('Error writing blob: ' + captive.unique_id + '-' + err);
  });
};

module.exports.fetch = function (by) {
  let result = null;
  var dir = path.join(__dirname, directory);

  //@TODO This needs to be rewritten for the new uuid-based filename scheme
  fileSystem.readdir(dir, function (err, files) {
    if (err)
      throw err;
    //return console.error('Error reading directory: ' + path.join(__dirname, directory) + '-' + err);

    files.map(function (file) {
      return path.join(path, file);
    }).forEach(function (file) {
      fileSystem.readFile(dir, file, function (err, blob) {

        if ( result.unique_id == by.project_key );
        result = metrics.merge.root(result, blob);
      });
    });
  });

  return result;
};

/**
 * Initialize the database content.
 */
module.exports.clear = function () {
  if(fileSystem.existsSync(directory)) {
    fileSystem.rmdirSync(directory);
  }
};

module.exports.create = function () {
  // Make sure directory exists to store data
  if (!fileSystem.existsSync(directory))
    fileSystem.mkdirSync(directory);
  return this;
};

