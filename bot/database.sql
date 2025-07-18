-- Полная схема базы данных для Telegram WebApp + Bot

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

-- Таблица заказов
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(telegram_id),
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  services JSONB NOT NULL,
  total_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_webapp_sessions_user_id ON webapp_sessions(user_id);
CREATE INDEX idx_webapp_sessions_expires ON webapp_sessions(expires_at);

-- Политики безопасности Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webapp_sessions ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы users
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Политики для таблицы orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (true);

-- Политики для таблицы webapp_sessions
CREATE POLICY "Users can view their own sessions" ON webapp_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own sessions" ON webapp_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own sessions" ON webapp_sessions FOR UPDATE USING (true);
