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

/* eslint-disable max-classes-per-file */

import _ from 'lodash-firecloud';
// eslint-disable-next-line import/no-unresolved
import awsLambda from 'aws-lambda';
import http from 'http';
import net from 'net';
import querystring from 'querystring';

import {
  MaybePromise
} from 'lodash-firecloud/types';

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
*/
type Event = awsLambda.APIGatewayEvent;

/*
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
type Context = awsLambda.Context;

type Next = awsLambda.Callback<awsLambda.APIGatewayProxyResult>;

type LambdaHttpHandler = (
  http: LambdaHttp,
  e: Event,
  ctx: Context,
  next: Next
) => MaybePromise<void>;

type Options = {
  onUncaughtException?: NodeJS.UncaughtExceptionListener,
  onUnhandledRejection?: NodeJS.UnhandledRejectionListener,
  onInternalServerError?: () => void
};

export class LambdaHttp {
  _e: Event;

  _ctx: awsLambda.Context;

  _next: Next;

  _options: Options;

  _connection: Partial<net.Socket>;

  _req: IncomingMessage;

  _res: ServerResponse;

  onUncaughtException: NodeJS.UncaughtExceptionListener;

  onUnhandledRejection: NodeJS.UnhandledRejectionListener;

  onInternalServerError: () => void;

  // eslint-disable-next-line max-params
  constructor(
    e: Event,
    ctx: awsLambda.Context,
    next: Next = _.noop.bind(_),
    options: Options = {}
  ) {
    _.defaults(options, {
      onUncaughtException: this._onUncaughtException.bind(this),
      onUnhandledRejection: this._onUnhandledRejection.bind(this),
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
    });

    _.defaultsDeep(ctx, {
      env: process.env
    });

    this._e = e;
    this._ctx = ctx;
    this._next = next;
    this._options = options;

    this.onInternalServerError = options.onInternalServerError;
    process.on('uncaughtException', options.onUncaughtException);
    process.on('unhandledRejection', options.onUnhandledRejection);

    this._connection = {
      destroy: function(_err?: Error) {
        // _.noop
      }
    };
    this._req = new IncomingMessage(this._connection, e, ctx);
    this._res = new ServerResponse(this._req, ctx, function(...args) {
      process.removeListener('uncaughtException', options.onUncaughtException);
      process.removeListener('unhandledRejection', options.onUnhandledRejection);
      next(...args);
    });

    _.merge(this, _.pick(http, [
      'METHODS',
      'STATUS_CODES'
    ]));

    return this;
  }

  createServer(requestListener: (req: IncomingMessage, res: ServerResponse) => void): void {
    // we simulate that a HTTP request was received as soon as the server was created
    requestListener(this._req, this._res);
  }

  _onUncaughtException(err: Error): void {
    // eslint-disable-next-line no-console
    console.error(err);

    this.onInternalServerError();
  }

  _onUnhandledRejection(reason: Error, p: Promise<unknown>): void {
    // eslint-disable-next-line no-console
    console.error(reason, p);

    this.onInternalServerError();
  }

  // eslint-disable-next-line class-methods-use-this
  _onInternalServerError(): void {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

export class IncomingMessage extends http.IncomingMessage {
  body: string | Buffer;

  ctx: awsLambda.Context;

  // eslint-disable-next-line max-params
  constructor(socket, e: Event, ctx: awsLambda.Context) {
    super(socket);
    this.httpVersionMajor = 1;
    this.httpVersionMinor = 1;
    this.httpVersion = '1.1';
    // @ts-ignore missing typing in http.IncomingMessage
    this.chunkedEncoding = false;
    // @ts-ignore missing typing in http.IncomingMessage
    this._removedHeader = {
      'transfer-encoding': true
    };

    let queryParameters = _.defaultTo(e.queryStringParameters, {});
    let query = querystring.stringify(queryParameters);
    query = query.length > 0 ? `?${query}` : query;
    this.method = e.httpMethod;
    this.url = `${e.path}${query}`;
    this.headers = _.cloneDeep(e.headers);
    this.headers = _.mapKeys(this.headers, function(_value, key) {
      return _.toLower(key);
    });
    this.headers['content-length'] = _.toString(_.defaultTo(e.body, '').length);
    // see https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    this.body = e.isBase64Encoded ? Buffer.from(e.body, 'base64') : e.body;
    this.ctx = ctx;
  }
}

type WriteRawCallback = (err?: Error) => void;

export class ServerResponse extends http.ServerResponse {
  _next: Next;

  _body: Buffer;

  _isBinary: boolean;

  ctx: awsLambda.Context;

  // eslint-disable-next-line max-params
  constructor(req: IncomingMessage, ctx: awsLambda.Context, next: Next) {
    super(req);
    this._body = Buffer.from('');

    this.ctx = ctx;
    this._next = next;
    this._isBinary = false;

    // NOTE express sets the __proto__ to http.ServerResponse
    _.forEach([
      '_writeRaw',
      'addTrailers',
      'end',
      'writeHead'
    ], (method) => {
      // @ts-ignore
      // eslint-disable-next-line no-proto
      this[method] = this.__proto__[method].bind(this);
    });
  }

  _writeRaw(data: Buffer, _callback?: WriteRawCallback): void;

  _writeRaw(data: Buffer, encoding: string, _callback?: WriteRawCallback): void;

  _writeRaw(data: Buffer, encodingOrCallback: string | WriteRawCallback, _callback?: WriteRawCallback): void {
    let encoding;
    if (_.isFunction(encodingOrCallback)) {
      _callback = encodingOrCallback;
      encoding = undefined;
    } else {
      encoding = encodingOrCallback;
    }

    // see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
    if (encoding === 'binary') {
      this._isBinary = true;
    }

    if (_.isBuffer(data)) {
      this._body = Buffer.concat([
        this._body,
        data
      ]);
    } else if (_.isString(data)) {
      this._body = Buffer.concat([
        this._body,
        Buffer.from(data, encoding)
      ]);
    } else {
      throw new Error('ServerResponse._writeRaw expects Buffer or string');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  addTrailers(_headers): void {
    // not supported
  }

  // @ts-ignore missing typing for http.OutgoingMessage.end
  end(data?: any, encoding?, _cb?: () => void): void {
    super.end(data, encoding);

    // API Gateway doesn't support multiple headers (yet)
    // case #1951724541
    // @ts-ignore missing typing for http.ServerResponse
    let headers = _.mapValues(this._headers, function(header) {
      // NOTE this is a very naïve "solution" since the semantics are header based,
      // while here we assume that all the values of a header MUST be joined by a comma
      if (_.isArray(header)) {
        header = header.join(', ');
      }

      return _.toString(header);
    });

    let body = this._body.toString(this._isBinary ? 'base64' : undefined);
    // FIXME
    // body = this._contentLength ? body : undefined;

    this._next(undefined, {
      // see https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
      isBase64Encoded: this._isBinary,
      statusCode: this.statusCode,
      // API Gateway doesn't support statusMessage (yet)
      // statusMessage: this.statusMessage || http.STATUS_CODES[this.statusCode],
      headers,
      body
    });
  }

  // @ts-ignore
  writeHead(statusCode: number, headers?: http.OutgoingHttpHeaders): this;

  // @ts-ignore
  writeHead(statusCode: number, reasonPhrase?: string, headers?: http.OutgoingHttpHeaders): this {
    super.writeHead(statusCode, reasonPhrase, headers);
    // we want this._body to be just the body on this.end
    // @ts-ignore missing typing for http.ServerResponse
    this._header = '';
    return this;
  }
}

export let httpLambda = function(lambdaHandler: LambdaHttpHandler, options?: Options) {
  return function(e: Event, ctx: awsLambda.Context, next: Next) {
    let lambdaHttp = new LambdaHttp(e, ctx, next, options);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    lambdaHandler(lambdaHttp, e, ctx, next);
  };
};
