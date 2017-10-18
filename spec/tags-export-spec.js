'use strict';

const capture = require('../src/index');
const metrics = require('legion-metrics');
const fetch = require('node-fetch');
const fs = require('fs-extra');
const uuid = require('uuid');
const querystring = require('querystring');

fs.ensureDirSync('./.unit-test-dbs');

describe('The legion-capture metrics/tags call', function() {
  beforeEach(function() {
    this.port = 4312;
    this.server = capture.server.metrics(capture.client.pouchdb.create('./.unit-test-dbs/' + uuid.v4())).listen(this.port);
    this.endpoint = 'http://localhost:' + this.port;
    this.remote = capture.client.remote.create(this.endpoint);
  });

  afterEach(function() {
    this.server.close();
  });

  it('can generate tabular export of the data', function(done) {
    const x = metrics.sample({ x: { value : 25 } });
    const legion_client = this.remote;

    const post = (minute) => {
      const target = metrics.Target.create(metrics.merge);
      target.receiver().tag([metrics.tags.generic('foo','bar')]).receive(x);

      return target.clear().then(metrics => legion_client.postMetrics({
        data: metrics, 
        metadata: {
          project_key: 'my-project-key',
          min_timestamp: minute*60000 + 100,
          max_timestamp: minute*60000 + 200
        }
      })).catch(done.fail);
    };

    const posts = [];
    posts.push(post(0));
    posts.push(post(0));
    posts.push(post(0));
    posts.push(post(0));
    posts.push(post(2));
    posts.push(post(2));
    posts.push(post(3));
    posts.push(post(4));
    posts.push(post(4));
    posts.push(post(4));
    posts.push(post(4));

    Promise.all(posts).then(() => {
      const url = this.endpoint + '/metrics/tags?' + querystring.stringify({
        project_key: 'my-project-key'
      });

      return fetch(url);
    }).then(response => {
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      return response.json();
    }).then(json => {
      expect(json.foo).toEqual(['bar']);
    }).then(done).catch(done.fail);
  });
});

