import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_s3 as s3,
  aws_s3_deployment as s3_deployment,
 } from 'aws-cdk-lib';

export class S3CloudfrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const s3Bucket = new s3.Bucket(this, 'WebSiteBucket', {
      bucketName: `s3-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
    });

    new s3_deployment.BucketDeployment(this, 'DeploymentIndex', {
      sources: [s3_deployment.Source.asset('./website')],
      destinationBucket: s3Bucket,
      destinationKeyPrefix: '',
    })

    const s3url = new cdk.CfnOutput(this, 'S3URL', {
      value: s3Bucket.bucketWebsiteUrl,
      description: 'S3 URL'
    });
  }
}
