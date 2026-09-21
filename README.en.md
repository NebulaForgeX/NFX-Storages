# NFX-Storages

[中文](README.md)

Go S3. Object bytes live on NAS volumes `STORAGES_VOLUME_*`, not Identity MinIO. Login is [NFX-Identity](https://github.com/NebulaForgeX/NFX-Identity), then a temporary AK/SK.

IAM, S3, deploy: [NFX-Documentation chapter 9](https://github.com/NebulaForgeX/NFX-Documentation/blob/main/books/en/chapter-09-nfx-storages-deployment.md). HTTP ingress is Edge only. Host gRPC **10212–10216**, console **10218**. `GRPC_PORT_AUTH=50071` is the Identity client.

```bash
cp .example.env .env
task proto:gen
task db:create
task atlas:pipeline:run
task console
sudo docker compose up -d
```
