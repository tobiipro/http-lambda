# λ http

This Node.js module mocks the `http` module's `createServer` function in the
context of a AWS Lambda.

This makes it possible to reuse HTTP modules e.g. `express` and write code
within an AWS Lambda the same way you would write an HTTP server.

## Example

```javascript
import express from 'express';
import {LambdaHttp} from 'lambda-http';

exports.handle = function(e, ctx, _next) {
  let http = new LambdaHttp(arguments);

  http.log.trace({
    ctx,
    e,
    env: process.env
  });

  let app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.enable('trust proxy');
  app.all('*', function(req, res) {
    res.send('Hello world!');
  });
  http.createServer(app);
};

```

## Configuration

For convenience, there are two side-effects.

### Logging

In the code above, `http.log`, `req.log` and `res.log` are a
[bunyan](https://github.com/trentm/node-bunyan) logger actually.

Disable via `new LambdaHttp(arguments, {noLogger: true})`;

### Catching exceptions

We catch the process' `uncaughtException` events, in order to log the error
before exiting.

Disable via `new LambdaHttp(arguments, {ignoreUncaughtException: true})`;
