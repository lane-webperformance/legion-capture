'use strict';

const R = require('ramda');

const metrics = require('legion-metrics');

const validate = require('./validate');

module.exports = function(blobs, by) {
  if( by.path )
    return intoMany(blobs, by).then(bs => intoTable(bs.items, by));
  if( by.many )
    return intoMany(blobs, by);
  else
    return intoSingle(blobs, by);
};

function intoSingle(blobs, by) {
  if( blobs.length > 1 )
    console.warn('Merging ' + blobs.length + ' blobs.'); // eslint-disable-line no-console

  const result = {
    data: null,
    metadata: {
      project_key: by.project_key,
      min_timestamp: Number.MAX_SAFE_INTEGER,
      max_timestamp: Number.MIN_SAFE_INTEGER
    }
  };
 
  blobs.forEach(blob => {
    result.data = metrics.merge.algorithm(result.data,blob.data);
    result.metadata.min_timestamp = Math.min(result.metadata.min_timestamp, blob.metadata.min_timestamp);
    result.metadata.max_timestamp = Math.max(result.metadata.max_timestamp, blob.metadata.max_timestamp);
  });

  return Promise.resolve(validate(JSON.parse(JSON.stringify(result))));
}

function intoMany(blobs, by) {
  blobs = blobs.map(blob => intoSingle([blob],by));

  return Promise.all(blobs).then(bs => Object.assign({items:bs}));
}

function intoTable(blobs, by) {
  const paths = by.path.split(',');
  const keys = ['metadata.min_timestamp', 'metadata.max_timestamp'].concat(paths);
  const result = [];

  result.push(keys);

  blobs.forEach(blob => {
    const line = [];
    keys.forEach(key => {
      line.push(R.path(key.split('.'), blob));
    });

    result.push(line);
  });

  return Promise.resolve(JSON.parse(JSON.stringify({table:result})));
}
