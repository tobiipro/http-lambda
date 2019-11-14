import IncomingMessage from './incoming-message';
import ServerResponse from './server-response';
import _ from 'lodash-firecloud';
import http from 'http';
import net from 'net';

import {
  Context,
  Event,
  Next,
  Options
} from './types';

export class LambdaHttp {
  _e: Event;

  _ctx: Context;

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
    ctx: Context,
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

export default LambdaHttp;
