'use strict';

const validate = require('jsonschema').validate;
const os = require('os');
const package_json = require('../../package');
const uuid = require('uuid');

const hostname = os.hostname();
const pid = process.pid + ' ' + uuid.v4();
const what = package_json.name + ' ' + package_json.version + ' (node ' + process.version + ')';

const schema = {
  id: '/ItemBlob',
  type: ['object'],
  properties: {
    data: { type: ['object','null'] },
    metadata: {
      type: 'object',
      properties: {
        project_key: { type: 'string' },
        min_timestamp: { type: 'number', multipleOf: 1.0 },
        max_timestamp: { type: 'number', multipleOf: 1.0 },
        hostname: { type: 'string' },
        pid: { type: 'string' },
        what: { type: 'string' },
        unique_id: { type: 'string' }
      },
      required: ['project_key', 'min_timestamp', 'max_timestamp'],
      additionalProperties: false
    },
    status: { type: 'string', pattern: 'success' },
    items: { type: ['array','null'] },
    table: { type: ['array','null'] }
  },
  dependencies: {
    data: ['metadata'],
    metadata: ['data']
  },
  additionalProperties: false
};

module.exports = function(item_blob) {
  const result = validate(item_blob, schema);
  if( !result.valid )
    throw new Error('Failed validation: ' + JSON.stringify(item_blob, null, 2) + '\nbecause:\n ' + result);

  const default_metadata = {
    hostname: hostname,
    pid: pid,
    what: what,
    unique_id: uuid.v4()
  };

  if( item_blob.metadata )
    item_blob.metadata = Object.assign({}, default_metadata, item_blob.metadata);

  if( item_blob.items )
    item_blob.items = item_blob.items.map(module.exports);

  return item_blob;
};
