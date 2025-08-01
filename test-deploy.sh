#!/bin/bash

# 🧪 Скрипт тестирования деплоя
# Проверяет работоспособность всех компонентов

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SITE_URL="$1"

if [ -z "$SITE_URL" ]; then
    echo -e "${RED}Использование: $0 SITE_URL${NC}"
    echo "Пример: $0 my-app.netlify.app"
    exit 1
fi

echo -e "${BLUE}🧪 Тестирование деплоя${NC}"
echo "Site URL: https://$SITE_URL"
echo "=============================="

# Тест 1: Доступность сайта
echo -e "${YELLOW}1. Проверка доступности сайта...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://$SITE_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Сайт доступен${NC}"
else
    echo -e "${RED}❌ Сайт недоступен${NC}"
fi

# Тест 2: Проверка функции webhook
echo -e "${YELLOW}2. Проверка функции webhook...${NC}"
webhook_response=$(curl -s -X POST "https://$SITE_URL/.netlify/functions/webhook" \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}' \
    -w "%{http_code}")

if echo "$webhook_response" | tail -c 4 | grep -q "200\|500"; then
    echo -e "${GREEN}✅ Функция webhook отвечает${NC}"
else
    echo -e "${RED}❌ Функция webhook не отвечает${NC}"
fi

# Тест 3: CORS заголовки
echo -e "${YELLOW}3. Проверка CORS заголовков...${NC}"
cors_response=$(curl -s -X OPTIONS "https://$SITE_URL/.netlify/functions/webhook" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -I)

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS заголовки настроены${NC}"
else
    echo -e "${RED}❌ CORS заголовки отсутствуют${NC}"
fi

# Тест 4: Проверка статических файлов
echo -e "${YELLOW}4. Проверка статических файлов...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://$SITE_URL/_app/version.json" | grep -q "200"; then
    echo -e "${GREEN}✅ Статические файлы доступны${NC}"
else
    echo -e "${RED}❌ Проблемы со статическими файлами${NC}"
fi

echo "=============================="
echo -e "${BLUE}Тестирование завершено${NC}"
echo ""
echo -e "${YELLOW}Для полного тестирования:${NC}"
echo "1. Откройте https://$SITE_URL в браузере"
echo "2. Протестируйте в Telegram WebApp"
echo "3. Проверьте получение заказов в боте"
