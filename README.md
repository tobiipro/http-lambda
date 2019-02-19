# http-lambda [![Build Status][2]][1]

`http-lambda` mocks the `http` module's `createServer` function in the
context of a AWS Lambda. The same solution could be generalized for other cloud
service providers.

This makes it possible to reuse HTTP modules e.g. `express` and write code
within an AWS Lambda the same way you would write an HTTP server.


## Example

```javascript
import express from 'express';
import {httpLambda} from 'http-lambda';

exports.handle = httpLambda(function(http, e, ctx, _next) {
  http.log.trace({
    ctx,
    e,
    env: process.env
  });

  let app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.enable('trust proxy');
  app.all('*', function(_req, res) {
    res.send('Hello world!');
  });
  http.createServer(app);
});
```

Support for binary responses as described
[here](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html)
exists and is triggered by writing response data with 'binary' encoding e.g. `res.end(binaryData, 'binary')`.
Remember that API Gateway also needs to be configured to treat the response media-type as binary.


## Configuration

The `httpLambda` functions takes a second argument, an `options` object:

### `options.onUncaughtException` = Function

By default, `http-lambda` will log the exception via `console.log`
and crash the process (via the `onInternalServerError` callback).

### `options.onUnhandledRejection` = Function

By default, `http-lambda` will log the rejection via `console.log`
and crash the process (via the `onInternalServerError` callback).

### `options.onInternalServerError` = Function

By default, `http-lambda` will crash the process.


## Random observations

We would have liked to control the HTTP response in `onInternalServerError` e.g. reply with `500` instead of `502`,
but that is not possible without risking a dirty state.

The current (poor I might add) design can be exemplified as follows:

* `next(new Error('test'))` = state will be frozen,
  API gateway will reply with `502 Bad Gateway` and `{"message": "Internal server error"}`.
  Error details are lost.
* `next(new Error('test', {statusCode: 200}))` = state will be frozen,
  API gateway will reply with `502 Bad Gateway` and `{"message": "Internal server error"}`.
  Error details and intended response are lost.
* `next(undefined, {statusCode: 200}); process.exit()` = process will crash,
  API gateway will reply with `502 Bad Gateway` and `{"message": "Internal server error"}`.
  Lambda logs will show `Process exited before completing request`.
  Intended response is lost.
* `next(undefined, {statusCode: 200}); process.nextTick(function() {process.exit()})` = process will crash,
  API gateway will reply with `502 Bad Gateway` and `{"message": "Internal server error"}`.
  Lambda logs will show `Process exited before completing request`.
  Intended response is lost.
* `next(undefined, {statusCode: 200}); setImmediate(function() {process.exit()})` = process will crash,
  API gateway will reply with `502 Bad Gateway` and `{"message": "Internal server error"}`.
  Lambda logs will show `Process exited before completing request`.
  Intended response is lost.
* `next(undefined, {statusCode: 200}); setTimeout(function() {process.exit()}, 1000)` = process will crash,
  API gateway will reply with `502 Bad Gateway` and `{"message": "Internal server error"}`.
  Lambda logs will show `Process exited before completing request`.
  Intended response is lost.

Setting `ctxcallbackWaitsForEmptyEventLoop = false` is only making things more confusing,
as you will **always** manage to reply with e.g. 200 (like in the example above) once,
and `502` on the next request (when state will be unfrozen, and the first event on the loop is `process.exit()`).


## A word on https://github.com/awslabs/aws-serverless-express

`http-lambda` is an effort of Tobii's Cloud Services that had its first commit
on July 17, 2016.

AWS (via awslabs) has a similar effort
[aws-serverless-express](https://github.com/awslabs/aws-serverless-express)
with a first commit on September 14, 2016 and
[published on October 4, 2016](https://goo.gl/dUXSY8).

AWS' solution is somewhat more abstract, but on the other hand more comvoluted as:
- it builds an HTTP request message from the lambda event signature
- it also JSON-stringifies the lambda event and context into HTTP request headers ?!
- it spins up a Node.js HTTP server on a UNIX socket
- it pipes the request
- and then it expects the consumer to spin up a Node.js HTTP server on a UNIX socket
- and have Node.js parse the just-built HTTP request message
- and run the app/listener
- and have Node.js build the HTTP response message
- it then parses the just-built HTTP request message
- builds the expected lambda callback signature

The `http-lambda` solution consists of:
- extending Node.js http.IncomingMessage to handle the lambda event signature
- extending Node.js http.ServerResponse to produce the lamba callback signature
- provide a reference to a `http`-like module that can be used with e.g. `express`

Performance tests comparing the two haven't been performed yet,
though a guestimate would be the Tobii solution uses less CPU/memory.

In addition, calling `context.getRemainingTimeInMillis()` is still possible
in `http-lambda`, but not in `aws-serverless-express`.

The advantage with the AWS solution is that it works more as a CGI, so in theory
one could call any executable from Node.js, written in any language, tell it to
listen on the UNIX socket, handle the HTTP request, respond and exit.
Given the AWS lambda limitations, especially when running behind AWS API Gateway,
which has a maximum of 29s (not a typo, 30 minus 1 seconds... ?!) timeout,
a faster solution is probably to pipe JSON signatures in (lambda event and context)
and out (lambda callback), and shortcircuit the parsing/generation of HTTP messages.


## License

[Apache 2.0](LICENSE)


  [1]: https://travis-ci.com/tobiipro/http-lambda
  [2]: https://travis-ci.com/tobiipro/http-lambda.svg?branch=master
