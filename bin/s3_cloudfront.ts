#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3CloudfrontStack } from '../lib/s3_cloudfront-stack';
import { CertificateStack } from '../lib/certificate-stack';
import { Route53Stack } from '../lib/route53-stack';
import { MonitoringUSStack } from '../lib/monitoring-us';
import { MonitoringStack } from '../lib/monitoring';

const app = new cdk.App();
const domainName = app.node.tryGetContext('domainName');
const email = app.node.tryGetContext('email');
const account = process.env.CDK_DEFAULT_ACCOUNT;

const route53Stack = new Route53Stack(app, 'Route53Stack', {
    env: {
        region: 'ap-northeast-1',
        account: account
    },
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

const s3CloudfrontStack = new S3CloudfrontStack(app, 'S3CloudfrontStack', {
    env: {
        region: 'ap-northeast-1',
        account: account,
    },
    domainName: domainName,
    certificateArn: certificateStack.certificateArn,
    hostedZone: route53Stack.hostedZone,
    crossRegionReferences: true,
});

const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
    env: {
        region: 'ap-northeast-1',
        account: account,
    },
    crossRegionReferences: true,
    email: email,
    originBucket: s3CloudfrontStack.originBucket,
})

new MonitoringUSStack(app, 'MonitoringUSStack', {
    env: {
        region: 'us-east-1',
        account: account,
    },
    distributionId: s3CloudfrontStack.distributhinId,
    crossRegionReferences: true,
    snsTopic: monitoringStack.snsTopic,
});