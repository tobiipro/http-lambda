let _ = require('lodash-firecloud');
let originalHttp = require('http');

let {
  LambdaHttp
} = require('../');

describe('instance of LambdaHttp', function() {
  // eslint-disable-next-line jest/no-test-callback
  it('createServer automatically returns by default with 200, no headers, and no body', function(done) {
    let e = {};
    let ctx = {};

    let cb = function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(200);
      expect(jsonRes.headers).toStrictEqual({});
      expect(jsonRes.body).toBe('');

      done();
    };

    let http = new LambdaHttp(e, ctx, cb);
    http.createServer(function(_req, res) {
      res.end();
    });
  });

  // eslint-disable-next-line jest/no-test-callback
  it('merges stagesVariables and process.env vars in ctx.env', function(done) {
    let e = {
      stageVariables: {
        PATH: 'true'
      }
    };
    let ctx = {};

    let cb = function(_err, _jsonRes) {
      done();
    };

    let http = new LambdaHttp(e, ctx, cb);
    http.createServer(function(req, res) {
      let ctxEnv = _.defaultsDeep({}, e.stageVariables, process.env);

      expect(req.ctx.env).toStrictEqual(ctxEnv);
      expect(res.ctx.env).toStrictEqual(ctxEnv);
      res.end();
    });
  });

  // eslint-disable-next-line jest/no-test-callback
  it('makes ctx.requestContext equal to e.requestContext for convenience', function(done) {
    let e = {
      requestContext: {
        foo: 'bar'
      }
    };
    let ctx = {};

    let cb = function(_err, _jsonRes) {
      done();
    };

    let http = new LambdaHttp(e, ctx, cb);
    http.createServer(function(req, res) {
      expect(req.ctx.requestContext).toStrictEqual(e.requestContext);
      expect(res.ctx.requestContext).toStrictEqual(e.requestContext);
      res.end();
    });
  });

  it('exposes http.METHODS and http.STATUS_CODES', function() {
    let e = {};
    let ctx = {};

    let http = new LambdaHttp(e, ctx, _.noop);
    // eslint-disable-next-line jest/prefer-strict-equal
    expect(http.METHODS).toEqual(originalHttp.METHODS);
    // eslint-disable-next-line jest/prefer-strict-equal
    expect(http.STATUS_CODES).toEqual(originalHttp.STATUS_CODES);
  });
});
