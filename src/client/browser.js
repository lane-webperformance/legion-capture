'use strict';

try {
  module.exports.loki = require('./loki');
} catch(err) {
  console.log('optional capability client.loki not loaded'); //eslint-disable-line no-console
}

//NOTE: we could support this if we used pouchdb-browser . . . don't need it right now

//try {
//  module.exports.pouchdb = require('./pouchdb');
//} catch(err) {
//  console.log('optional capability client.pouchdb not loaded'); //eslint-disable-line no-console
//}

module.exports.remote = require('./remote');
