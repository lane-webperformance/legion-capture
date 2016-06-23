'use strict';

const express = require('express');
const bodyParser = require('body-parser');

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
    const capture_object = req.body;

    database.store(capture_object);

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
