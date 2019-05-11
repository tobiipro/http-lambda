let _ = require('lodash-firecloud');

let {
  httpLambda
} = require('../');

/* eslint-disable jest/no-test-callback */
describe('httpLambda', function() {
  it('automatically returns by default with 200, no headers, and no body', function(done) {
    let e = {};
    let ctx = {};

    let cb = function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(200);
      expect(jsonRes.headers).toStrictEqual({});
      expect(jsonRes.body).toBe('');

      done();
    };

    let handler = httpLambda(function(http, _e, _ctx) {
      http.createServer(function(_req, res) {
        res.end();
      });
    });

    handler(e, ctx, cb);
  });
});
