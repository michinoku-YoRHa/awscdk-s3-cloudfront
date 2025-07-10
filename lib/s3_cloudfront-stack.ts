import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Values } from 'aws-cdk-lib/aws-cloudwatch';

export class S3CloudfrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const timestamp = Date.now();
    
    const s3Bucket = new s3.Bucket(this, 'WebSiteBucket', {
      bucketName: `test-s3-bucket-${timestamp}`,
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

    const s3url = new cdk.CfnOutput(this, 'S3URL', {
      value: s3Bucket.bucketWebsiteUrl,
      description: 'S3 URL'
    });
  }
}
