# AWS CDKで静的ウェブサイトを構築する

## 概要

AWS CDK(typescript)を用いて以下の構成要素をデプロイします。

- S3バケットをオリジンとするCloudFrontディストリビューション
- 独自ドメインのRoute 53連携
- Certificate Managerによる独自ドメインを使用したHTTPS対応
- CloudWatchメトリクスを使用した監視設定
- CloudTrailデータイベントログを利用したS3バケット操作検知
- CloudFrontアクセスログの取得

### 今後のToDo

- WAFの実装
- デプロイパイプラインの実装
- ポリシー見直し
- 証明書更新

## 構成図

## デプロイ手順

### セットアップ

```
git clone https://github.com/michinoku-YoRHa/awscdk-s3-cloudfront.git
cd awscdk-s3-cloudfront
npm install
cdk bootstrap aws://<accountID>/ap-northeast-1 aws://<accountID>/us-east-1
```

### cdk.json

取得したドメイン名とメールアドレスをパラメータとして設定します。

```
  "context": {
    "domainName": "yourdomain.com",
    "email": "youraddress@mail.com",
  }
```

### デプロイ

```
cdk deploy --all
```