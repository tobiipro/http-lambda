"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.httpLambda = void 0;var _lambdaHttp = _interopRequireDefault(require("./lambda-http"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



















let httpLambda = function (lambdaHandler, options) {
  return function (e, ctx, next) {
    let lambdaHttp = new _lambdaHttp.default(e, ctx, next, options);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    lambdaHandler(lambdaHttp, e, ctx, next);
  };
};exports.httpLambda = httpLambda;var _default = exports.httpLambda;exports.default = _default;

//# sourceMappingURL=http-lambda.js.map