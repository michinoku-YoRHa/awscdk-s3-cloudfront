import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_s3 as s3,
  aws_s3_deployment as s3_deployment,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
  aws_route53 as route53,
  aws_route53_targets as route53_targets,
  aws_certificatemanager as acm,
} from 'aws-cdk-lib';

// 外部から取得するパラメータを定義
interface S3CloudfrontStackProps extends cdk.StackProps {
  domainName: string;
  certificateArn: string;
  hostedZone: route53.IHostedZone;
}

export class S3CloudfrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: S3CloudfrontStackProps) {
    super(scope, id, props);
    
    const s3Bucket = new s3.Bucket(this, 'WebSiteBucket', {
      bucketName: `s3-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ACM証明書の読み込み(別スタックから)
    const certificate = acm.Certificate.fromCertificateArn(this, 'WebSiteCert', props.certificateArn);

    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      originAccessControlName: `${id}-oac`,
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    }) 

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
          s3Bucket,{
            originAccessLevels: [cloudfront.AccessLevel.READ],
          },
        ),          
      },
      defaultRootObject: 'index.html',
        // 独自ドメインの指定
      domainNames: [props.domainName],
        // 証明書の指定
      certificate: certificate,
    });

    // Route53レコード作成
    new route53.ARecord(this, 'AliasRecord', {
        // ホストゾーン指定
      zone: props.hostedZone,
        // レコード指定
      recordName: '',
        // ターゲット指定
      target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
    });

    new s3_deployment.BucketDeployment(this, 'DeploymentIndex', {
      destinationBucket: s3Bucket,
      sources: [s3_deployment.Source.asset('./website')],
      destinationKeyPrefix: '',
    });

    const url = new cdk.CfnOutput(this, 'URL', {
      value: `https://${props.domainName}`,
      description: 'Website URL'
    });
  }
}
