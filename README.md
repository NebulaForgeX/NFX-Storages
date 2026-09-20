# NFX-Storages

[English](README.en.md)

Go S3。对象在 NAS 卷 `STORAGES_VOLUME_*`，不是 Identity MinIO。登录走 [NFX-Identity](https://github.com/NebulaForgeX/NFX-Identity)，再换临时 AK/SK。

IAM、S3、部署：[NFX-Documentation 第九章](https://github.com/NebulaForgeX/NFX-Documentation/blob/main/books/zh/chapter-09-nfx-storages-deployment.md)。HTTP 入口只有 Edge。主机 gRPC **10212–10217**，console **10218**。`GRPC_PORT_AUTH=50071` 是 Identity 客户端。

```bash
cp .example.env .env
task proto:gen
task db:create
task atlas:pipeline:run
task console
sudo docker compose up -d
```
