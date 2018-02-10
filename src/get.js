'use strict';

class GetBy {
  constructor(client) {
    this._client = client;
  }

  byMinutes(query) {
    const result = {
      all: null,
      minutes: []
    };
   
    result.all = this._client.getMetrics(Object.assign({}, query, { minutes: false}));

    let accum_await = result.all;

    // TODO: replace this mess with async/await
    // Note that we intentionally request metrics in sequence, as a simple minimal self-throttling behavior
    const ready = accum_await.then(all => {
      const begin = Math.floor(all.metadata.min_timestamp / 60000);
      const end = Math.ceil(all.metadata.max_timestamp / 60000);

      let i = 0;
      accum_await = result.all;
      for( let minutes = begin; minutes <= end; minutes++ ) {
        accum_await = accum_await.then(() => this._client.getMetrics(Object.assign({}, query, { minutes })));
        result.minutes[i] = accum_await;
        i += 1;
      }
    });

    return ready.then(() => result);
  }
}

module.exports = function(client) {
  return new GetBy(client);
};
