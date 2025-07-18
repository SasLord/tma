# Полное руководство по развертыванию Telegram WebApp + Bot

## 🚀 Быстрый старт

### 1. Подготовка WebApp

```bash
# Установите зависимости
npm install

# Запустите локально для тестирования
npm run dev

# Соберите для продакшена
npm run build
```

### 2. Настройка бота

```bash
# Перейдите в папку бота
cd bot

# Установите зависимости
npm install
```

### 3. Создание бота в Telegram

1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Введите имя: "Ваш сервис бот"
4. Введите username: "your_service_bot"
5. Сохраните токен

### 4. Настройка Supabase

1. Создайте проект на https://supabase.com
2. Выполните SQL из `bot/README.md` для создания таблиц
3. Скопируйте URL и anon key

### 5. Деплой на Vercel

#### WebApp:
```bash
# В корневой папке проекта
npx vercel

# Следуйте инструкциям Vercel
```

#### Bot:
```bash
# В папке bot/
npx vercel

# Настройте переменные окружения в Vercel Dashboard:
# BOT_TOKEN=your_bot_token
# WEBAPP_URL=https://your-webapp.vercel.app
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your_key
# ADMIN_CHAT_IDS=123456789
```

### 6. Настройка webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-bot.vercel.app/api/bot"}'
```

### 7. Настройка WebApp в боте

1. Отправьте @BotFather `/mybots`
2. Выберите вашего бота
3. "Bot Settings" → "Menu Button"
4. "Configure menu button"
5. Text: "Открыть приложение"
6. URL: `https://your-webapp.vercel.app`

## 📊 Проверка работы

### Тестирование WebApp:
1. Откройте бота в Telegram
2. Нажмите кнопку меню
3. WebApp должен открыться с темой Telegram
4. Попробуйте функцию "Add to Home Screen"

### Тестирование интеграции:
1. Перейдите на страницу `/services`
2. Выберите несколько услуг
3. Нажмите "Отправить заказ" в главной кнопке Telegram
4. Проверьте, что данные сохранились в Supabase

### Проверка уведомлений:
1. После отправки заказа админы должны получить уведомление
2. Пользователь должен получить подтверждение

## 🔧 Возможные проблемы

### WebApp не открывается:
- Проверьте URL в настройках бота
- Убедитесь, что HTTPS работает
- Проверьте `app.html` - должен быть подключен Telegram SDK

### Бот не отвечает:
- Проверьте webhook: `/api/bot` должен возвращать 200
- Проверьте переменные окружения в Vercel
- Посмотрите логи в Vercel Dashboard

### addToHomeScreen не работает:
- Проверьте версию Telegram (нужна 7.10+)
- Убедитесь, что приложение развернуто
- Проверьте, что initData валидный

### Данные не сохраняются:
- Проверьте соединение с Supabase
- Убедитесь, что таблицы созданы
- Проверьте права доступа в Supabase

## 📈 Дальнейшее развитие

### Аналитика:
```javascript
// Добавьте в WebApp
import { notifyBotAction } from '$lib/telegram';

// Отслеживание событий
notifyBotAction('button_click', { button: 'service_1' });
notifyBotAction('page_view', { page: 'services', duration: 30 });
```

### Уведомления:
```javascript
// В боте
bot.telegram.sendMessage(userId, 'Ваш заказ готов!', {
  reply_markup: {
    inline_keyboard: [[
      { text: 'Открыть приложение', web_app: { url: WEBAPP_URL } }
    ]]
  }
});
```

### Платежи:
```javascript
// Интеграция платежей в WebApp
window.Telegram.WebApp.invokeCustomMethod('web_app_trigger_haptic_feedback', {
  type: 'notification',
  notification_type: 'success'
});
```

## 🎯 Чек-лист готовности

- [ ] Бот создан и настроен в @BotFather
- [ ] WebApp развернут на Vercel
- [ ] Bot развернут на Vercel
- [ ] Supabase настроен и таблицы созданы
- [ ] Webhook установлен
- [ ] Menu Button настроена
- [ ] Переменные окружения заданы
- [ ] Тестирование прошло успешно
- [ ] Админы получают уведомления
- [ ] addToHomeScreen работает

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи в Vercel Dashboard
2. Убедитесь, что все переменные окружения заданы
3. Проверьте статус webhook: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
4. Протестируйте каждый компонент отдельно

Удачи с запуском! 🎉
