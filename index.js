// /////////////////////////////////////////////////////////////////////////////
// Copyright 2016- Tobii AB
// Copyright 2016- AUTHORS
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// /////////////////////////////////////////////////////////////////////////////

let _ = require('lodash-firecloud').default;
let http = require('http');
let querystring = require('querystring');

/*
  e = {
    // path: "/test/hello",
    path: undefined,
    headers: {},
    // pathParameters: {"proxy": "hello"},
    pathParameters: {},
    requestContext: {
      accountId: undefined,
      resourceId: undefined,
      stage: undefined,
      requestId: undefined,
      identity: {},
      // resourcePath: "/{proxy+}",
      resourcePath: undefined,
      httpMethod: undefined,
      apiId: undefined
    },
    // resource: "/{proxy+}",
    resource: undefined,
    httpMethod: undefined,
    queryStringParameters: {},
    stageVariables: {}
  }

  ctx = {
    functionName: undefined,
    functionVersion: undefined,
    invokedFunctionArn: undefined,
    memoryLimitInMB: undefined,
    awsRequestId: undefined,
    logGroupName: undefined,
    logStreamName: undefined,
    identity: {},
    // From X-Amz-Client-Context (HTTP Request Header)
    // For inspiration see
    // http://docs.aws.amazon.com/mobileanalytics/latest/ug/PutEvents.html
    clientContext: {},
    // LAMBDA-HTTP CUSTOM
    // e.stageVariables + process.env
    env: {}
  }

  identity = {
    cognitoIdentityPoolId: undefined,
    accountId: undefined,
    cognitoIdentityId: undefined,
    caller: undefined,
    apiKey: undefined,
    sourceIp: undefined,
    cognitoAuthenticationType: undefined,
    cognitoAuthenticationProvider: undefined,
    userArn: undefined,
    userAgent: undefined,
    user: undefined
  }
*/

exports.LambdaHttp = class LambdaHttp {
  constructor(e = {}, ctx = {}, next = _.noop, options = {}) {
    _.defaultsDeep(options, {
      onUncaughtException: this._onUncaughtException.bind(this),
      onInternalServerError: this._onInternalServerError.bind(this)
    });

    // NOTE normalizing
    _.defaultsDeep(e, {
      pathParameters: {},
      requestContext: {
        identity: {}
      },
      queryStringParameters: {},
      stageVariables: {}
    });
    _.defaultsDeep(ctx, {
      clientContext: {},
      identity: {}
    });

    _.defaultsDeep(ctx, {
      env: e.stageVariables,
      requestContext: e.requestContext
    }, {
      env: process.env
    });

    this._e = e;
    this._ctx = ctx;
    this._next = next;
    this._options = options;

    process.on('uncaughtException', options.onUncaughtException);

    this._connection = {
      destroy: _.noop
    };
    this._req = new exports.IncomingMessage(this._connection, e, ctx);
    this._res = new exports.ServerResponse(this._req, ctx, function() {
      process.removeListener('uncaughtException', options.onUncaughtException);
      // eslint-disable-next-line fp/no-arguments
      next(...arguments);
    });

    _.merge(this, _.pick(http, [
      'METHODS',
      'STATUS_CODES'
    ]));

    return this;
  }

  createServer(fun) {
    try {
      fun(this._req, this._res);
    } catch (err) {
      this._ctx.callbackWaitsForEmptyEventLoop = false;

      this._next(undefined, this._options.onInternalServerError(err));
    }
  }

  _onUncaughtException(err) { // eslint-disable-line class-methods-use-this
    // eslint-disable-next-line no-console
    console.error(err);

    // default behavior for new nodejs is to process.exit
    process.nextTick(function() {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
  }

  _onInternalServerError(err) {
    // eslint-disable-next-line no-console
    console.error(err);
    let instance =
        `${this._ctx.invokedFunctionArn}#request:${this._ctx.awsRequestId}`;

    return {
      statusCode: 500,
      // API Gateway doesn't support statusMessage (yet)
      // statusMessage: http.STATUS_CODES[500]
      headers: {
        'content-type': 'application/problem+json'
      },
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        instance,
        renderer: 'lambda-http'
      })
    };
  }
};

exports.IncomingMessage = class IncomingMessage extends http.IncomingMessage {
  constructor(socket, e, ctx) {
    super(socket);
    this.httpVersionMajor = 1;
    this.httpVersionMinor = 1;
    this.httpVersion = '1.1';
    this.chunkedEncoding = false;
    this._removedHeader = {
      'transfer-encoding': true
    };

    let query = _.defaultTo(e.queryStringParameters, {});
    query = querystring.stringify(query);
    query = query.length ? `?${query}` : query;
    this.method = e.httpMethod;
    this.url = `${e.path}${query}`;
    this.headers = _.cloneDeep(e.headers);
    this.headers = _.mapKeys(this.headers, function(_value, key) {
      return _.toLower(key);
    });
    this.headers['content-length'] = (e.body || '').length;
    this.body = e.body;
    this.ctx = ctx;
  }
};

exports.ServerResponse = class ServerResponse extends http.ServerResponse {
  constructor(req, ctx, next) {
    super(req);
    this._body = Buffer.from('');

    this.ctx = ctx;
    this._next = next;

    // NOTE express sets the __proto__ to http.ServerResponse
    _.forEach([
      '_writeRaw',
      'addTrailers',
      'end',
      'writeHead'
    ], (method) => {
      // eslint-disable-next-line no-proto
      this[method] = this.__proto__[method].bind(this);
    });
  }

  _writeRaw(data, encoding, _callback) {
    if (_.isFunction(encoding)) {
      _callback = encoding;
      encoding = undefined;
    }

    if (_.isBuffer(data)) {
      this._body = Buffer.concat([this._body, data]);
    } else if (_.isString(data)) {
      this._body = Buffer.concat([this._body, Buffer.from(data, encoding)]);
    } else {
      throw new Error('ServerResponse._writeRaw expects Buffer or string');
    }
  }

  addTrailers(_headers) { // eslint-disable-line class-methods-use-this
    // not supported
  }

  end(data, encoding) {
    super.end(data, encoding);
    this._next(undefined, {
      statusCode: this.statusCode,
      // API Gateway doesn't support statusMessage (yet)
      // statusMessage: this.statusMessage,
      // API Gateway doesn't support multiple headers (yet)
      // case #1951724541
      headers: _.mapValues(this._headers, function(header) {
        if (_.isArray(header)) {
          header = header.join(', ');
        }

        return header;
      }),
      body: this._body.toString()
      // body: this._contentLength ? this._body.toString() : undefined // FIXME
    });
  }

  writeHead(statusCode, reason, obj) {
    super.writeHead(statusCode, reason, obj);
    // we want this._body to be just the body on this.end
    this._header = '';
  }
};

exports.httpLambda = function(fn, options) {
  return function(...args) {
    try {
      let lambdaHttp = new exports.LambdaHttp(...args, options);
      fn(lambdaHttp, ...args);
    } catch (err) {
      let [,, next] = args;
      return next(err);
    }
  };
};
