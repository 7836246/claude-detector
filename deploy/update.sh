#!/bin/bash
# Claude Detector — 快速更新脚本
# 用法: ssh root@server '/opt/claude-detector/deploy/update.sh'
# 或:   在服务器上直接运行 /opt/claude-detector/deploy/update.sh

set -euo pipefail

INSTALL_DIR="/opt/claude-detector"

echo ">>> Claude Detector 更新"
cd "$INSTALL_DIR"

echo "[1/3] 拉取最新代码..."
git pull origin main

echo "[2/3] 重新构建并启动..."
docker compose down
docker compose up -d --build

echo "[3/3] 等待服务就绪..."
for i in $(seq 1 30); do
    STATUS=$(curl -s http://127.0.0.1:4321/api/health 2>/dev/null | grep -o '"status":"ok"' || true)
    if [ -n "$STATUS" ]; then
        echo "更新完成 ✓"
        curl -s http://127.0.0.1:4321/api/health
        echo ""
        exit 0
    fi
    sleep 2
done

echo "警告: 服务未在 60s 内就绪,请检查 docker logs"
docker compose logs --tail 20
