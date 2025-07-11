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
        // バケット名を一意にしやすくするためアカウントIDと作成リージョンを使用
      bucketName: `s3-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
        // CDKスタック削除時に当S3バケットが削除されるように設定値をtrue
        // 設定しないとスタック削除しても残る
      autoDeleteObjects: true,
        // 上記パラメータ設定時にオブジェクトが残ってるとエラーになるのでremovalPolicyを削除に指定
        // これを入れるとオブジェクト削除用のlambdaやらlambdaがS3を操作するためのIAMロールが自動作成される
      removalPolicy: cdk.RemovalPolicy.DESTROY,
        // パブリックアクセスを許可
        // S3バケットを直接見てもらうには必要な設定
      publicReadAccess: true,
        // ウェブサイトホスティングでIndexファイルになるファイル名を指定
      websiteIndexDocument: 'index.html',
        // デフォルトではACLが有効なので無効化
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
    });

    new s3_deployment.BucketDeployment(this, 'DeploymentIndex', {
       // ファイルをアップロードするS3バケットを指定
      destinationBucket: s3Bucket,
       // アップロードするファイルを指定
       // 今回はwebsiteフォルダ内のファイルをアップロードしてもらいます
       // 指定するパスはCDKコマンドを実行するディレクトからのパスです(このtsファイルからのパスじゃないので注意)
      sources: [s3_deployment.Source.asset('./website')],
       // ファイルの格納先です
       // 今回はS3バケットのルート直下に配置します
      destinationKeyPrefix: '',
    })

    const s3url = new cdk.CfnOutput(this, 'S3URL', {
      value: s3Bucket.bucketWebsiteUrl,
      description: 'S3 URL'
    });
  }
}
