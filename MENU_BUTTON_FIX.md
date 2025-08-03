# 🔧 Исправление кнопки "Open" в Telegram боте

## 🎯 Проблема
Кнопка "Open" (Menu Button) в меню Telegram бота ссылается на старый URL и не обновляется автоматически.

## 🔍 Причина
Menu Button в Telegram кэшируется и управляется отдельно от inline keyboard кнопок в сообщениях. Она настраивается через:
- Telegram Bot API метод `setChatMenuButton`
- Или через @BotFather интерфейс

## ✅ Решения (по порядку приоритета):

### 1. 🤖 Автоматическое обновление через бота
**Самый простой способ:**
```
Напишите боту команду: /updatemenu
```
- Доступно только администраторам
- Программно обновляет Menu Button через API

### 2. 🛠️ Ручное обновление через скрипт
```bash
./fix-menu-button.sh
```
Или выполните запрос вручную:
```bash
curl -X POST "https://tma-webapp-store.netlify.app/.netlify/functions/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 999999,
    "message": {
      "message_id": 999999,
      "from": {"id": 1155907659, "is_bot": false, "first_name": "Admin"},
      "chat": {"id": 1155907659, "type": "private"},
      "date": '$(date +%s)',
      "text": "/updatemenu"
    }
  }'
```

### 3. 📱 Через @BotFather (самый надежный способ)
1. Напишите @BotFather
2. Выберите `/mybots`
3. Выберите вашего бота
4. `Bot Settings` → `Menu Button`
5. Выберите `Configure menu button`
6. Введите:
   - **Text**: `🛍️ Каталог услуг`
   - **URL**: `https://tma-webapp-store.netlify.app/`

### 4. 🔄 Принудительная очистка кэша
Если ничего не помогает:
1. Удалите Menu Button через @BotFather (`Remove menu button`)
2. Подождите 5-10 минут
3. Создайте заново с правильным URL

## 🕐 Время обновления
- **Через API**: 1-5 минут
- **Через @BotFather**: немедленно
- **Кэш Telegram**: может занять до 24 часов

## 🧪 Проверка
После обновления:
1. Закройте и откройте чат с ботом
2. Проверьте, что кнопка "Open" ведет на правильный URL
3. Убедитесь, что приложение загружается корректно

## 📋 Логи
Проверьте логи Netlify Functions для подтверждения обновления:
```
✅ Menu button updated successfully
```

## ⚠️ Важно
- Menu Button обновляется **глобально** для всех пользователей
- Старые сессии могут кэшировать старый URL
- Рекомендуется использовать метод через @BotFather для гарантированного результата
