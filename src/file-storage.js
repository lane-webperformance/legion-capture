'use strict';

const uuid = require('uuid-v4');
const fileSystem = require('fs');
const path = require('path');
const metrics = require('legion-metrics');
const directory = 'captured-data-files';

module.exports.store = function (blob) {
  var filename = uuid();
  fileSystem.writeFileSync(path.join(__dirname, directory, filename), JSON.stringify(blob));

  //@TODO Convert to Promise design
  //Async version
  //fileSystem.writeFile(path.join(__dirname, directory, filename), JSON.stringify(blob), function (err) {
  //  if (err)
  //    throw err;
  //});
};

module.exports.fetch = function (by) {
  let result = null;
  var dir = path.join(__dirname, directory);

  // Using sync design until unit tests pass reliably.
  var filenames = fileSystem.readdirSync(dir);
  var len = filenames.length;
  for( var i = 0; i < len; i++) {
    var rawblob = fileSystem.readFileSync(path.join(dir, filenames[i]), 'utf-8');
    var blob = JSON.parse(rawblob);
    if (blob.project_key == by.project_key)
      result = metrics.merge.root(result, blob.data);
  }

  //@TODO Convert to Promise design
  /**
  fileSystem.readdir(dir, function (err, filenames) {
    if (err)
      throw err;

    filenames.forEach(function (filename) {
      var blob;
      fileSystem.readFile(path.join(dir, filename), 'utf-8', function (err, rawblob) {
        if (err)
          throw err;
        blob = JSON.parse(rawblob);
        if (blob.project_key == by.project_key)
          result = metrics.merge.root(result, blob.data);
      });
    });
  });
*/

  return result;
};

/**
 * Delete all database content, useful for unit tests.
 */
module.exports.delete = function () {
  let dir = path.join(__dirname, directory);

  fileSystem.readdir(dir, function (err, filenames) {
    if (err)
      throw err;

    filenames.forEach(function (filename) {
      fileSystem.exists(path.join(dir, filename), function (doesit) {
        if (doesit)
        {
          fileSystem.unlink(path.join(dir, filename), function (err) {
            if (err) { true; }

          });
        }
      });
    });
  });
};

module.exports.create = function () {
  // Make sure directory exists to store data
  let dir = path.join(__dirname, directory);
  if (!fileSystem.existsSync(dir))
    fileSystem.mkdirSync(dir);
  return this;
};

