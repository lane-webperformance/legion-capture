/* eslint-disable no-console */

'use strict';

const control = require('./index');

const port = 8510;

control.server.metrics(control.client.pouchdb.create('metrics-capture-database')).listen(port, function() {
  console.log('legion-capture listening on port ' + port + '.');
});
