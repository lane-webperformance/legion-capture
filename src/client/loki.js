'use strict';

const loki = require('lokijs');
const metrics = require('legion-metrics');

const validate = require('../common/validate');

const LokiStorage = {
  _type : 'legion-capture:LokiStorage'
};

module.exports.prototype = LokiStorage;

module.exports.create = function() {
  const result = Object.assign(Object.create(LokiStorage), {
    _loki : new loki.Collection('metrics', { indices: [
      'metadata.project_key',
      'metadata.min_timestamp', 'metadata.max_timestamp',
      'metadata.unique_id',
      'metadata.hostname', 'metadata.pid', 'metadata.what' ] })
  });

  return result;
};

LokiStorage.postMetrics = function(blob) {
  blob = validate(blob);

  if(this._loki.findOne({ 'metadata.unique_id' : blob.metadata.unique_id }))  //idempotence. TODO: this should overwrite, not ignore
    return;

  this._loki.insert(blob);

  return Promise.resolve();
};

LokiStorage.getMetrics = function(by) {
  const query = this._loki.chain();

  if( by.project_key )
    query.find({ 'metadata.project_key': { $eq: by.project_key } });

  const result = {
    data: null,
    metadata: {
      project_key: by.project_key,
      min_timestamp: Number.MIN_SAFE_INTEGER,
      max_timestamp: Number.MAX_SAFE_INTEGER
    }
  };
 
  query.data().forEach(blob => {
    result.data = metrics.merge.algorithm(result.data,blob.data);
    result.metadata.min_timestamp = Math.min(result.metadata.min_timestamp, blob.metadata.min_timestamp);
    result.metadata.max_timestamp = Math.max(result.metadata.min_timestamp, blob.metadata.min_timestamp);
  });

  result.data = JSON.parse(JSON.stringify(result.data));

  return Promise.resolve(validate(result));
};
