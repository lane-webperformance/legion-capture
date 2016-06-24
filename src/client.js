'use strict';

const fetch = require('node-fetch');
const os = require('os');
const uuid = require('node-uuid');
const querystring = require('querystring');

const sourceHost = os.hostname() + ':' + uuid.v4();

const Client = {
};

module.exports.prototype = Client;

module.exports.create = function(endpoint) {
  return Object.assign(Object.create(Client), {
    _endpoint: endpoint
  });
};

Client.postMetrics = function(project_key, sample) {
  const message = {};

  message.data = sample.summarize();
  message.projectKey = project_key;
  message.sourceHost = sourceHost;

  return fetch(this._endpoint + '/metrics', {
    method: 'POST',
    headers : { 'content-type': 'application/json' },
    body : JSON.stringify(message)
  }).then(res => res.text().then(empty => this.validate204Response(res,empty,'POST /metrics')));
};

Client.getMetrics = function(by) {
  const url = this._endpoint + '/metrics?' + querystring.stringify(by);
  return fetch(url).then(res => res.text().then(text => this.validate200Response(res,text,'GET ' + url).data));
};

// Examines a response object with text content and produces a suitable user-friendly error message if there is a problem.
//
// res: a Response object
// text: (string) the text content of the response, which will be JSON or result in a parse error
// what: a short human-readable string describing what we did to get the response
//
// returns: the JSON.parse of the content
Client.validate200Response = function(res, text, what) {
  let json = undefined;
  try {
    json = JSON.parse(text);
  } catch(err) {
    throw new Error('Unexpected response to: ' + what + ' (' + res.status + ' ' + res.statusText + '): ' + text);
  }
  if( !res.ok || res.status !== 200 || json.status !== 'success' )
    throw new Error('Undexpected response to ' + what + ' (' + res.status + ' ' + res.statusText + '): ' + json.status + ': ' + json.reason);

  return json;
};

// Examines a response object with text content and produces a suitable user-friendly error message if there is a problem.
//
// res: a Response object
// text: (string) the text content of the response
// what: a short human-readable string describing what we did to get the response
//
// returns: nothing
Client.validate204Response = function(res, text, what) {
  if( !res.ok || res.status !== 204 || text !== '' )
    throw new Error('Undexpected response to ' + what + ' (' + res.status + ' ' + res.statusText + '): ' + text);

  return undefined;
};
