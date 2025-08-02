-- SQL скрипт для создания таблиц в Supabase
-- Выполните этот скрипт в SQL Editor в панели управления Supabase

-- Создание таблицы для заказов
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  username TEXT,
  total_price INTEGER NOT NULL DEFAULT 0,
  platform TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'new',
  services JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы для администраторов
CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS admins_user_id_idx ON admins(user_id);

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Применение триггеров
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Добавление супер-администратора
INSERT INTO admins (user_id, name, username, is_super_admin, created_at)
VALUES ('1155907659', 'Super Admin', 'super_admin', TRUE, NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Создание политик Row Level Security (опционально)
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Комментарии к таблицам
COMMENT ON TABLE orders IS 'Таблица для хранения заказов из Telegram WebApp';
COMMENT ON TABLE admins IS 'Таблица для хранения администраторов системы';

COMMENT ON COLUMN orders.services IS 'JSON массив с информацией об услугах в заказе';
COMMENT ON COLUMN orders.status IS 'Статус заказа: new, processing, completed, cancelled';
COMMENT ON COLUMN admins.is_super_admin IS 'Флаг супер-администратора (может управлять другими админами)';
