import LambdaHttp from './lambda-http';
import { Context, Event, Next, Options } from './types';
import { MaybePromise } from 'lodash-firecloud/types';
declare type LambdaHttpHandler = (http: LambdaHttp, e: Event, ctx: Context, next: Next) => MaybePromise<void>;
export declare let httpLambda: (lambdaHandler: LambdaHttpHandler, options?: Options) => (e: import("aws-lambda").APIGatewayProxyEvent, ctx: Context, next: Next) => void;
export default httpLambda;
