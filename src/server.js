'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const validate = require('./validate');

module.exports.metrics = function(database) {
  const app = express();

  app.use(bodyParser.json({limit: '50mb'}));

  app.get('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    database.getMetrics(fixIntegers(req.query))
      .then(result => Object.assign({}, result, { status: 'success' }))
      .then(result => res.json(result))
      .catch(err => {
        console.error(err);  //eslint-disable-line no-console
        res.status(500).json({ status: 'failure', reason: 'internal error' });
      });
  });

  app.post('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    Promise.resolve(req.body)
      .then(blob => validate(blob))
      .then(blob => database.postMetrics(blob))
      .then(() => res.sendStatus(204))
      .catch(err => {
        console.error(err); //eslint-disable-line no-console
        res.status(500).json({ status: 'failure', reason: 'internal error' });
      });
  });

  return app;
};

// Integer query parameters will come through as strings. Fix them to be integers.
function fixIntegers(o) {
  o = JSON.parse(JSON.stringify(o));

  for( const k in o ) {
    if( /^(\-|\+)?([0-9]+)$/.test(o[k]) ) {
      o[k] = parseInt(o[k]);
    }
  }

  return o;
}
