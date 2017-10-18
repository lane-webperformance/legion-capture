'use strict';

const capture = require('../src/index');
const metrics = require('legion-metrics');
const fetch = require('node-fetch');
const fs = require('fs-extra');
const uuid = require('uuid');
const querystring = require('querystring');

fs.ensureDirSync('./.unit-test-dbs');

describe('The legion-capture metrics/csv call', function() {
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
    const post = (minute) => legion_client.postMetrics({
      data: x.summarize(), 
      metadata: {
        project_key: 'my-project-key',
        min_timestamp: minute*60000 + 100,
        max_timestamp: minute*60000 + 200
      }
    });

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
      const url = this.endpoint + '/metrics/csv?' + querystring.stringify({
        project_key: 'my-project-key',
        minutes: true,
        path: 'data.values.x.$min,data.values.x.$avg.avg,data.values.x.$max'
      });

      return fetch(url);
    }).then(res => {
      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
      return res.text();
    }).then(csv => {
      expect(csv).toEqual(
        'metadata.min_timestamp,metadata.max_timestamp,data.values.x.$min,data.values.x.$avg.avg,data.values.x.$max' + '\n' +
        '100,200,25,25,25' + '\n' +
        '120100,120200,25,25,25' + '\n' +
        '180100,180200,25,25,25' + '\n' +
        '240100,240200,25,25,25' + '\n');
    }).then(done).catch(done.fail);
  });
});

