'use strict';

class GetBy {
  constructor(client) {
    this._client = client;
  }

  async byMinutes(query) {
    const result = {
      all: null,
      minutes: []
    };
    
    result.all = await this._client.getMetrics(Object.assign({}, query, { minutes: false}));

    const begin = Math.floor(result.all.metadata.min_timestamp / 60000);
    const end = Math.ceil(result.all.metadata.max_timestamp / 60000);

    let i = 0;
    for( let minutes = begin; minutes <= end; minutes++ ) {
      result.minutes[i] = await this._client.getMetrics(Object.assign({}, query, { minutes }));
      i += 1;
    }

    return result;
  }
}

module.exports = function(client) {
  return new GetBy(client);
};
