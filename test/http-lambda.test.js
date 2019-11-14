import _ from 'lodash-firecloud';

import {
  httpLambda
} from '../src';

describe('httpLambda', function() {
  it('automatically returns by default with 200, no headers, and no body', async function() {
    let d = _.deferred();
    let e = {};
    let ctx = {};

    let cb = function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(200);
      expect(jsonRes.headers).toStrictEqual({});
      expect(jsonRes.body).toBe('');

      d.resolve();
    };

    let handler = httpLambda(function(http) {
      http.createServer(function(_req, res) {
        res.end();
      });
    });

    // @ts-ignore
    handler(e, ctx, cb);

    await d.promise;
  });
});
