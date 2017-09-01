
Legion Capture
--------------

Legion-capture is a library and executable that captures statistical
data from external sources. This package contains both the client
and server components.

	capture = require('legion-capture');

Reference
---------

### capture.client.loki

A loki.js implementation of a metrics database. Conforms to the same API as the capture.client.remote.

### capture.client.remote

The client API.

#### capture.client.remote.create(endpoint)

Create a client.

 * endpoint - the URL of the capture server

#### capture.client.remote.prototype.getMetrics(filter)

Get a statistical summary of all metrics that satisfy the given filter.

 * filter - a query filter with the following fields:
   * project\_key - the unique identifier for a project

Returns a promise containing:

 * data - the blob of metrics
 * metadata - various metadata, including:
   * project\_key - the unique identifier for a project
   * min\_timestamp - the starting timestamp of the metrics capture
   * max\_timestamp - the ending timestamp of the metrics capture

#### capture.client.remote.prototype.postMetrics(blob)

Post a new metrics item to the capture server.

 * blob - A JSON object containing:
   * data - the blob of metrics
   * metadata - various metadata, including:
     * project\_key - the unique identifier for a project
     * min\_timestamp - the starting timestamp of the metrics capture
     * max\_timestamp - the ending timestamp of the metrics capture

### capture.server

The server API.

#### capture.server.metrics()

Returns an Express.js middleware which responds to requests to 'metrics/'.
This middleware requires [body-parser](https://www.npmjs.com/package/body-parser).

#### capture.server.listen(...)

Starts the capture server. Accepts the same parameters as .listen() on any express app.

### capture.Target

The capturing Target is an instance of the metrics Target from
[legion-metrics](https://github.com/lane-webperformance/legion-metrics).
It adds the behavior to push metrics to a capture server at regular
intervals. As part of each push, the Target is 'clear()ed.' This means
that such a Target will only contain the metrics for the current
interval.

If you manually clear() a capturing Target, any metrics so cleared
will not be pushed to the capture server. Likewise, if you get()
the metrics from a capturing Target, you will only see the metrics
captured so far during the current interval.

#### capture.Target.create(merge, endpoint, interval)

Create a capturing metrics Target.

Metrics will be streamed to the endpoint at regular intervals.
Networking to the endpoint must be reliable, or data loss will
occur.

 * merge - the merge algorithm object, usually just require('legion-metrics').merge
 * endpoint - the URL of the metrics collection endpoint
 * interval - the collection interval in milliseconds




