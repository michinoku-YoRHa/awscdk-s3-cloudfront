import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
    aws_certificatemanager as acm,
    aws_route53 as route53,
} from "aws-cdk-lib";

interface CertificateStackProps extends cdk.StackProps {
    domainName: string;
    hostedZone: route53.IHostedZone;
}

export class CertificateStack extends cdk.Stack {
    public readonly certificateArn: string;

    constructor(scope: Construct, id: string, props: CertificateStackProps) {
        super(scope, id, props);

        const certificate = new acm.Certificate(this, 'WebSiteCert', {
            certificateName: `website-cert`,
                // 証明書を発行してもらうドメインを指定
            domainName: props.domainName,
            subjectAlternativeNames: [`*.${props.domainName}`,],
                // 認証方式をDNSに指定(今回ドメインが1つだけなのでfromDnsを使用)
            validation: acm.CertificateValidation.fromDns(props.hostedZone),
        });
            // 証明書のARNをCloudFrontのスタックで使用するための設定
        this.certificateArn = certificate.certificateArn;
    }
}