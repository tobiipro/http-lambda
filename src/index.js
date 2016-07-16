import _ from 'lodash';
import bunyan from 'bunyan';
import http from 'http';
import pkg from '../package.json';

var staticEnv;
try {
    staticEnv = require('../.env.json');
} catch (_err) {
    staticEnv = {};
}

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

exports.LambdaHttp = class LambdaHttp {
    constructor([e = {}, ctx = {}, next = _.noop], options = {}) {
        this.log = this._createLogger(pkg, ctx);

        if (!options.noCatchUncaughtException) {
            process.on('uncaughtException', this._onUncaughtException.bind(this));
        }

        if (!options.noStaticEnv) {
            _.merge(process.env, staticEnv);
        }

        // NOTE normalizing; AWS prefers clientContext to be null, not undefined
        ctx.clientContext = ctx.clientContext || undefined;

        this._connection = {destroy: _.noop};
        this._req = new exports.IncomingMessage(this._connection, e, ctx, this.log);
        this._res = new exports.ServerResponse(this._req, ctx, this.log, next);
        return this;
    };

    createServer(fun) {
        try {
            fun(this._req, this._res);
        } catch (err) {
            this.log.error({err});
            next(null, {
                statusCode: 500,
                statusMessage: http.STATUS_CODES[500],
                headers: {
                    'content-type': 'application/problem+json'
                },
                body: JSON.stringify({
                    type: 'about:blank',
                    title: 'Internal Server Error',
                    status: 500,
                    instance: `${ctx.invokedFunctionArn || ctx.functionName}#request:${ctx.awsRequestId}`
                })
            });
        };
    };

    _createLogger(pkg, ctx) {
        return bunyan.createLogger({
            name: pkg.name,
            serializers: bunyan.stdSerializers,
            src: true,
            req_id: ctx.awsRequestId,
            // TODO add https://github.com/qualitybath/bunyan-slack
            streams: [{
                stream: process.stdout,
                level: _.get(ctx, 'clientContext.env.LOG_LEVEL') ||
                    process.env.LOG_LEVEL
            }]
        });
    };

    _onUncaughtException(err) {
        this.log.error({err});
        process.nextTicket(function() {
            process.exit(1);
        });
    };
};

exports.IncomingMessage = class IncomingMessage extends http.IncomingMessage {
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
};

exports.ServerResponse = class ServerResponse extends http.ServerResponse {
    constructor(req, ctx, log, next) {
        super(req);
        this._body = Buffer.from('');

        this.ctx = ctx;
        this.log = log;
        this._next = next;

        // NOTE express sets the __proto__ to http.ServerResponse
        _.forEach(['_writeRaw', 'end'], (method) => {
            this[method] = this.__proto__[method].bind(this);
        });
    };

    _writeRaw(data, encoding, callback) {
        if (_.isFunction(encoding)) {
            callback = encoding;
            encoding = null;
        }

        if (_.isBuffer(data)) {
            this._body = Buffer.concat([this._body, data]);
        } else if (_.isString(data)) {
            this._body = Buffer.concat([this._body, Buffer.from(data, encoding)]);
        } else {
            throw new Error('ServerResponse._writeRaw expects Buffer or string');
        }
    };

    end(data, encoding) {
        super.end(data, encoding);
        this._next(null, {
            statusCode: this.statusCode,
            statusMessage: this.statusMessage,
            headers: this._headers,
            body: this._body.toString()
        });
    };
};
