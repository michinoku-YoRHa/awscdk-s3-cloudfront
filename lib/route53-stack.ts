import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
    aws_route53 as route53,
} from "aws-cdk-lib";

// 外部から受け取るプロパティをまとめるPropsを作成
interface Route53StackProps extends cdk.StackProps {
    domainName: string;
}

export class Route53Stack extends cdk.Stack {
        // ホストゾーンを別ファイルから参照できるように設定
    public readonly hostedZone: route53.IHostedZone;

    constructor(scope: Construct, id: string, props: Route53StackProps) {
        super(scope, id, props);

        const hostedZone = new route53.HostedZone(this, 'HostedZone', {
                // 取得したドメイン名でホストゾーンを作成
            zoneName: props.domainName,           
        });
        // このホストゾーンは別ファイルから参照できるように定義
        this.hostedZone = hostedZone;
    }
}