"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ServerResponse = void 0;
var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _http = _interopRequireDefault(require("http"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}





















class ServerResponse extends _http.default.ServerResponse {








  // eslint-disable-next-line max-params
  constructor(req, ctx, next) {
    super(req);_defineProperty(this, "_next", void 0);_defineProperty(this, "_body", void 0);_defineProperty(this, "_isBinary", void 0);_defineProperty(this, "ctx", void 0);
    this._body = Buffer.from('');

    this.ctx = ctx;
    this._next = next;
    this._isBinary = false;

    // NOTE express sets the __proto__ to http.ServerResponse
    _lodashFirecloud.default.forEach([
    '_writeRaw',
    'addTrailers',
    'end',
    'writeHead'],
    method => {
      // @ts-ignore
      // eslint-disable-next-line no-proto
      this[method] = this.__proto__[method].bind(this);
    });
  }

  /* eslint-disable no-dupe-class-members */




  _writeRaw(data, encodingOrCallback, _callback) {
    let encoding;
    if (_lodashFirecloud.default.isFunction(encodingOrCallback)) {
      _callback = encodingOrCallback;
      encoding = undefined;
    } else {
      encoding = encodingOrCallback;
    }

    // see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
    if (encoding === 'binary') {
      this._isBinary = true;
    }

    if (_lodashFirecloud.default.isBuffer(data)) {
      this._body = Buffer.concat([
      this._body,
      data]);

    } else if (_lodashFirecloud.default.isString(data)) {
      this._body = Buffer.concat([
      this._body,
      Buffer.from(data, encoding)]);

    } else {
      throw new Error('ServerResponse._writeRaw expects Buffer or string');
    }
  }
  /* eslint-enable no-dupe-class-members */

  // eslint-disable-next-line class-methods-use-this
  addTrailers(_headers) {
    // not supported
  }

  end(data, encoding, _cb) {
    super.end(data, encoding);

    // API Gateway doesn't support multiple headers (yet)
    // case #1951724541
    let headers = _lodashFirecloud.default.mapValues(this._headers, function (header) {
      // NOTE this is a very naïve "solution" since the semantics are header based,
      // while here we assume that all the values of a header MUST be joined by a comma
      if (_lodashFirecloud.default.isArray(header)) {
        header = header.join(', ');
      }

      return _lodashFirecloud.default.toString(header);
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
      body });

  }

  writeHead(
  statusCode,
  reasonPhrase,
  headers)
  {
    if (_lodashFirecloud.default.isString(reasonPhrase)) {
      super.writeHead(statusCode, reasonPhrase, headers);
    } else {
      headers = reasonPhrase;
      super.writeHead(statusCode, headers);
    }

    // we want this._body to be just the body on this.end
    this._header = '';
    return this;
  }}exports.ServerResponse = ServerResponse;var _default =


ServerResponse;exports.default = _default;

//# sourceMappingURL=server-response.js.map