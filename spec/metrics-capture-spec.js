'use strict';

const capture = require('../src/index');
const metrics = require('legion-metrics');
const fetch = require('node-fetch');

const db = require('../src/file-storage').create();
//const db = require('../src/loki-storage').create();
const server = capture.server.create(db);

describe('The legion-capture server', function ()
{
  beforeEach(function ()
  {
    this.port = 4312;
    this.server = server.listen(this.port);
    this.endpoint = 'http://localhost:' + this.port;
  });

  afterEach(function ()
  {
    this.server.close();
    db.delete();
  });

  it('can POST a blob of metrics and then GET them back', function (done)
  {
    const x = metrics.sample({x: {value: 25}});

    const legion_client = capture.client.create(this.endpoint);

    legion_client.postMetrics(x, {project_key: 'my-project-key', min_timestamp: 1000, max_timestamp: 2000}).then(() =>
    {
      return legion_client.getMetrics({project_key: 'my-project-key'});
    }).then(json =>
    {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(1);
      done();
    }).catch(done.fail);
  });

  it('can GET a null blob of metrics from an uninitialized project_key', function (done)
  {
    const legion_client = capture.client.create(this.endpoint);

    legion_client.getMetrics({project_key: 'my-project-key'}).then(json =>
    {
      expect(json).toEqual(null);
      done();
    }).catch(done.fail);
  });

  it('can accept a POST of a blob of metrics', function (done)
  {
    const x = metrics.sample({x: {value: 25}});
    const legion_client = capture.client.create(this.endpoint);

    legion_client.postMetrics(x, {project_key: 'my-project-key', min_timestamp: 1000, max_timestamp: 2000})
          .then(done)
          .catch(done.fail);
  });


  it('can POST a lot of blobs of metrics and then GET them back', function (done)
  {
    const x = metrics.sample({x: {value: 25}});
    const legion_client = capture.client.create(this.endpoint);
    const post = () => legion_client.postMetrics(x, {
      project_key: 'my-project-key',
      min_timestamp: 1000,
      max_timestamp: 2000
    });

    Promise.all([post(), post(), post(), post(), post()]).then(() =>
    {
      return legion_client.getMetrics({project_key: 'my-project-key'});
    }).then(json =>
    {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(5);
      done();
    }).catch(done.fail);
  });

  it('can POST a lot of idempotent blobs of metrics and then GET only one back', function (done)
  {
    const x = metrics.sample({x: {value: 25}});
    const legion_client = capture.client.create(this.endpoint);
    const post = () => legion_client.postMetrics(x, {
      project_key: 'my-project-key',
      min_timestamp: 1000,
      max_timestamp: 2000,
      unique_id: 'the-same-id-every-time'
    });

    Promise.all([post(), post(), post(), post(), post()]).then(() =>
    {
      return legion_client.getMetrics({project_key: 'my-project-key'});
    }).then(json =>
    {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(1);
      done();
    }).catch(done.fail);
  });

  it('validates responses that should be empty', function (done)
  {
    const legion_client = capture.client.create(this.endpoint);

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
  });

  it('validates responses that should contain JSON', function (done)
  {
    const legion_client = capture.client.create(this.endpoint);

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
  });

  it('rejects POSTS without a project key', function (done)
  {
    console.error('We\'re about to intentionally provoke an error due to a missing project_key field:');  // eslint-disable-line no-console
    fetch(this.endpoint + '/metrics', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({data: {foo: 2}})
    }).then(res =>
    {
      expect(res.ok).toBe(false);
      done();
    }).catch(done.fail);
  });

  it('rejects nonsense POSTS', function (done)
  {
    fetch(this.endpoint + '/metrics', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(24)
    }).then(res =>
    {
      expect(res.ok).toBe(false);
      done();
    }).catch(done.fail);
  });
});
