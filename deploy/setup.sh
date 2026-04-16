#!/bin/bash
# Claude Detector — 首次部署脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/7836246/claude-detector/main/deploy/setup.sh | bash
# 或: ssh root@server 'bash -s' < deploy/setup.sh

set -euo pipefail

DOMAIN="test.anthropic.mom"
REPO="https://github.com/7836246/claude-detector.git"
INSTALL_DIR="/opt/claude-detector"
DATA_DIR="/opt/claude-detector/data"

echo "========================================="
echo "  Claude Detector 部署脚本"
echo "  域名: $DOMAIN"
echo "========================================="
echo ""

# --- 1. 系统依赖 ---
echo "[1/6] 安装系统依赖..."
if command -v apt-get &>/dev/null; then
    apt-get update -qq
    apt-get install -y -qq git curl nginx certbot python3-certbot-nginx
elif command -v yum &>/dev/null; then
    yum install -y -q git curl nginx certbot python3-certbot-nginx
else
    echo "不支持的系统,请手动安装 git curl nginx certbot"
    exit 1
fi

# --- 2. Docker ---
echo "[2/6] 检查 Docker..."
if ! command -v docker &>/dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
docker --version

# --- 3. 拉取代码 ---
echo "[3/6] 拉取代码..."
if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    git pull origin main
else
    git clone "$REPO" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
mkdir -p "$DATA_DIR"

# --- 4. 配置环境变量 ---
echo "[4/6] 配置环境变量..."
if [ ! -f "$INSTALL_DIR/.env" ]; then
    ADMIN_PW=$(openssl rand -hex 16)
    cat > "$INSTALL_DIR/.env" <<ENVEOF
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
ADMIN_PASSWORD=$ADMIN_PW
DATA_DIR=/data
ENVEOF
    echo ""
    echo "============================================"
    echo "  管理后台密码: $ADMIN_PW"
    echo "  请保存此密码! 后续在 .env 文件中修改"
    echo "  验证码请在后台 /admin/settings 中配置"
    echo "============================================"
    echo ""
else
    echo ".env 已存在,跳过"
fi

# --- 5. Docker 构建 + 启动 ---
echo "[5/6] 构建并启动 Docker..."
cd "$INSTALL_DIR"
docker compose down 2>/dev/null || true
docker compose up -d --build

# 等待服务就绪
echo "等待服务启动..."
READY=0
for i in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:4321/api/health >/dev/null 2>&1; then
        echo "服务已就绪 ✓"
        READY=1
        break
    fi
    sleep 2
done
if [ "$READY" -ne 1 ]; then
    echo "错误: 服务未在 60s 内就绪" >&2
    docker compose logs --tail 30
    exit 1
fi

# --- 6. Nginx 反向代理 + SSL ---
echo "[6/6] 配置 Nginx + SSL..."
cat > /etc/nginx/sites-available/claude-detector <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers (HSTS is added after certbot redirects to HTTPS)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # SSE support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/claude-detector /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx

# SSL (非交互,如果域名已解析)
echo "申请 SSL 证书..."
CERTBOT_LOG="$INSTALL_DIR/certbot.log"
if ! certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
        --email ai@anthropic.mom --redirect >"$CERTBOT_LOG" 2>&1; then
    echo "SSL 自动申请失败,日志保存在 $CERTBOT_LOG"
    echo "请手动运行: certbot --nginx -d $DOMAIN"
fi

echo ""
echo "========================================="
echo "  部署完成!"
echo "  网站: https://$DOMAIN"
echo "  后台: https://$DOMAIN/admin"
echo "  健康: https://$DOMAIN/api/health"
echo "========================================="
