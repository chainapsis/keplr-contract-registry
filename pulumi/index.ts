import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const stack = pulumi.getStack();

const role = new aws.iam.Role(`keplr-chain-registry-lambda-role-${stack}`, {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
        Sid: "",
      },
    ],
  },
});
new aws.iam.RolePolicyAttachment(
  `keplr-chain-registry-lambda-role-attachment-${stack}`,
  {
    role,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaExecute,
  }
);

const lambda = new aws.lambda.Function(
  `keplr-chain-registry-lambda-function-${stack}`,
  {
    name: `keplr-chain-registry-lambda-function-${stack}`,
    role: role.arn,
    code: new pulumi.asset.FileArchive("../bundle.zip"),
    runtime: "nodejs18.x",
    handler: "bundle/server/index.handler",
    timeout: 15,
    memorySize: 256,
  }
);

const functionUrl = new aws.lambda.FunctionUrl(
  `keplr-chain-registry-lambda-function-url-${stack}`,
  {
    functionName: lambda.name,
    authorizationType: "NONE",
  }
);

export const endpoint = functionUrl.functionUrl;
