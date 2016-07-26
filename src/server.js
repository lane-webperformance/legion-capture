'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('node-uuid');

// The module that handles storing things

module.exports.metrics = function(storage) {
  const app = express();

  app.get('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    res.json({
      status : 'success',
      data : storage.fetch(req.query)
    });
  });

  app.post('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');
    const item_blob = cleanup(req.body);

    if( item_blob instanceof Error ) {
      res.status(400).json({
        status: 'failure',
        reason: item_blob.message
      });
    } else {
      storage.store(cleanup(req.body));
      res.sendStatus(204);
    }
  });

  return app;
};

///////////////////////////////////////////////////////////////////////////////
// listen
///////////////////////////////////////////////////////////////////////////////

//module.exports.listen = function( app ) {
//  return app.listen.apply(app, arguments);
//};

/*
 * storage:  A function that represents a database with store and fetch
 * functions.
 */
module.exports.create = function( storage ) {
  const app = express();
  app.use(bodyParser.json({}))
          .use(this.metrics( storage ));

  return app;
};

/*
 * Cleanup the JSON object we just received, for example, by filling in
 * missing metadata.
 *
 * Will return an error if something is horribly wrong with the input.
 */
function cleanup(json_metrics) {
  if( typeof json_metrics !== 'object' )
    return new Error('Not a JSON object, was: ' + typeof json_metrics);

  if( !json_metrics.project_key )
    return new Error('Metrics object did not contain a required project_key field.');

  const now = Date.now();
  json_metrics.data          = json_metrics.data          || {};
  json_metrics.min_timestamp = Number.isInteger(json_metrics.min_timestamp) ? json_metrics.min_timestamp : now;
  json_metrics.max_timestamp = Number.isInteger(json_metrics.max_timestamp) ? json_metrics.max_timestamp : now;
  json_metrics.unique_id     = json_metrics.unique_id     || uuid.v4();

  return json_metrics;
}
