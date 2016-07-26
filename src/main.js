/* eslint-disable no-console */

'use strict';

/*
 * Defaults
 */
const port = 8000;
const storage = 'memory';

const cli = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const cli_option_definitions = [
  {name: 'help', type: Boolean, description: 'print this help message'},
  {
    name: 'port',
    type: Number,
    typeLabel: '[underline]{port number}',
    description: 'capture server port (default: 8000)'
  },
  {
    name: 'storage',
    type: String,
    typeLabel: '[underline]{memory|file}',
    description: 'destination for performance metrics. (default=memory)'
  },
  {
    name: 'file-directory',
    type: String,
    typeLabel: '[underline]{complete directory path}',
    description: 'destination directory for performance metrics. (default=src file location)'
  }
];

/*
 * Print usage information.
 */
/* istanbul ignore next */
function printUsage()
{
  const usage = commandLineUsage([{
    header: 'Capture load test metrics.',
    optionList: cli_option_definitions
  }]);

  console.log(usage);
}

/*
 * Start the capture server with the specified options.
 *
 * options.port - the port to listen on.
 * options.storage - Store metrics either in memory or on disk.
 */
const options = cli(cli_option_definitions);

/* istanbul ignore next */
if (options.help)
{
  printUsage();
  return;
}

options.port = options.port || port;
options.storage = options.storage || storage;

// Default to file storage if memory isn't specified.
var db = options.storage == 'memory' ? require('./loki-storage').create() : require('./file-storage').create();
var server = require('./index').server.create(db);

server.listen(options.port, function ()
{
  console.log('legion-capture listening on port ' + port + '.');
});

