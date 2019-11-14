import _ from 'lodash-firecloud';

import {
  IncomingMessage,
  ServerResponse
} from '../src';

let connection = {
  destroy: _.noop
};
let ctx = {};

describe('instance of ServerResponse', function() {
  it('retains ctx', function() {
    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    // @ts-ignore
    let res = new ServerResponse(req, ctx, _.noop);
    expect(res.ctx).toBe(ctx);
  });

  it('returns by default with 200, no headers, and no body', async function() {
    let d = _.deferred();
    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    // @ts-ignore
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(200);
      expect(jsonRes.headers).toStrictEqual({});
      expect(jsonRes.body).toBe('');

      d.resolve();
    });
    res.end();

    await d.promise;
  });

  it('can return a modified statusCode', async function() {
    let d = _.deferred();
    let statusCode = 201;
    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    // @ts-ignore
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.statusCode).toBe(statusCode);

      d.resolve();
    });
    res.statusCode = statusCode;
    res.end();

    await d.promise;
  });

  it('can return modified headers', async function() {
    let d = _.deferred();
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

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    // @ts-ignore
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      _.forEach(headers, function(value, name) {
        if (_.isArray(value)) {
          value = _.join(value, ', ');
        }
        value = _.toString(value);

        expect(jsonRes.headers[name]).toStrictEqual(value);
      });

      d.resolve();
    });
    _.forEach(headers, function(value, name) {
      res.setHeader(name, value);
    });
    res.end();

    await d.promise;
  });

  it('can return modified statusCode and headers via writeHead', async function() {
    let d = _.deferred();
    let headers = {
      static: 'foo',
      dynamic: 'bar' // writeHead will change it to ba
    };
    let writeHeaders = {
      dynamic: 'baz'
    };

    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    // @ts-ignore
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      _.forEach(_.merge({}, headers, writeHeaders), function(value, name) {
        expect(jsonRes.headers[name]).toStrictEqual(value);
      });

      expect(jsonRes.headers.dynamic).toStrictEqual('baz');

      d.resolve();
    });
    _.forEach(headers, function(value, name) {
      res.setHeader(name, value);
    });
    res.writeHead(200, writeHeaders);
    res.end();

    await d.promise;
  });

  it('can return modified body (sent as string)', async function() {
    let d = _.deferred();
    let body = 'test';

    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    // @ts-ignore
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.body).toStrictEqual(body);

      d.resolve();
    });
    res.end(body);

    await d.promise;
  });

  it('can return modified body (sent as Buffer)', async function() {
    let d = _.deferred();
    let body = Buffer.from('test');

    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    // @ts-ignore
    let res = new ServerResponse(req, ctx, function(_err, jsonRes) {
      expect(jsonRes.body).toStrictEqual(_.toString(body));

      d.resolve();
    });
    res.end(body);

    await d.promise;
  });
});
