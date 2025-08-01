#!/bin/bash

# 🔧 Быстрая настройка webhook для Telegram бота
# Использование: ./setup-webhook.sh YOUR_BOT_TOKEN your-site-name.netlify.app

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BOT_TOKEN="$1"
SITE_URL="$2"

if [ -z "$BOT_TOKEN" ] || [ -z "$SITE_URL" ]; then
    echo -e "${RED}Использование: $0 BOT_TOKEN SITE_URL${NC}"
    echo "Пример: $0 123456789:ABCDEF... my-app.netlify.app"
    exit 1
fi

WEBHOOK_URL="https://${SITE_URL}/.netlify/functions/webhook"

echo -e "${YELLOW}Настройка webhook для бота...${NC}"
echo "Bot Token: ${BOT_TOKEN:0:10}..."
echo "Webhook URL: $WEBHOOK_URL"

# Установка webhook
response=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"${WEBHOOK_URL}\"}")

if echo "$response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Webhook успешно настроен!${NC}"
else
    echo -e "${RED}❌ Ошибка настройки webhook:${NC}"
    echo "$response"
    exit 1
fi

# Проверка webhook
echo -e "${YELLOW}Проверка webhook...${NC}"
info_response=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

if echo "$info_response" | grep -q "$WEBHOOK_URL"; then
    echo -e "${GREEN}✅ Webhook активен и корректно настроен${NC}"
    echo "URL: $WEBHOOK_URL"
else
    echo -e "${RED}❌ Проблема с webhook${NC}"
    echo "$info_response"
fi
