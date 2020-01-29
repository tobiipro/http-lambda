"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.LambdaHttp = void 0;var _incomingMessage = _interopRequireDefault(require("./incoming-message"));
var _serverResponse = _interopRequireDefault(require("./server-response"));
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _http = _interopRequireDefault(require("http"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}








class LambdaHttp {






















  // eslint-disable-next-line max-params
  constructor(
  e,
  ctx,
  next = _lodashFirecloud.default.noop.bind(_lodashFirecloud.default),
  options = {})
  {_defineProperty(this, "_e", void 0);_defineProperty(this, "_ctx", void 0);_defineProperty(this, "_next", void 0);_defineProperty(this, "_options", void 0);_defineProperty(this, "_connection", void 0);_defineProperty(this, "_req", void 0);_defineProperty(this, "_res", void 0);_defineProperty(this, "onUncaughtException", void 0);_defineProperty(this, "onUnhandledRejection", void 0);_defineProperty(this, "onInternalServerError", void 0);
    _lodashFirecloud.default.defaults(options, {
      onUncaughtException: this._onUncaughtException.bind(this),
      onUnhandledRejection: this._onUnhandledRejection.bind(this),
      onInternalServerError: this._onInternalServerError.bind(this) });


    // NOTE normalizing
    _lodashFirecloud.default.defaultsDeep(e, {
      pathParameters: {},
      requestContext: {
        identity: {} },

      queryStringParameters: {},
      stageVariables: {} });

    _lodashFirecloud.default.defaultsDeep(ctx, {
      clientContext: {},
      identity: {} });


    _lodashFirecloud.default.defaultsDeep(ctx, {
      env: e.stageVariables,
      requestContext: e.requestContext });


    _lodashFirecloud.default.defaultsDeep(ctx, {
      env: process.env });


    this._e = e;
    this._ctx = ctx;
    this._next = next;
    this._options = options;

    this.onInternalServerError = options.onInternalServerError;
    process.on('uncaughtException', options.onUncaughtException);
    process.on('unhandledRejection', options.onUnhandledRejection);

    this._connection = {
      destroy: function (_err) {
        // _.noop
      } };

    this._req = new _incomingMessage.default(this._connection, e, ctx);
    this._res = new _serverResponse.default(this._req, ctx, function (...args) {
      process.removeListener('uncaughtException', options.onUncaughtException);
      process.removeListener('unhandledRejection', options.onUnhandledRejection);
      next(...args);
    });

    _lodashFirecloud.default.merge(this, _lodashFirecloud.default.pick(_http.default, [
    'METHODS',
    'STATUS_CODES']));

  }

  createServer(requestListener) {
    // we simulate that a HTTP request was received as soon as the server was created
    requestListener(this._req, this._res);
  }

  _onUncaughtException(err) {
    // eslint-disable-next-line no-console
    console.error(err);

    this.onInternalServerError();
  }

  _onUnhandledRejection(reason, p) {
    // eslint-disable-next-line no-console
    console.error(reason, p);

    this.onInternalServerError();
  }

  // eslint-disable-next-line class-methods-use-this
  _onInternalServerError() {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }}exports.LambdaHttp = LambdaHttp;var _default =


LambdaHttp;exports.default = _default;

//# sourceMappingURL=lambda-http.js.map