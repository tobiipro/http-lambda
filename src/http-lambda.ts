import LambdaHttp from './lambda-http';

import {
  Context,
  Event,
  Next,
  Options
} from './types';

import {
  MaybePromise
} from 'lodash-firecloud/types';

type LambdaHttpHandler = (
  http: LambdaHttp,
  e: Event,
  ctx: Context,
  next: Next
) => MaybePromise<void>;

export let httpLambda = function(lambdaHandler: LambdaHttpHandler, options?: Options) {
  return function(e: Event, ctx: Context, next: Next) {
    let lambdaHttp = new LambdaHttp(e, ctx, next, options);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    lambdaHandler(lambdaHttp, e, ctx, next);
  };
};

export default httpLambda;
