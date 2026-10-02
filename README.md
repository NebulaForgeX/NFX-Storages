# NFX-Storages

[English](README.en.md)

Go S3。对象在 NAS 卷 `STORAGES_VOLUME_*`，不是 Identity MinIO。登录走 [NFX-Identity](https://github.com/NebulaForgeX/NFX-Identity)，再换临时 AK/SK。

IAM、S3、部署：[NFX-Documentation 第九章](https://github.com/NebulaForgeX/NFX-Documentation/blob/main/books/zh/chapter-09-nfx-storages-deployment.md)。HTTP 入口只有 Edge。dev gRPC **10081–10089**，console **10090**。Identity 客户端拨 `GRPC_EXT_PORT_AUTH=10031`。

```bash
cp .example.env .env
task proto:gen
task db:create
task atlas:pipeline:run
task console
sudo docker compose up -d
```
