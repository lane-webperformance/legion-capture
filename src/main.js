/* eslint-disable no-console */

'use strict';

const port = 8000;

require('./index').listen(port, function() {
  console.log('legion-capture listening on port ' + port + '.');
});
