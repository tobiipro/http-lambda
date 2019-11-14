/// <reference types="node" />
import awsLambda from 'aws-lambda';
export declare type Event = awsLambda.APIGatewayEvent;
export declare type Context = awsLambda.Context;
export declare type Next = awsLambda.Callback<awsLambda.APIGatewayProxyResult>;
export declare type Options = {
    onUncaughtException?: NodeJS.UncaughtExceptionListener;
    onUnhandledRejection?: NodeJS.UnhandledRejectionListener;
    onInternalServerError?: () => void;
};
