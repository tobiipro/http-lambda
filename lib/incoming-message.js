"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.IncomingMessage = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _http = _interopRequireDefault(require("http"));

var _querystring = _interopRequireDefault(require("querystring"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}















class IncomingMessage extends _http.default.IncomingMessage {




  constructor(
  socket,


  e,
  ctx)
  {
    super(socket);_defineProperty(this, "body", void 0);_defineProperty(this, "ctx", void 0);
    this.httpVersionMajor = 1;
    this.httpVersionMinor = 1;
    this.httpVersion = '1.1';
    this.chunkedEncoding = false;
    this._removedHeader = {
      'transfer-encoding': true };


    let queryParameters = _lodashFirecloud.default.defaultTo(e.queryStringParameters, {});
    let query = _querystring.default.stringify(queryParameters);
    query = query.length > 0 ? `?${query}` : query;
    this.method = e.httpMethod;
    this.url = `${e.path}${query}`;
    this.headers = _lodashFirecloud.default.cloneDeep(e.headers);
    this.headers = _lodashFirecloud.default.mapKeys(this.headers, function (_value, key) {
      return _lodashFirecloud.default.toLower(key);
    });
    this.headers['content-length'] = _lodashFirecloud.default.toString(_lodashFirecloud.default.defaultTo(e.body, '').length);
    // see https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    this.body = e.isBase64Encoded ? Buffer.from(e.body, 'base64') : e.body;
    this.ctx = ctx;
  }}exports.IncomingMessage = IncomingMessage;var _default =


IncomingMessage;exports.default = _default;

//# sourceMappingURL=incoming-message.js.map