'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const validate = require('./validate');

module.exports.metrics = function() {
  const database = require('./loki-client').create();
  const app = express();

  app.get('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    database.getMetrics(req.query)
      .then(result => Object.assign({}, result, { status: 'success' }))
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ status: 'failure', reason: err.message }));
  });

  app.post('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    Promise.resolve(req.body)
      .then(blob => validate(blob))
      .then(blob => database.postMetrics(blob))
      .then(() => res.sendStatus(204))
      .catch(err => res.status(400).json({ status: 'failure', reason: err.message }));
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
