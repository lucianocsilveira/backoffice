#!/bin/sh
# Substitui os placeholders em env.js pelas variáveis de ambiente do pod
ENV_JS="/usr/share/nginx/html/assets/env.js"

sed -i "s|__API_URL__|${API_URL}|g" "$ENV_JS"
sed -i "s|__API_KEY__|${API_KEY}|g" "$ENV_JS"

exec nginx -g "daemon off;"
