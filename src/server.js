'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const stringify = require('csv-stringify');

const validate = require('./validate');

module.exports.metrics = function(database) {
  const app = express();

  app.use(bodyParser.json({limit: '50mb'}));

  app.get('/metrics', function(req,res) {
    res.setHeader('content-type', 'application/json');

    database.getMetrics(retype(req.query))
      .then(result => Object.assign({}, result, { status: 'success' }))
      .then(result => res.json(result))
      .catch(err => res.status(500).json({ status: 'failure', reason: err.message }));
  });

  app.get('/metrics/csv', function(req,res) {
    res.setHeader('content-type', 'text/csv');

    database.getMetrics(Object.assign({path:''}, retype(req.query), {many:true}))
      .then(result => csvStringify(result.table))
      .catch(err => res.status(500).send(err.message));
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

function retype(o) {
  o = JSON.parse(JSON.stringify(o));

  for( const k in o ) {
    if( /^(\-|\+)?([0-9]+)$/.test(o[k]) ) {
      o[k] = parseInt(o[k]);
    }
  }

  return o;
}

function csvStringify(table) {
  return new Promise(function(resolve,reject) {
    try {
      stringify(table, function(err, output) { if(err) { reject(err); } else { resolve(output); } });
    } catch(err) { reject(err); }
  });
}
