import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_cloudwatch as cloudwatch,
} from 'aws-cdk-lib';

interface MonitoringStackProps extends cdk.StackProps {
    distributionId: string;
};

export class MonitoringStack extends cdk.Stack {
    constructor(scope: Construct, id:string, props: MonitoringStackProps) {
        super(scope, id, props);

        const dashboard = new cloudwatch.Dashboard(this, 'CloudWatchDashboard', {
            dashboardName: 'CloudFront-Metrics',
        });
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'CloudFront Requests',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: 'Requests',
                        dimensionsMap: { DistributionId: props.distributionId, Region: 'Global'},
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: '4xx ans 5xx Errors',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: '4xxErrors',
                        dimensionsMap: { DistributionId: props.distributionId, Region: 'Global'},
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: '5xxErrors',
                        dimensionsMap: { DistributionId: props.distributionId, Region: 'Global'},
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
            }),
        );
    };
};