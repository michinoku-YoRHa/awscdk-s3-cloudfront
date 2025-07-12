import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_s3 as s3,
  aws_s3_deployment as s3_deployment,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
 } from 'aws-cdk-lib';

export class S3CloudfrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const s3Bucket = new s3.Bucket(this, 'WebSiteBucket', {
      bucketName: `s3-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
        // S3バケットのパブリックアクセスを拒否(デフォルト)
      publicReadAccess: false,
      websiteIndexDocument: 'index.html',
        // S3へのパブリックアクセスを全て拒否(デフォルト)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      originAccessControlName: `${id}-oac`,
        // 認証の設定
        // SIGV4:認証プロトコル(現状唯一)
        // ALWAYS/NO_OVERRIDE:CloudFrontが認証するリクエストの選定
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    }) 

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
          // CloudFrontディストリビューションのデフォルト動作を各種設定
      defaultBehavior: {
          // オリジンの指定
        origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
          s3Bucket,{
            originAccessLevels: [cloudfront.AccessLevel.READ],
          },
        ),          
      },
          // S3からではなくCloudFrontから配信するのでこちらでrootオブジェクトを指定
      defaultRootObject: 'index.html',
    });

    new s3_deployment.BucketDeployment(this, 'DeploymentIndex', {
      destinationBucket: s3Bucket,
      sources: [s3_deployment.Source.asset('./website')],
      destinationKeyPrefix: '',
    });

    const url = new cdk.CfnOutput(this, 'URL', {
      value: distribution.domainName,
      description: 'Website URL'
    });
  }
}
