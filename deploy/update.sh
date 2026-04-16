#!/bin/bash
# Claude Detector — 快速更新脚本
# 用法: ssh root@server '/opt/claude-detector/deploy/update.sh'
# 或:   在服务器上直接运行 /opt/claude-detector/deploy/update.sh

set -euo pipefail

INSTALL_DIR="/opt/claude-detector"
DATA_DIR="$INSTALL_DIR/data"
BACKUP_DIR="$INSTALL_DIR/backups"
KEEP_BACKUPS=5

echo ">>> Claude Detector 更新"
cd "$INSTALL_DIR"

echo "[1/4] 备份 SQLite..."
mkdir -p "$BACKUP_DIR"
if [ -f "$DATA_DIR/cctest.db" ]; then
    STAMP=$(date -u +%Y%m%dT%H%M%SZ)
    cp "$DATA_DIR/cctest.db" "$BACKUP_DIR/cctest.$STAMP.db"
    echo "  备份 → $BACKUP_DIR/cctest.$STAMP.db"
    # 保留最近 N 份
    ls -1t "$BACKUP_DIR"/cctest.*.db 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm --
else
    echo "  未发现现有数据库,跳过备份"
fi

echo "[2/4] 拉取最新代码..."
git pull origin main

echo "[3/4] 重新构建并启动(滚动替换,不先 down)..."
docker compose up -d --build --remove-orphans

echo "[4/4] 等待服务就绪..."
for i in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:4321/api/health >/dev/null 2>&1; then
        echo "更新完成 ✓"
        curl -s http://127.0.0.1:4321/api/health
        echo ""
        exit 0
    fi
    sleep 2
done

echo "错误: 服务未在 60s 内就绪" >&2
docker compose logs --tail 30
exit 1
