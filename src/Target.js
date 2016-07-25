'use strict';

const client = require('./client');
const metrics = require('legion-metrics');
const delay = require('promise-delay');

module.exports.create = function(merge, endpoint, interval, metadata) {
  return metrics.Target.create(merge, captureMetrics(endpoint, interval, metadata));
};

/*
 * Grab the metrics out of the MetricsTarget and upload them to the endpoint.
 * Do it no more often than the 'interval' in milliseconds.
 */
function captureMetrics(endpoint, interval, metadata) {
  console.log('Streaming metrics to: ' + endpoint + ' every ' + interval + ' ms'); //eslint-disable-line no-console

  const endpoint_client = client.create(endpoint);
  let last_fork = 0;

  // The idea here is that we want to segment all of time into intervals,
  // each with a duration of 'interval' in milliseconds.
  // Each time we receive a new metric, if we have not already done so,
  // we schedule a collection event for the end of the current interval.
  //
  // In principle, insomuch as all machine's clocks are synchronized, this will
  // mean that we will capture the same intervals across all machines. This may
  // be beneficial during data analysis later.
  return metrics_target => {
    const now = Date.now();
    const start = getIntervalStart(now,interval);
    const end = getIntervalEnd(now,interval);
    const in_future = end - now;

    if( start <= last_fork )
      return Promise.resolve();

    // everything below this line is running at most once every 'interval' milliseconds

    last_fork = start;

    // Now we run on a delay, scheduling for the end of this interval.
    delay(in_future).then(() => {
      const summary = metrics_target.clear();
      return endpoint_client.postMetrics(metrics.summary(summary), Object.assign({}, metadata, { min_timestamp : start, max_timestamp : end }));
    }).catch(err => {
      console.error('problem reporting metrics ' + err);  //eslint-disable-line no-console
    });
  };
}

function getIntervalStart(current_time_ms, interval) {
  return Math.floor(current_time_ms/interval)*interval;
}

function getIntervalEnd(current_time_ms, interval) {
  return Math.ceil(current_time_ms/interval)*interval;
}
