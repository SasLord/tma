# Инструкция по настройке бота

## 1. Создание бота в Telegram

1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Введите имя бота
4. Введите username бота (должен заканчиваться на `bot`)
5. Сохраните полученный токен

## 2. Настройка WebApp

1. Отправьте @BotFather команду `/mybots`
2. Выберите своего бота
3. Выберите "Bot Settings" → "Menu Button"
4. Выберите "Configure menu button"
5. Введите:
   - Text: "Открыть приложение"
   - URL: https://your-webapp.vercel.app

## 3. Настройка Supabase

### Создание проекта
1. Зайдите на https://supabase.com
2. Создайте новый проект
3. Скопируйте URL и anon key

### Создание таблицы пользователей
```sql
-- Таблица пользователей
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_premium BOOLEAN DEFAULT false,
  language_code TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сессий WebApp
CREATE TABLE webapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(telegram_id),
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 day'
);

-- Индексы для оптимизации
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_webapp_sessions_user_id ON webapp_sessions(user_id);
CREATE INDEX idx_webapp_sessions_expires ON webapp_sessions(expires_at);
```

## 4. Деплой на Vercel

### Настройка переменных окружения
1. Зайдите в ваш проект на Vercel
2. Перейдите в Settings → Environment Variables
3. Добавьте переменные из `.env.example`

### Настройка webhook
1. После деплоя получите URL: `https://your-bot.vercel.app`
2. Отправьте запрос для установки webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-bot.vercel.app/api/bot"}'
```

## 5. Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите кнопку меню (должна появиться "Открыть приложение")
3. WebApp должно открыться и данные пользователя сохраниться в базу
4. Проверьте логи в Vercel Dashboard

## 6. Команды бота

- `/start` - Приветствие и кнопка для открытия WebApp
- `/help` - Справка
- `/stats` - Статистика использования (только для админов)

## Дальнейшее развитие

1. Добавьте уведомления через бота
2. Реализуйте систему достижений
3. Добавьте возможность делиться результатами
4. Создайте административную панель
