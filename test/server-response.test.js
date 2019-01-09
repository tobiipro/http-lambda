let _ = require('lodash-firecloud').default;

let {
  IncomingMessage,
  ServerResponse
} = require('../');

let connection = {
  destroy: _.noop
};
let ctx = {};

/* eslint-disable jest/no-test-callback */
describe('instance of ServerResponse', function() {
  it('retains ctx', function() {
    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, _.noop);
    expect(res.ctx).toBe(ctx);
  });

  it('returns by default with 200, no headers, and no body', function(done) {
    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(200);
      expect(jsonRes.headers).toStrictEqual({});
      expect(jsonRes.body).toBe('');

      done();
    });
    res.end();
  });

  it('can return a modified statusCode', function(done) {
    let statusCode = 201;
    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(statusCode);

      done();
    });
    res.statusCode = statusCode;
    res.end();
  });

  it('can return modified headers', function(done) {
    let headers = {
      'x-array': [
        'true',
        'false'
      ],
      'x-boolean': true,
      'x-number': 0,
      'x-string': 'value'
    };

    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      _.forEach(headers, function(value, name) {
        if (_.isArray(value)) {
          value = _.join(value, ', ');
        }
        value = _.toString(value);

        expect(jsonRes.headers[name]).toStrictEqual(value);
      });

      done();
    });
    _.forEach(headers, function(value, name) {
      res.setHeader(name, value);
    });
    res.end();
  });

  it('can return modified statusCode and headers via writeHead', function(done) {
    let headers = {
      static: 'foo',
      dynamic: 'bar' // writeHead will change it to ba
    };
    let writeHeaders = {
      dynamic: 'baz'
    };

    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      _.forEach(_.merge({}, headers, writeHeaders), function(value, name) {
        expect(jsonRes.headers[name]).toStrictEqual(value);
      });

      expect(jsonRes.headers.dynamic).toStrictEqual('baz');

      done();
    });
    _.forEach(headers, function(value, name) {
      res.setHeader(name, value);
    });
    res.writeHead(200, writeHeaders);
    res.end();
  });

  it('can return modified body (sent as string)', function(done) {
    let body = 'test';

    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.body).toStrictEqual(body);

      done();
    });
    res.end(body);
  });

  it('can return modified body (sent as Buffer)', function(done) {
    let body = Buffer.from('test');

    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.body).toStrictEqual(_.toString(body));

      done();
    });
    res.end(body);
  });
});
