'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const stringify = require('csv-stringify');
const metrics = require('legion-metrics');

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

  app.get('/metrics/csv', function(req,res) {
    res.setHeader('content-type', 'text/csv');

    database.getMetrics(Object.assign({path:''}, fixIntegers(req.query), {many:true}))
      .then(result => csvStringify(result.table))
      .then(csv_result => res.send(csv_result))
      .catch(err => {
        console.error(err);  //eslint-disable-line no-console
        res.status(500).send('internal error');
      });
  });

  app.get('/metrics/tags', function(req,res) {
    res.setHeader('content-type', 'application/json');

    database.getMetrics(fixIntegers(req.query))
      .then(result => metrics.unmerge.listTags(result.data))
      .then(tags => res.send(JSON.stringify(tags, fixSets, 2)))
      .catch(err => {
        console.error(err);  //eslint-disable-line no-console
        res.status(500).json({ status: 'failure', reason: 'internal error' });
      });
  });

  app.get('/metrics/values', function(req,res) {
    res.setHeader('content-type', 'application/json');

    database.getMetrics(fixIntegers(req.query))
      .then(result => metrics.unmerge.listValues(result.data))
      .then(values => res.send(JSON.stringify(values, fixSets, 2)))
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

// We can't JSON.stringify Sets, so turn them back into arrays.
function fixSets(_key, might_be_a_set) {
  if( might_be_a_set instanceof Set )
    might_be_a_set = Array.from(might_be_a_set);

  return might_be_a_set;
}


function csvStringify(table) {
  return new Promise(function(resolve,reject) {
    try {
      stringify(table, function(err, output) { if(err) { reject(err); } else { resolve(output); } });
    } catch(err) { reject(err); }
  });
}
