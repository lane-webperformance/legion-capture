'use strict';

const capture = require('../src/index');
const metrics = require('legion-metrics');
const fs = require('fs-extra');
const uuid = require('uuid');

fs.ensureDirSync('./.unit-test-dbs');

describe('The legion-capture server', function() {
  beforeEach(function() {
    this.port = 4312;
    this.server = capture.server.metrics(capture.client.pouchdb.create('./.unit-test-dbs/' + uuid.v4())).listen(this.port);
    this.endpoint = 'http://localhost:' + this.port;
    this.remote = capture.client.remote.create(this.endpoint);
    this.pouchdb = capture.client.pouchdb.create('./.unit-test-dbs/' + uuid.v4());
  });

  afterEach(function() {
    this.server.close();
  });

  function forEach(f) {
    f('remote');
    f('pouchdb');
  }

  forEach(key => {
    it('can POST blobs of metrics over time and get them back according to time index | ' + key, function(done) {
      const x = metrics.sample({ x: { value : 25 } });
      const legion_client = this[key];
      const post = (minute) => legion_client.postMetrics({
        data: x.summarize(), 
        metadata: {
          project_key: 'my-project-key',
          min_timestamp: minute*60000 + Math.floor(Math.random()*30000),
          max_timestamp: minute*60000 + 30000 + Math.floor(Math.random()*30000)
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
        return legion_client.getMetrics({ project_key: 'my-project-key', minutes: 0 });
      }).then(json => {
        expect(json.data.values.x.$avg.avg).toBe(25);
        expect(json.data.values.x.$avg.size).toBe(4);
      }).then(() => {
        return legion_client.getMetrics({ project_key: 'my-project-key', minutes: 1 });
      }).then(json => {
        expect(json.data).toBe(null);
      }).then(() => {
        return legion_client.getMetrics({ project_key: 'my-project-key', minutes: 2 });
      }).then(json => {
        expect(json.data.values.x.$avg.avg).toBe(25);
        expect(json.data.values.x.$avg.size).toBe(2);
      }).then(() => {
        return legion_client.getMetrics({ project_key: 'my-project-key', minutes: 3 });
      }).then(json => {
        expect(json.data.values.x.$avg.avg).toBe(25);
        expect(json.data.values.x.$avg.size).toBe(1);
      }).then(() => {
        return legion_client.getMetrics({ project_key: 'my-project-key', minutes: 4 });
      }).then(json => {
        expect(json.data.values.x.$avg.avg).toBe(25);
        expect(json.data.values.x.$avg.size).toBe(4);
      }).then(done).catch(done.fail);
    });

    it('can POST blobs of metrics over time and get them back as an array | ' + key, function(done) {
      const x = metrics.sample({ x: { value : 25 } });
      const legion_client = this[key];
      const post = (minute) => legion_client.postMetrics({
        data: x.summarize(), 
        metadata: {
          project_key: 'my-project-key',
          min_timestamp: minute*60000 + Math.floor(Math.random()*30000),
          max_timestamp: minute*60000 + 30000 + Math.floor(Math.random()*30000)
        }
      });

      const posts = [];
      posts.push(post(9));
      posts.push(post(9));
      posts.push(post(9));
      posts.push(post(9));
      posts.push(post(11));
      posts.push(post(11));
      posts.push(post(12));
      posts.push(post(13));
      posts.push(post(13));
      posts.push(post(13));
      posts.push(post(13));

      Promise.all(posts).then(() => {
        return capture.get(legion_client).byMinutes({ project_key: 'my-project-key' });
      }).then(results => {
        expect(results.all.data.values.x.$avg.avg).toBe(25);
        expect(results.minutes[0].data.values.x.$avg.avg).toBe(25);
        expect(results.minutes[0].data.values.x.$avg.size).toBe(4);
        expect(results.minutes[2].data.values.x.$avg.avg).toBe(25);
        expect(results.minutes[2].data.values.x.$avg.size).toBe(2);
        expect(results.minutes[3].data.values.x.$avg.avg).toBe(25);
        expect(results.minutes[3].data.values.x.$avg.size).toBe(1);
        expect(results.minutes[4].data.values.x.$avg.avg).toBe(25);
        expect(results.minutes[4].data.values.x.$avg.size).toBe(4);
      }).then(done).catch(done.fail);
    });
  });
});

