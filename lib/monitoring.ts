import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_s3 as s3,
    aws_cloudtrail as cloudtrail,
} from 'aws-cdk-lib';

interface MonitoringStackProps extends cdk.StackProps {
    email: string;
    originBucket: s3.Bucket;
}

export class MonitoringStack extends cdk.Stack {
    public readonly snsTopic: sns.Topic;

    constructor(scope: Construct, id: string, props:MonitoringStackProps) {
        super(scope, id, props);


        // 監視ログ格納用のS3バケット
        const logBucket = new s3.Bucket(this, 'LogBucket', {
            bucketName: `s3-logbucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // CloudTrailログの保持期間をライフサイクルルールで指定
        logBucket.addLifecycleRule({
            prefix: `AWSLogs/${cdk.Aws.ACCOUNT_ID}/CloudTrail`,
            expiration: cdk.Duration.days(180),
        })

        // SNSトピックの作成
        const topic = new sns.Topic(this, 'AlarmTopic');
        // トピックにサブスクリプションを追加
        topic.addSubscription(new subscriptions.EmailSubscription(props.email));
        this.snsTopic = topic;

        // CloudTrail証跡
        const trail = new cloudtrail.Trail(this, 'Trail', {
            // 出力先指定
            bucket: logBucket,
            // 今回はLogsには出力しない
            cloudWatchLogGroup: undefined,
            // グローバルな管理イベントを単一S3バケットに格納させる
            isMultiRegionTrail: true,
        });
        // CloudFrontオリジンバケットのデータイベントを取得
        trail.addS3EventSelector(
            [{ bucket: props.originBucket }],
            {
                readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY,
            },
        );
    }
}