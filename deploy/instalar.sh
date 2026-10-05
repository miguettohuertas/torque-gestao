#!/bin/bash
# Executar como: sudo bash deploy/instalar.sh   (passos que exigem root)
set -euo pipefail
D=torquegestao
HERE=$(cd "$(dirname "$0")" && pwd)

# 1. DuckDNS: acrescenta o subdomínio à lista do updater
grep -q "$D" /etc/duckdns.env || sed -i -E "s/^(DUCKDNS_DOMAINS=)(.*)$/\1\2,$D/" /etc/duckdns.env
systemctl start duckdns-update.service

# 2. Certificado (HTTP-01 pela porta 80)
certbot certonly --nginx -d $D.duckdns.org --non-interactive --agree-tos -m migueldufloth@gmail.com

# 3. Site nginx
install -m 644 "$HERE/nginx-torquegestao.conf" /etc/nginx/sites-available/$D
ln -sf /etc/nginx/sites-available/$D /etc/nginx/sites-enabled/$D
nginx -t && systemctl reload nginx
