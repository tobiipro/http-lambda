# http-lambda [![Build Status][2]][1]

`http-lambda` mocks the `http` module's `createServer` function in the
context of a AWS Lambda. The same solution could be generalized for other cloud
service providers.

This makes it possible to reuse HTTP modules e.g. `express` and write code
within an AWS Lambda the same way you would write an HTTP server.


## Example

```javascript
import express from 'express';
import {httpLambda} from 'lambda-http';

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

## Configuration

The `httpLambda` functions takes a second argument, an `options` object:

### `options.ignoreUncaughtException` = Boolean

By default, `httpLambda` will call `options.onUncaughtException`,
in order to respond with a HTTP error.

### `options.onUncaughtException` = Function

By default, `httpLambda` will log the exception via `console.log`.

### `options.onInternalServerError` = Function

By default, `httpLambda` will reply with `500 Internal Server Error`
and a `application/problem+json` content if the lambda crashes.


## A word on https://github.com/awslabs/aws-serverless-express

`http-lambda` is an effort of Tobii's Cloud Services that had its first commit
on July 17, 2016.

AWS (via awslabs) has a similar effort [aws-serverless-express](https://github.com/awslabs/aws-serverless-express)
with a first commit on September 14, 2016 and [published on October 4, 2016](https://aws.amazon.com/blogs/compute/going-serverless-migrating-an-express-application-to-amazon-api-gateway-and-aws-lambda/).

AWS' solution is somewhat more abstract, but on the other hand more comvoluted as it:
- it builds an HTTP request message from the lambda event signature
- it also JSON-stringifies the lambda event and context into HTTP request headers ?!
- it spins up a Node.js HTTP server on a UNIX socket
- it pipes the request
- and then it expects the consumer to spin up a Node.js HTTP server on a UNIX socket
- have Node.js parse the just-built HTTP request message
- run the app/listener
- have Node.js build the HTTP response message
- it then parses the just-built HTTP request message
- builds the expected lambda callback signature

This solution consists of:
- extending Node.js http.IncomingMessage to handle the lambda event signature
- extending Node.js http.ServerResponse to produce the lamba callback signature
- provide a reference to a `http`-like module that can be used with e.g. `express`

Performance tests comparing the two haven't been performed yet,
though a guestimate would be the Tobii solution uses less CPU/memory.

The advantage with the AWS solution is that it works more as a CGI, so in theory
one could call any executable from Node.js, written in any language, tell it to
listen on the UNIX socket, handle the HTTP request, respond and exit.
Given the AWS lambda limitations, especially when running behind AWS API Gateway,
which has a 20s timeout, a better solution is probably to pipe JSON signatures
in (lambda event and context) and out (lambda callback).


## License

[Apache 2.0](LICENSE)


  [1]: https://travis-ci.org/tobiipro/http-lambda
  [2]: https://travis-ci.org/tobiipro/http-lambda.svg?branch=master
