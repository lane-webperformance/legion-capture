'use strict';

const metrics = require('legion-metrics');
const capture = require('../src/index');
const delay = require('promise-delay');

const db_file = require('../src/loki-storage').create();
const db_loki = require('../src/file-storage').create('captured-data-files');
const server_file = capture.server.create(db_file);
const server_loki = capture.server.create(db_loki);
let testServerFile = {port: 0, server: '', endpoint: ''};
let testServerLoki = {port: 0, server: '', endpoint: ''};

describe('The capturing metrics Target', function() {
  beforeEach(function() {
    db_loki.delete();
    testServerFile.port = 4312;
    testServerFile.server = server_file.listen(testServerFile.port);
    testServerFile.endpoint = 'http://localhost:' + testServerFile.port;

    testServerLoki.port = 4313;
    testServerLoki.server = server_loki.listen(testServerLoki.port);
    testServerLoki.endpoint = 'http://localhost:' + testServerLoki.port;
  });

  afterEach(function() {
    testServerLoki.server.close();
    testServerFile.server.close();
    db_loki.delete();
    db_file.delete();
  });

  it('can stream metrics to the capture server', function(done) {
    canStreamMetrics(testServerFile, done);
  });
  it('can stream metrics to the capture server', function(done) {
    canStreamMetrics(testServerLoki, done);
  });

  function canStreamMetrics(the_server, done){
    const target = capture.Target.create(metrics.merge, the_server.endpoint, 500, { project_key: 'my-project-key' });
    const client = capture.client.create(the_server.endpoint);
    const x = metrics.sample({ x: { value : 25 } });

    function doASample(when) {
      setTimeout(() => {
        target.receiver().tag(metrics.tags.generic('everything','everything')).receive(x);
      }, when);
    }

    doASample(0);
    doASample(50);
    doASample(100);
    doASample(150);
    doASample(200);
    doASample(250);
    doASample(300);
    doASample(350);
    doASample(1500);

    delay(1000)
      .then(() => client.getMetrics({ project_key: 'my-project-key' }))
      .then(json => {
        expect(json.tags.everything.everything.values.x.$avg.avg).toBe(25);
        expect(json.tags.everything.everything.values.x.$avg.size).toBe(8);
      })
      .then(() => delay(3000))
      .then(() => {
        expect(target.get()).toBe(null);
      })
      .then(() => client.getMetrics({ project_key: 'my-project-key' }))
      .then(json => {
        expect(json.tags.everything.everything.values.x.$avg.avg).toBe(25);
        expect(json.tags.everything.everything.values.x.$avg.size).toBe(9);
        done();
      }).catch(done.fail);
  }
});

