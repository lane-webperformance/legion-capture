'use strict';

const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsert'));

const mergeResults = require('./merge');
const addDesignDocuments = require('./pouchdb-views');
const validate = require('./validate');

const PouchDBStorage = {
  _type : 'legion-capture:PouchDBStorage',
  _inited : false
};

module.exports.prototype = PouchDBStorage;

module.exports.create = function(path) {
  const result = Object.assign(Object.create(PouchDBStorage), {
    _pouch : new PouchDB(path)
  });

  return result;
};

PouchDBStorage._init = function() {
  if( this._inited )
    return Promise.resolve(undefined);
  else
    return addDesignDocuments(this._pouch).then(() => { this._inited = false; });
};

PouchDBStorage.postMetrics = function(blob) {
  blob = validate(blob);

  return this._init()
    .then(() => this._pouch.upsert('incoming:' + blob.metadata.project_key + ':' + blob.metadata.unique_id, _ => blob))
    .then(() => undefined);
};

PouchDBStorage.getMetrics = function(by) {
  const view = 'by-time';

  const query = {
    include_docs: true,
    attachments: false
  };

  if( typeof by.project_key === 'string' ) {
    query.startkey = [by.project_key, Number.MIN_SAFE_INTEGER];
    query.endkey = [by.project_key, Number.MAX_SAFE_INTEGER];
    query.include_docs = false;
    query.reduce = true;
    query.group_level = 1;

    if( typeof by.minutes === 'number' ) {
      query.group_level = 3;
      query.startkey = [by.project_key, Math.floor(by.minutes/60), by.minutes, Number.MIN_SAFE_INTEGER];
      query.endkey = [by.project_key, Math.floor(by.minutes/60), by.minutes, Number.MAX_SAFE_INTEGER];
    } else if( by.minutes ) {
      query.group_level = 3;
      query.startkey = [by.project_key, Number.MIN_SAFE_INTEGER];
      query.endkey = [by.project_key, Number.MAX_SAFE_INTEGER];
    }
  }

  return this._init()
    .then(() => this._pouch.query('legion-capture/' + view, query))
    .then(results => results.rows.map(x => x.value))
    .then(results => mergeResults(results, by));
};
