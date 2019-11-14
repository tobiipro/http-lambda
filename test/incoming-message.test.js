import _ from 'lodash-firecloud';

import {
  IncomingMessage
} from '../src';

let connection = {
  destroy: _.noop
};
let ctx = {};

describe('instance of IncomingMessage', function() {
  it('retains ctx', function() {
    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    expect(req.ctx).toBe(ctx);
  });

  it('emulates HTTP/1.1', function() {
    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    expect(req.httpVersionMajor).toBe(1);
    expect(req.httpVersionMinor).toBe(1);
    expect(req.httpVersion).toBe('1.1');
  });

  it('turns chunked encoding off', function() {
    let e = {};

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    expect(req.chunkedEncoding).toBe(false);
  });

  it('sets url', function() {
    let e = {
      path: 'https://example.com',
      queryStringParameters: {
        foo: '123',
        bar: '456'
      }
    };

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    expect(req.url).toBe('https://example.com?foo=123&bar=456');
  });

  it('sets lowercase headers', function() {
    let e = {
      headers: {
        Foo: '123',
        bAR: [
          '456',
          '789'
        ],
        baz: true
      }
    };

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    expect(req.headers).toStrictEqual({
      'content-length': '0',
      foo: '123',
      bar: [
        '456',
        '789'
      ],
      baz: true
    });
  });

  it('sets content-length headers', function() {
    let e = {
      body: '1'
    };

    // @ts-ignore
    let req = new IncomingMessage(connection, e, ctx);
    expect(req.headers).toStrictEqual({
      'content-length': '1'
    });
  });
});
