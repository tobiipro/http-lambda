/* eslint-disable jest/prefer-strict-equal */
import LambdaHttp from '../src/lambda-http';
import _ from 'lodash-firecloud';
import originalHttp from 'http';

describe('instance of LambdaHttp', function() {
  it('createServer automatically returns by default with 200, no headers, and no body', async function() {
    let d = _.deferred();
    let e = {};
    let ctx = {};

    let cb = function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(200);
      expect(jsonRes.headers).toStrictEqual({});
      expect(jsonRes.body).toBe('');

      d.resolve();
    };

    // @ts-ignore
    let http = new LambdaHttp(e, ctx, cb);
    http.createServer(function(_req, res) {
      res.end();
    });

    await d.promise;
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

    // @ts-ignore
    let http = new LambdaHttp(e, ctx, cb);
    http.createServer(function(req, res) {
      let ctxEnv = _.defaultsDeep({}, e.stageVariables, process.env);

      // @ts-ignore
      expect(req.ctx.env).toStrictEqual(ctxEnv);
      // @ts-ignore
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

    // @ts-ignore
    let http = new LambdaHttp(e, ctx, cb);
    http.createServer(function(req, res) {
      // @ts-ignore
      expect(req.ctx.requestContext).toStrictEqual(e.requestContext);
      // @ts-ignore
      expect(res.ctx.requestContext).toStrictEqual(e.requestContext);
      res.end();
    });
  });

  it('exposes http.METHODS and http.STATUS_CODES', function() {
    let e = {};
    let ctx = {};

    // @ts-ignore
    let http = new LambdaHttp(e, ctx, _.noop);
    // @ts-ignore
    expect(http.METHODS).toEqual(originalHttp.METHODS);
    // @ts-ignore
    expect(http.STATUS_CODES).toEqual(originalHttp.STATUS_CODES);
  });
});
