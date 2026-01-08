FROM rust:1.88 AS builder

WORKDIR /build

COPY . .

RUN cargo build --release -p nebulafx-mcp

FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /build/target/release/nebulafx-mcp /app/

ENTRYPOINT ["/app/nebulafx-mcp"]