#!/bin/bash

# Скрипт для обновления Menu Button в Telegram боте
# Использует Telegram Bot API для принудительного обновления кнопки меню

echo "🔄 Обновление Menu Button для Telegram бота..."

# URL вашего webhook для команды обновления меню
WEBHOOK_URL="https://tma-webapp-store.netlify.app/.netlify/functions/webhook"

# Симуляция команды /updatemenu от супер-админа
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 999999,
    "message": {
      "message_id": 999999,
      "from": {
        "id": 1155907659,
        "is_bot": false,
        "first_name": "Admin"
      },
      "chat": {
        "id": 1155907659,
        "type": "private"
      },
      "date": '$(date +%s)',
      "text": "/updatemenu"
    }
  }'

echo ""
echo "✅ Запрос на обновление Menu Button отправлен!"
echo ""
echo "🔧 Альтернативные способы исправления:"
echo "1. Напишите боту команду: /updatemenu"
echo "2. Зайдите в @BotFather → Ваш бот → Bot Settings → Menu Button"
echo "3. Установите URL: https://tma-webapp-store.netlify.app/"
echo ""
echo "⚠️  Может потребоваться время для обновления кэша Telegram"
