'use strict';

const metrics = require('legion-metrics');
const capture = require('../src/index');
const delay = require('promise-delay');

const db = require('../src/loki-storage').create();
//const db = require('../src/file-storage').create();
const server = capture.server.create(db);

describe('The capturing metrics Target', function() {
  beforeEach(function() {
    this.port = 4312;
    this.server = server.listen(this.port);
    this.endpoint = 'http://localhost:' + this.port;
  });

  afterEach(function() {
    this.server.close();
  });

  it('can stream metrics to the capture server', function(done) {
    const target = capture.Target.create(metrics.merge, this.endpoint, 500, { project_key: 'my-project-key' });
    const client = capture.client.create(this.endpoint);
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
  });
});

