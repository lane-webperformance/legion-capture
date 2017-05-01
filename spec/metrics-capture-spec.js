'use strict';

const capture = require('../src/index');
const metrics = require('legion-metrics');
const fetch = require('node-fetch');

const db_file = require('../src/file-storage').create('captured-data-files');
const db_loki = require('../src/loki-storage').create();
const server_file = capture.server.create(db_file);
const server_loki = capture.server.create(db_loki);

let testServerFile = {port: 0, server: '', endpoint: ''};
let testServerLoki = {port: 0, server: '', endpoint: ''};

describe('The legion-capture server', function () {
  beforeEach(function () {
    db_loki.delete();
    testServerFile.port = 4312;
    testServerFile.server = server_file.listen(testServerFile.port);
    testServerFile.endpoint = 'http://localhost:' + testServerFile.port;

    testServerLoki.port = 4313;
    testServerLoki.server = server_loki.listen(testServerLoki.port);
    testServerLoki.endpoint = 'http://localhost:' + testServerLoki.port;
  });

  afterEach(function () {
    testServerLoki.server.close();
    testServerFile.server.close();
    db_loki.delete();
    db_file.delete();
  });
  it('Loki can POST a blob of metrics and then GET them back', function (done) {
    testPostAndReadBlob(testServerLoki, done);
  });

  it('File can POST a blob of metrics and then GET them back', function (done) {
    testPostAndReadBlob(testServerFile, done);
  });

  function testPostAndReadBlob(the_server, done) {
    const x = metrics.sample({x: {value: 25}});
    const legion_client = capture.client.create(the_server.endpoint);

    legion_client.postMetrics(x, {project_key: 'my-project-key', min_timestamp: 1000, max_timestamp: 2000}).then(() => {
      return legion_client.getMetrics({project_key: 'my-project-key'});
    }).then(json => {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(1);
      done();
    }).catch(done.fail);
  }

  it('Loki can GET a null blob of metrics from an uninitialized project_key', function (done) {
    testNullBlob(testServerLoki, done);
  });

  it('File can GET a null blob of metrics from an uninitialized project_key', function (done) {
    testNullBlob(testServerFile, done);
  });

  function testNullBlob(the_server, done) {
    const legion_client = capture.client.create(the_server.endpoint);

    legion_client.getMetrics({project_key: 'my-project-key'}).then(json => {
      expect(json).toEqual(null);
      done();
    }).catch(done.fail);
  }
  it('Loki can accept a POST of a blob of metrics', function (done) {
    testPostBlob(testServerLoki, done);
  });
  it('File can accept a POST of a blob of metrics', function (done) {
    testPostBlob(testServerFile, done);
  });

  function testPostBlob(the_server, done) {
    const x = metrics.sample({x: {value: 25}});
    const legion_client = capture.client.create(the_server.endpoint);

    legion_client.postMetrics(x, {project_key: 'my-project-key', min_timestamp: 1000, max_timestamp: 2000})
          .then(done)
          .catch(done.fail);
  }

  it('Loki can POST a lot of blobs of metrics and then GET them back', function (done) {
    testMultiPostBlob(testServerLoki, done);
  });
  it('File can POST a lot of blobs of metrics and then GET them back', function (done) {
    testMultiPostBlob(testServerFile, done);
  });

  function testMultiPostBlob(the_server, done) {
    const x = metrics.sample({x: {value: 25}});
    const legion_client = capture.client.create(the_server.endpoint);
    const post = () => legion_client.postMetrics(x, {
      project_key: 'my-project-key',
      min_timestamp: 1000,
      max_timestamp: 2000
    });

    Promise.all([post(), post(), post(), post(), post()]).then(() => {
      return legion_client.getMetrics({project_key: 'my-project-key'});
    }).then(json => {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(5);
      done();
    }).catch(done.fail);
  }
  it('Loki can POST a lot of idempotent blobs of metrics and then GET only one back', function (done) {
    testIdempotent(testServerLoki, done);
  });
  it('File can POST a lot of idempotent blobs of metrics and then GET only one back', function (done) {
    testIdempotent(testServerFile, done);
  });

  function testIdempotent(the_server, done) {
    const x = metrics.sample({x: {value: 25}});
    const legion_client = capture.client.create(the_server.endpoint);
    const post = () => legion_client.postMetrics(x, {
      project_key: 'my-project-key',
      min_timestamp: 1000,
      max_timestamp: 2000,
      unique_id: 'the-same-id-every-time'
    });

    Promise.all([post(), post(), post(), post(), post()]).then(() => {
      return legion_client.getMetrics({project_key: 'my-project-key'});
    }).then(json => {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(1);
      done();
    }).catch(done.fail);

  }

  it('Loki validates responses that should be empty', function (done) {
    testEmptyResponses(testServerLoki, done);
  });
  it('File validates responses that should be empty', function (done) {
    testEmptyResponses(testServerFile, done);
  });

  function testEmptyResponses(the_server, done) {
    const legion_client = capture.client.create(the_server.endpoint);

    try
    {
      legion_client.validate204Response({
        ok: true,
        status: 200,
        statusText: 'OK'
      }, 'expected failure', 'VALIDATE204RESPONSE');
      done.fail();
    } catch (e)
    {
      expect(e.message).toContain('expected failure');
      expect(e.message).toContain('VALIDATE204RESPONSE');
      done();
    }
  }

  it('Loki validates responses that should contain JSON', function (done) {
    testValidateJson(testServerLoki, done);
  });
  it('File validates responses that should contain JSON', function (done) {
    testValidateJson(testServerFile, done);
  });

  function testValidateJson(the_server, done) {
    const legion_client = capture.client.create(the_server.endpoint);

    try
    {
      legion_client.validate200Response({
        ok: true,
        status: 200,
        statusText: 'OK'
      }, '{ "status": "expected failure", "reason": "for testing reasons" }', 'VALIDATE200RESPONSE');
      done.fail();
    } catch (e)
    {
      expect(e.message).toContain('expected failure');
      expect(e.message).toContain('for testing reasons');
      expect(e.message).toContain('VALIDATE200RESPONSE');
      done();
    }
  }
  it('Loki rejects POSTS without a project key', function (done) {
    testPOSTwithoutKey(testServerLoki, done);
  });
  it('File rejects POSTS without a project key', function (done) {
    testPOSTwithoutKey(testServerFile, done);
  });

  function testPOSTwithoutKey(the_server, done) {
    console.error('We\'re about to intentionally provoke an error due to a missing project_key field:');  // eslint-disable-line no-console
    fetch(the_server.endpoint + '/metrics', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({data: {foo: 2}})
    }).then(res => {
      expect(res.ok).toBe(false);
      done();
    }).catch(done.fail);
  }
  it('Loki rejects nonsense POSTS', function (done) {
    testRejectNonesense(testServerLoki, done);
  });
  it('File rejects nonsense POSTS', function (done) {
    testRejectNonesense(testServerFile, done);
  });

  function testRejectNonesense(the_server, done) {
    fetch(the_server.endpoint + '/metrics', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(24)
    }).then(res => {
      expect(res.ok).toBe(false);
      done();
    }).catch(done.fail);
  }
});

