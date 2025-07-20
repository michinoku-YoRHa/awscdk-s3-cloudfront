import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
} from 'aws-cdk-lib';

interface MonitoringUSStackProps extends cdk.StackProps {
    distributionId: string;
    snsTopic: sns.Topic;
}

export class MonitoringUSStack extends cdk.Stack {
    constructor(scope: Construct, id:string, props: MonitoringUSStackProps) {
        super(scope, id, props);

        // CloudWatchダッシュボードの作成
        const dashboard = new cloudwatch.Dashboard(this, 'CloudWatchDashboard', {
            dashboardName: 'CloudFront-Metrics',
        });
        // ダッシュボードに表示したいウィジェットを追加
        dashboard.addWidgets(
            // 1.コンテンツリクエスト数
            new cloudwatch.GraphWidget({
                title: 'CloudFront Requests',
                left: [
                    // コンテンツリクエスト数メトリクスを指定
                    new cloudwatch.Metric({
                        // メトリクスを取得するサービスの選択
                        namespace: 'AWS/CloudFront',
                        // 取得するリージョンの指定(今回CloudFrontなのでus-east-1)
                        region: 'us-east-1',
                        // 取得するリソースとリージョンの指定
                        dimensionsMap: { DistributionId: props.distributionId, Region: 'Global'},
                        // 使用するメトリクスの選択
                        metricName: 'Requests',
                        // 使用する統計の選択
                        statistic: cloudwatch.Stats.SUM,
                        // 取得間隔
                        period: cdk.Duration.minutes(5),
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: '4xx and 5xx Errors',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        region: 'us-east-1',
                        dimensionsMap: { DistributionId: props.distributionId, Region: 'Global'},
                        metricName: '4xxErrorRate',
                        statistic: cloudwatch.Stats.AVERAGE,
                        period: cdk.Duration.minutes(5),
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        region: 'us-east-1',
                        dimensionsMap: { DistributionId: props.distributionId, Region: 'Global'},
                        metricName: '5xxErrorRate',
                        statistic: cloudwatch.Stats.AVERAGE,
                        period: cdk.Duration.minutes(5),
                    }),
                ],
            }),
        );

        // CloudWatchアラームの作成
        const alarm = new cloudwatch.Alarm(this, '4xxErrorAlarm', {
            alarmName: 'CloudFront-4xxErrors-Alarm',
            // アラームが監視するメトリクス
            metric: new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                region: 'us-east-1',
                dimensionsMap: { DistributionId: props.distributionId, Region: 'Global'},
                metricName: '4xxErrorRate',
                statistic: 'Average',
                period: cdk.Duration.minutes(5),
            }),
            // 閾値
            threshold: 10,
            // 評価期間
            evaluationPeriods: 1,
        });
        // アラーム発生時のアクションを指定
        alarm.addAlarmAction(new actions.SnsAction(props.snsTopic));
    }
}