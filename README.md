
Legion Capture
--------------

Legion-capture is a library, and executable, that captures statistical
data from external sources. This package contains both the client
and server components.

	capture = require('legion-capture');

Reference
---------

### capture.client

The client API.

#### capture.client.create(endpoint)

Create a client.

 * endpoint - the URL of the capture server

#### capture.client.prototype.getMetrics(filter)

Get a statistical summary of all metrics that satisfy the given filter.

 * filter - a query filter with the following fields:
   * projectKey - the unique identifier for a project

#### capture.client.prototype.postMetrics(projectKey, sample)

Post a new metrics item to the capture server. A metrics item is an object that
supports the summarize() method, such as the objects created by sample()
or problem() in the legion-metrics library.

 * projectKey - the unique identifier for a project
 * sample - a summarizable metrics sample object

### capture.server

The server API.

#### capture.server.metrics()

Returns an Express.js middleware which responds to requests to 'metrics/'.
This middleware requires [body-parser](https://www.npmjs.com/package/body-parser).

#### capture.server.listen(...)

Starts the capture server. Accepts the same parameters as .listen() on any express app.
