# Telegram Bot + WebApp Integration

## Архитектура проекта

```
tma-project/
├── frontend/          # Ваше текущее Svelte приложение (WebApp)
│   ├── src/
│   └── package.json
└── bot/               # Telegram Bot (новая папка)
    ├── src/
    │   ├── bot.js     # Основной файл бота
    │   ├── database/  # Работа с БД
    │   ├── handlers/  # Обработчики команд
    │   └── webApp/    # Интеграция с WebApp
    ├── package.json
    └── vercel.json    # Конфигурация для деплоя
```

## Как они взаимодействуют

1. **Пользователь открывает WebApp** в Telegram
2. **WebApp получает initData** (информация о пользователе)
3. **WebApp отправляет данные боту** через API endpoint
4. **Bot сохраняет данные** в базу данных
5. **Bot отправляет уведомления** админам

## Рекомендуемый стек

### Frontend (WebApp)
- ✅ **SvelteKit** (ваш текущий проект)
- ✅ **Vercel** для хостинга

### Backend (Bot)
- ✅ **Node.js + Telegraf** (библиотека для Telegram Bot)
- ✅ **Supabase** (PostgreSQL база данных)
- ✅ **Vercel** (serverless functions)

## Настройка WebApp → Bot коммуникации

```javascript
// В WebApp (Svelte)
const sendDataToBot = async (userData) => {
  const response = await fetch('/api/bot/user-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': window.Telegram.WebApp.initData
    },
    body: JSON.stringify(userData)
  })
}

// В Bot (Node.js)
app.post('/api/bot/user-data', (req, res) => {
  const initData = req.headers.authorization
  if (validateTelegramData(initData)) {
    // Сохраняем данные в БД
    // Отправляем уведомления админам
  }
})
```

## Пример интеграции

1. **Пользователь выбирает услуги** в WebApp
2. **WebApp отправляет данные** боту с initData для верификации
3. **Bot проверяет подлинность** данных от Telegram
4. **Bot сохраняет заказ** в базу данных
5. **Bot уведомляет админов** о новом заказе

## Преимущества такой архитектуры

- 🔒 **Безопасность**: Bot проверяет подлинность данных
- 💾 **Персистентность**: Данные сохраняются в БД
- 📨 **Уведомления**: Автоматические сообщения админам
- 🚀 **Масштабируемость**: Можно добавлять новые функции
- 💰 **Бесплатно**: Можно разместить на бесплатных сервисах
