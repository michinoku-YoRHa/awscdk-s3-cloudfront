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

![構成図](architecture.png)

| 役割 | 説明 |
|-----------|-----------|
|`user` | CloudFrontから配信されるコンテンツを利用する |
|`operator` | CloudWatchからのアラートをSNS通知として受け取る |



## デプロイ手順

### 前提条件

以下の環境で動作を確認しています。

- Node.js `vv22.12.0`
- AWS CLI `v2.22.28` (Python/3.12.6 Windows/11)
- AWS CDK `v2.1022.0` (build b0e6bc0)

### セットアップ

```powershell
git clone https://github.com/michinoku-YoRHa/awscdk-s3-cloudfront.git
cd awscdk-s3-cloudfront
npm install
cdk bootstrap aws://<accountID>/ap-northeast-1 aws://<accountID>/us-east-1
```

### cdk.json

`cdk.json`に取得したドメイン名とメールアドレスをパラメータとして設定します。

```json
  "context": {
    "domainName": "yourdomain.com",
    "email": "youraddress@mail.com",
  }
```

### デプロイ

```powershell
cdk deploy --all
```