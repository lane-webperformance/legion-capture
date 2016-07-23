'use strict';

const uuid = require('uuid-v4');
const fileSystem = require('fs');
const path = require('path');
const metrics = require('legion-metrics');
const directory = "captured-data-files";
const FileStorage = {
};

FileStorage.store = function(captive)
{
    var filename = uuid();
    fileSystem.writeFile(path.join(__dirname, directory, filename), captive, function(err)
    {
        if(err) return console.error('Error writing blob: ' + captive.unique_id + '-' + err);
    });
};

FileStorage.fetch = function(by)
{
    let result = null;
    var dir = path.join(__dirname, directory);

    //@TODO This needs to be rewritten for the new uuid-based filename scheme
    fileSystem.readdir(dir, function( err, files)
    {
        if(err) return console.error('Error reading directory: ' + path.join(__dirname, directory) + '-' + err);
        files.map(function (file) {
                return path.join(p, file);
            }).filter(function (file) {
                return file.startsWith(by.project_key)
            }).forEach(function (file) {
                console.log("%s (%s)", file, path.extname(file));
                fileSystem.readFile(dir, file, function(err, blob )
                {
                    result = metrics.merge.root(result,blob);
                });
            });
    });

  return result;
};

module.exports.create = function(project_name)
{
    // Make sure directory to store data exists
    if( !fileSystem.existsSync(directory))
        fileSystem.mkdirSync(directory);
    return this;
};

module.exports.prototype = FileStorage;
