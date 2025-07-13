#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3CloudfrontStack } from '../lib/s3_cloudfront-stack';
import { CertificateStack } from '../lib/certificate-stack';
import { Route53Stack } from '../lib/route53-stack';

const app = new cdk.App();
const domainName = app.node.tryGetContext('domainName');
const account = process.env.CDK_DEFAULT_ACCOUNT;

const route53Stack = new Route53Stack(app, 'Route53Stack', {
    env: {
        region: 'ap-northeast-1',
        account: account
    },
    // propsに渡す値を指定
    domainName: domainName,
})

const certificateStack = new CertificateStack(app, 'CertificateStack', {
    env: { 
        region: 'us-east-1',
        account: account,
    },
    domainName: domainName,
    hostedZone: route53Stack.hostedZone,
    crossRegionReferences: true,
});

new S3CloudfrontStack(app, 'S3CloudfrontStack', {
    env: {
        region: 'ap-northeast-1',
        account: account,
    },
    domainName: domainName,
    certificateArn: certificateStack.certificateArn,
    hostedZone: route53Stack.hostedZone,
    crossRegionReferences: true,
});