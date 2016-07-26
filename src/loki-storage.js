'use strict';

const loki = require('lokijs');
const metrics = require('legion-metrics');

const LokiStorage = {
  _type : 'legion-capture:LokiStorage'
};

LokiStorage.store = function(captive) {
  if(this._loki.findOne({ unique_id : captive.unique_id }))  //idempotence
    return;

  this._loki.insert(captive);
};

LokiStorage.fetch = function(by) {
  const query = this._loki.chain();

  if( by.project_key )
    query.find({ project_key: { $eq: by.project_key } });

  let result = null;

  query.data().forEach(doc => {
    result = metrics.merge.root(result,doc.data);
  });

  return result;
};

/*
 * Simply close the database, which isn't relevant to an
 * in-memory design.
 */
LokiStorage.close = function() {
  this._loki.clear();  //Can't "close" collection, must init it instead.
};

LokiStorage.init = function() {
  this._loki.clear();  //Can't "close" collection, must init it instead.
};

module.exports.create = function() {
  const result = Object.assign(Object.create(LokiStorage), {
    _loki : new loki.Collection('metrics', { indices: [
      'project_key',
      'min_timestamp', 'max_timestamp',
      'unique_id',
      'hostname', 'pid', 'what' ] })
  });

  return result;
};

module.exports.prototype = LokiStorage;
