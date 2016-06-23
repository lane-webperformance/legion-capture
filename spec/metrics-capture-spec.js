'use strict';

const capture = require('../src/index');
const metrics = require('legion-metrics');

describe('The legion-capture server', function() {
  beforeEach(function() {
    this.port = 4312;
    this.server = capture.server.listen(this.port);
    this.endpoint = 'http://localhost:' + this.port;
  });

  afterEach(function() {
    this.server.close();
  });

  it('can accept a POST of a blob of metrics', function(done) {
    const x = metrics.sample({ x: { value : 25 } });
    const legion_client = capture.client.create(this.endpoint);

    legion_client.postMetrics('my-project-key', x)
      .then(done)
      .catch(done.fail);
  });

  it('can GET a null blob of metrics from an uninitialized projectKey', function(done) {
    const legion_client = capture.client.create(this.endpoint);

    legion_client.getMetrics({ projectKey: 'my-project-key' }).then(json => {
      expect(json).toEqual(null);
      done();
    }).catch(done.fail);
  });

  it('can POST a blob of metrics and then GET them back', function(done) {
    const x = metrics.sample({ x: { value : 25 } });

    const legion_client = capture.client.create(this.endpoint);

    legion_client.postMetrics('my-project-key', x).then(() => {
      return legion_client.getMetrics({ projectKey: 'my-project-key' });
    }).then(json => {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(1);
      done();
    }).catch(done.fail);
  });

  it('can POST a lot of blobs of metrics and then GET them back', function(done) {
    const x = metrics.sample({ x: { value : 25 } });
    const legion_client = capture.client.create(this.endpoint);
    const post = () => legion_client.postMetrics('my-project-key', x);

    Promise.all([post(),post(),post(),post(),post()]).then(() => {
      return legion_client.getMetrics({ projectKey: 'my-project-key' });
    }).then(json => {
      expect(json.values.x.$avg.avg).toBe(25);
      expect(json.values.x.$avg.size).toBe(5);
      done();
    }).catch(done.fail);
  });

  it('validates responses that should be empty', function(done) {
    const legion_client = capture.client.create(this.endpoint);

    try {
      legion_client.validate204Response({ ok: true, status: 200, statusText: 'OK' }, 'expected failure', 'VALIDATE204RESPONSE');
      done.fail();
    } catch(e) {
      expect(e.message).toContain('expected failure');
      expect(e.message).toContain('VALIDATE204RESPONSE');
      done();
    }
  });

  it('validates responses that should contain JSON', function(done) {
    const legion_client = capture.client.create(this.endpoint);

    try {
      legion_client.validate200Response({ ok: true, status: 200, statusText: 'OK' }, '{ "status": "expected failure", "reason": "for testing reasons" }', 'VALIDATE200RESPONSE');
      done.fail();
    } catch(e) {
      expect(e.message).toContain('expected failure');
      expect(e.message).toContain('for testing reasons');
      expect(e.message).toContain('VALIDATE200RESPONSE');
      done();
    }
  });
});

