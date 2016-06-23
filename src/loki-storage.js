'use strict';

const loki = require('lokijs');
const metrics = require('legion-metrics');

const LokiStorage = {
  _type : 'legion-capture:LokiStorage'
};

LokiStorage.store = function(captive) {
  this._loki.insert(captive);
};

LokiStorage.fetch = function(by) {
  const query = this._loki.chain();

  if( by.projectKey )
    query.find({ projectKey: { $eq: by.projectKey } });

  let result = null;

  query.data().forEach(doc => {
    result = metrics.merge.root(result,doc.data);
  });

  return result;
};

module.exports.create = function() {
  const result = Object.assign(Object.create(LokiStorage), {
    _loki : new loki.Collection('metrics', { indices: [ 'projectKey', 'minTime', 'maxTime', 'sourceHost' ] })
  });

  return result;
};

module.exports.prototype = LokiStorage;
