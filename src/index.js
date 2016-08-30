import _ from 'lodash';
import bunyan from 'bunyan';
import http from 'http';
import pkg from '../package.json';

/*
 ctx = {
 functionName: undefined,
 functionVersion: undefined,
 invokedFunctionArn: undefined,
 memoryLimitInMB: undefined,
 awsRequestId: undefined,
 logGroupName: undefined,
 logStreamName: undefined,
 identity: undefined,
 // From X-Amz-Client-Context (HTTP Request Header)
 // For inspiration see
 // http://docs.aws.amazon.com/mobileanalytics/latest/ug/PutEvents.html
 clientContext: undefined
 }
 */

export let LambdaHttp = class LambdaHttp {
  constructor(e = {}, ctx = {}, next = _.noop, options) {
    options = options || {
      noLogger: false,
      ignoreUncaughtException: false,
      onInternalServerError: this._onInternalServerError
    };

    this._pkg = pkg;
    this._e = e;
    this._ctx = ctx;
    this._next = next;
    this._options = options;

    if (!options.noLogger) {
      this._createLogger();
    }

    if (!options.ignoreUncaughtException) {
      process.on('uncaughtException', this._onUncaughtException.bind(this));
    }

    this._onInternalServerError = options.onInternalServerError;

    // NOTE normalizing; AWS prefers clientContext to be null, not undefined
    ctx.clientContext = ctx.clientContext || undefined;

    this._connection = {destroy: _.noop};
    this._req = new exports.IncomingMessage(this._connection, e, ctx, this.log);
    this._res = new exports.ServerResponse(this._req, ctx, this.log, next);
    return this;
  }

  createServer(fun) {
    try {
      fun(this._req, this._res);
    } catch (err) {
      if (this.log) {
        this.log.error({err});
      }
      this._next(null, this._onInternalServerError(err));
    }
  }

  _createLogger() {
    // TODO do not allow clientContext.env.LOG_LEVEL to be lower than
    // process.env.LOG_LEVEL
    let level = _.get(this._ctx, 'clientContext.env.LOG_LEVEL') ||
          process.env.LOG_LEVEL;
    this.log = bunyan.createLogger({
      name: this._pkg.name,
      serializers: bunyan.stdSerializers,
      src: true,
      req_id: this._ctx.awsRequestId,
      // TODO add https://github.com/qualitybath/bunyan-slack
      streams: [{
        stream: process.stdout,
        level
      }]
    });
  }

  _onUncaughtException(err) {
    if (this.log) {
      this.log.error({err});
    }
    process.nextTick(function() {
      process.exit(1); // eslint-disable-line no-process-exit
    });
  }

  _onInternalServerError(err) {
    if (this.log) {
      this.log.error({err});
    }
    let instance =
          `${this._ctx.invokedFunctionArn}#request:${this._ctx.awsRequestId}`;
    return {
      statusCode: 500,
      statusMessage: http.STATUS_CODES[500],
      headers: {
        'content-type': 'application/problem+json'
      },
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        instance
      })
    };
  }
};

export class IncomingMessage extends http.IncomingMessage {
  constructor(socket, e, ctx, log) {
    super(socket);
    this.httpVersionMajor = 1;
    this.httpVersionMinor = 1;
    this.httpVersion = '1.1';

    this.method = e.method;
    this.url = e.url;
    this.headers = e.headers;
    this.body = e.body;
    this.ctx = ctx;
    this.log = log;
  }
}

export class ServerResponse extends http.ServerResponse {
  constructor(req, ctx, log, next) {
    super(req);
    this._body = Buffer.from('');

    this.ctx = ctx;
    this.log = log;
    this._next = next;

    // NOTE express sets the __proto__ to http.ServerResponse
    _.forEach(['_writeRaw', 'end'], (method) => {
      this[method] = this.__proto__[method].bind(this); // eslint-disable-line no-proto
    });
  }

  _writeRaw(data, encoding, _callback) {
    if (_.isFunction(encoding)) {
      _callback = encoding;
      encoding = null;
    }

    if (_.isBuffer(data)) {
      this._body = Buffer.concat([this._body, data]);
    } else if (_.isString(data)) {
      this._body = Buffer.concat([this._body, Buffer.from(data, encoding)]);
    } else {
      throw new Error('ServerResponse._writeRaw expects Buffer or string');
    }
  }

  end(data, encoding) {
    super.end(data, encoding);
    this._next(null, {
      statusCode: this.statusCode,
      statusMessage: this.statusMessage,
      headers: this._headers,
      body: this._body.toString()
    });
  }
}

export let httpLambda = function(fn, options) {
  return function(...args) {
    try {
      let lambdaHttp = new LambdaHttp(...args, options);
      fn(lambdaHttp, ...args);
    } catch (err) {
      let [,, next] = args;
      return next(err);
    }
  };
};
