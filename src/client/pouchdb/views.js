'use strict';

const metrics = require('legion-metrics');

module.exports = function(pouchdb) {
  return Promise.resolve()
    .then(() => pouchdb.putIfNotExists(module.exports.design_document))
    .then(() => 'ok');
};

module.exports.mapByTime = 
  'function(doc) {'                                                                    +
  '  const copy = {'                                                                   +
  '    data: doc.data,'                                                                +
  '    metadata: {'                                                                    +
  '      min_timestamp : doc.metadata.min_timestamp,'                                  +
  '      max_timestamp : doc.metadata.max_timestamp'                                   +
  '    }'                                                                              +
  '  };'                                                                              +
  '  const t = doc.metadata.max_timestamp;'                                            +
  '  emit([doc.metadata.project_key, Math.floor(t/60/60/1000), Math.floor(t/60/1000), Math.floor(t/1000), Math.floor(t)], copy);' +
  '};';

module.exports.mergeAlgorithm =
  'function(keys, values, rereduce) {'                                                                                        +
  '  const algorithm = ' + metrics.merge.algorithm.toString() + ';'                                                           +
  '  let result = { data: {}, metadata: { min_timestamp: Number.MAX_SAFE_INTEGER, max_timestamp: Number.MIN_SAFE_INTEGER} };' +
  '  values.forEach(value => {'                                                                                               +
  '    result.data = algorithm(result.data,value.data);'                                                                      +
  '    result.metadata.min_timestamp = Math.min(result.metadata.min_timestamp, value.metadata.min_timestamp); '               +
  '    result.metadata.max_timestamp = Math.max(result.metadata.max_timestamp, value.metadata.max_timestamp); '               +
  '  });'                                                                                                                     +
  '  return result;'                                                                                                          +
  '};';

module.exports.design_document = {
  _id: '_design/legion-capture',
  language: 'javascript',

  views: {
    'by-time': {
      map: module.exports.mapByTime,
      reduce: module.exports.mergeAlgorithm
    }
  }
}; 
