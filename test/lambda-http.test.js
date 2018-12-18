let _ = require('lodash-firecloud').default;

let {
  LambdaHttp
} = require('../');

/* eslint-disable jest/no-test-callback */
describe('instance of LambdaHttp', function() {
  it('createServer automatically returns by default with 200, no headers, and no body', function(done) {
    let e = {};
    let ctx = {};

    let cb = function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(200);
      // eslint-disable-next-line jest/prefer-strict-equal
      expect(jsonRes.headers).toEqual({});
      expect(jsonRes.body).toBe('');

      done();
    };

    let http = new LambdaHttp(e, ctx, cb);
    http.createServer(function(_req, res) {
      res.end();
    });
  });
});
