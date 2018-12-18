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
      // eslint-disable-next-line jest/prefer-strict-equal
      expect(jsonRes.headers).toEqual({});
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

        // eslint-disable-next-line jest/prefer-strict-equal
        expect(jsonRes.headers[name]).toEqual(value);
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
        // eslint-disable-next-line jest/prefer-strict-equal
        expect(jsonRes.headers[name]).toEqual(value);
      });

      // eslint-disable-next-line jest/prefer-strict-equal
      expect(jsonRes.headers.dynamic).toEqual('baz');

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
      // eslint-disable-next-line jest/prefer-strict-equal
      expect(jsonRes.body).toEqual(body);

      done();
    });
    res.end(body);
  });

  it('can return modified body (sent as Buffer)', function(done) {
    let body = Buffer.from('test');

    let e = {};

    let req = new IncomingMessage(connection, e, ctx);
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      // eslint-disable-next-line jest/prefer-strict-equal
      expect(jsonRes.body).toEqual(_.toString(body));

      done();
    });
    res.end(body);
  });
});
