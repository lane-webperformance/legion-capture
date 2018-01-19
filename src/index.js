'use strict';

module.exports.server = require('./server');
module.exports.client = {};
module.exports.client.loki = require('./loki-client');
module.exports.client.pouchdb = require('./pouchdb-client');
module.exports.client.remote = require('./remote-client');
module.exports.Target = require('./Target');
module.exports.get = require('./get-by');

