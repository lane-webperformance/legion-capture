'use strict';

const fileSystem = require('fs');
const path = require('path');
const metrics = require('legion-metrics');
const hash = require('object-hash');
var directory = 'captured-data-files';

module.exports.store = function (blob) {
  var filename = hash(blob.unique_id);

  // Old synchronous version
  //fileSystem.writeFileSync(path.join(process.cwd(), directory, filename), JSON.stringify(blob));

  //Async version
  fileSystem.writeFile(path.join(process.cwd(), directory, filename), JSON.stringify(blob), (err)=> {
    if (err)
      throw err;
  });
};

module.exports.fetch = function (by) {
  let result = null;
  var dir = path.join(process.cwd(), directory);

  // Using sync design until unit tests pass reliably.
  var filenames = fileSystem.readdirSync(dir);
  var len = filenames.length;
  for (var i = 0; i < len; i++)
  {
    var rawblob = fileSystem.readFileSync(path.join(dir, filenames[i]), 'utf-8');
    var blob = JSON.parse(rawblob);
    if (blob.project_key == by.project_key)
      result = metrics.merge.root(result, blob.data);
  }

  /**
   //@TODO Convert to Promise design.
   fileSystem.readdir(dir, (err, filenames) => {
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

    }); //foreach

  }); //readdir
   */

  return result;
};

/**
 * Delete all database content, useful for unit tests.
 */
module.exports.delete = function () {
  var dir = path.join(process.cwd(), directory);
  var filenames = fileSystem.readdirSync(dir);
  var len = filenames.length;
  for (var i = 0; i < len; i++)
  {
    fileSystem.unlinkSync(path.join(dir, filenames[i]));
  }
};

module.exports.create = function (user_specified_directory) {
  // Make sure directory exists to store data
  directory = user_specified_directory;
  let dir = path.join(process.cwd(), user_specified_directory);
  if (!fileSystem.existsSync(dir))
    fileSystem.mkdirSync(dir);
  return this;
};

