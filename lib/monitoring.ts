import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as actions,
    aws_logs as logs,
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
        const cloudtrailLogBucket = new s3.Bucket(this, 'LogBucket', {
            bucketName: `s3-cloudtrail-logbucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // CloudTrailログの保持期間をライフサイクルルールで指定
        cloudtrailLogBucket.addLifecycleRule({
            prefix: `AWSLogs/${cdk.Aws.ACCOUNT_ID}/CloudTrail`,
            expiration: cdk.Duration.days(180),
        });

        // CloudWatchLogsロググループ作成
        const logGroup = new logs.LogGroup(this, 'LogGroup', {
            logGroupName: `CloudWatchLogs-LogGroup-${cdk.Aws.ACCOUNT_ID}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // SNSトピックの作成
        const topic = new sns.Topic(this, 'AlarmTopic', {
            topicName: `sns-topic-${cdk.Aws.ACCOUNT_ID}`,
        });
        // トピックにサブスクリプションを追加
        topic.addSubscription(new subscriptions.EmailSubscription(props.email));
        this.snsTopic = topic;

        // CloudTrail証跡
        const trail = new cloudtrail.Trail(this, 'Trail', {
            trailName: `trail-${cdk.Aws.ACCOUNT_ID}`,
            // 出力先S3バケット指定
            bucket: cloudtrailLogBucket,
            // CloudWatch Logsへのログ出力を有効化
            sendToCloudWatchLogs: true,
            // 出力先ロググループ指定
            cloudWatchLogGroup: logGroup,
            // ロググループ側のログ保持期間指定
            cloudWatchLogsRetention: logs.RetentionDays.ONE_WEEK,
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

        // オリジンバケットのデータイベントを監視するメトリクス作成
        new logs.MetricFilter(this, 'S3PutAndDelete', {
            // 参照するロググループの指定
            logGroup: logGroup,
            // メトリクス名前空間
            metricNamespace: 'S3DataEvent',
            // メトリクス名
            metricName: 'PutDeleteCount',
            // メトリクスのフィルター
            filterPattern: logs.FilterPattern.literal('{$.eventName="PutObject" || $.eventName="DeleteObject"}'),
            // 対象イベント発生時にメトリクスに計上する数
            metricValue: '1',
        });

        // メトリクスを基にアラーム作成
        new cloudwatch.Alarm(this, 'S3PutDeleteAlarm', {
            metric: new cloudwatch.Metric({
                // logsで作成した名前空間を指定
                namespace: 'S3DataEvent',
                metricName: 'PutDeleteCount',
                // 
                statistic: cloudwatch.Stats.SUM,
                period: cdk.Duration.minutes(5),
            }),
            threshold: 1,
            evaluationPeriods: 1,
        }).addAlarmAction(new actions.SnsAction(this.snsTopic));
    }
}