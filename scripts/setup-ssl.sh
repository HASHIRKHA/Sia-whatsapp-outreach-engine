#!/usr/bin/env bash
# setup-ssl.sh — Obtain Let's Encrypt certificate for your domain.
#
# This script documents the steps. It does NOT run certbot automatically
# because SSL setup requires DNS to be pointed at the server beforehand.
#
# Prerequisites:
#   1. A domain (e.g. wa.yourdomain.com) with an A record pointing to this VPS IP
#   2. Docker installed on the VPS
#   3. Ports 80 and 443 open in the VPS firewall
#   4. DOMAIN set in your .env file
#
# Usage:
#   export DOMAIN=wa.yourdomain.com
#   bash scripts/setup-ssl.sh

set -euo pipefail

DOMAIN="${DOMAIN:?DOMAIN env var must be set (e.g. export DOMAIN=wa.yourdomain.com)}"
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL env var must be set for Let's Encrypt notifications}"

echo ""
echo "=== SSL Certificate Setup for ${DOMAIN} ==="
echo ""
echo "Step 1: Ensure nginx is running in HTTP-only mode first."
echo "        Copy nginx.dev.conf over nginx.conf temporarily:"
echo ""
echo "  cp docker/nginx/nginx.dev.conf docker/nginx/nginx.conf"
echo "  docker compose up -d nginx"
echo ""
echo "Step 2: Obtain certificate via certbot (standalone via Docker):"
echo ""

echo "Running certbot now..."
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  -d "${DOMAIN}"

echo ""
echo "Step 3: Switch nginx to the production SSL config:"
echo ""
echo "  cp docker/nginx/nginx.conf.prod docker/nginx/nginx.conf"
echo ""
echo "NOTE: nginx.conf uses the variable \${DOMAIN}."
echo "      Replace it with your actual domain before deploying:"
echo ""
echo "  sed -i \"s/\\\${DOMAIN}/${DOMAIN}/g\" docker/nginx/nginx.conf"
echo ""
echo "Step 4: Restart the full stack:"
echo ""
echo "  docker compose up -d"
echo ""
echo "Step 5: Auto-renew (add to crontab):"
echo ""
echo "  0 3 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \\"
echo "    -v /var/www/certbot:/var/www/certbot certbot/certbot renew --quiet \\"
echo "    && docker compose exec nginx nginx -s reload"
echo ""
echo "=== Done! Certificate stored in /etc/letsencrypt/live/${DOMAIN}/ ==="
