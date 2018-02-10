'use strict';

try {
  module.exports.loki = require('./loki');
} catch(err) {
  console.log('optional capability client.loki not loaded'); //eslint-disable-line no-console
}

try {
  module.exports.pouchdb = require('./pouchdb');
} catch(err) {
  console.log('optional capability client.pouchdb not loaded'); //eslint-disable-line no-console
}

module.exports.remote = require('./remote');
