
// eslint-disable-next-line import/no-unresolved
import awsLambda from 'aws-lambda';

/*
  e = {
    // path: "/test/hello",
    path: undefined,
    headers: {},
    // pathParameters: {"proxy": "hello"},
    pathParameters: {},
    requestContext: {
      accountId: undefined,
      resourceId: undefined,
      stage: undefined,
      requestId: undefined,
      identity: {},
      // resourcePath: "/{proxy+}",
      resourcePath: undefined,
      httpMethod: undefined,
      apiId: undefined
    },
    // resource: "/{proxy+}",
    resource: undefined,
    httpMethod: undefined,
    queryStringParameters: {},
    stageVariables: {}
  }
*/
export type Event = awsLambda.APIGatewayEvent;

/*
  ctx = {
    functionName: undefined,
    functionVersion: undefined,
    invokedFunctionArn: undefined,
    memoryLimitInMB: undefined,
    awsRequestId: undefined,
    logGroupName: undefined,
    logStreamName: undefined,
    identity: {},
    // From X-Amz-Client-Context (HTTP Request Header)
    // For inspiration see
    // http://docs.aws.amazon.com/mobileanalytics/latest/ug/PutEvents.html
    clientContext: {},
    // LAMBDA-HTTP CUSTOM
    // e.stageVariables + process.env
    env: {}
  }

  identity = {
    cognitoIdentityPoolId: undefined,
    accountId: undefined,
    cognitoIdentityId: undefined,
    caller: undefined,
    apiKey: undefined,
    sourceIp: undefined,
    cognitoAuthenticationType: undefined,
    cognitoAuthenticationProvider: undefined,
    userArn: undefined,
    userAgent: undefined,
    user: undefined
  }
*/
export type Context = awsLambda.Context;

export type Next = awsLambda.Callback<awsLambda.APIGatewayProxyResult>;

export type Options = {
  onUncaughtException?: NodeJS.UncaughtExceptionListener,
  onUnhandledRejection?: NodeJS.UnhandledRejectionListener,
  onInternalServerError?: () => void
};
