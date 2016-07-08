'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('node-uuid');

module.exports.metrics = function() {
  const database = require('./loki-storage').create();
  const app = express();

  app.get('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    res.json({
      status : 'success',
      data : database.fetch(req.query)
    });
  });

  app.post('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    database.store(cleanup(req.body));

    res.sendStatus(204);
  });

  return app;
};

///////////////////////////////////////////////////////////////////////////////
// listen
///////////////////////////////////////////////////////////////////////////////

module.exports.listen = function() {
  const app = express();

  app.use(bodyParser.json({}))
     .use(this.metrics());

  return app.listen.apply(app, arguments);
};

/*
 * Cleanup the JSON object we just received, for example, by filling in
 * missing metadata, or (worst case) throwing an exception if something
 * is horribly wrong with it.
 */
function cleanup(json_metrics) {
  if( typeof json_metrics !== 'object' )
    throw new Error('Not a JSON object, was: ' + typeof json_metrics);

  if( !json_metrics.project_key )
    throw new Error('Metrics object did not contain a required project_key field.');

  const now = Date.now();
  json_metrics.data          = json_metrics.data          || {};
  json_metrics.min_timestamp = json_metrics.min_timestamp || now;
  json_metrics.max_timestamp = json_metrics.max_timestamp || now;
  json_metrics.unique_id     = json_metrics.unique_id     || uuid.v4();

  return json_metrics;
}
