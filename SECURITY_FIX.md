# 🚨 КРИТИЧЕСКИ ВАЖНО: Настройка безопасности

## Ваши секретные ключи попали в Git!

GitGuardian обнаружил утечку ваших Supabase ключей. Необходимо НЕМЕДЛЕННО:

### 1. Сменить ключи в Supabase

1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдите в Settings → API
3. Сгенерируйте новые ключи:
   - **anon key** (публичный)
   - **service_role key** (секретный)

### 2. Настроить переменные окружения

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Заполните новыми ключами:

```
SUPABASE_URL=https://haxfixzzcomsayyajyuq.supabase.co
SUPABASE_ANON_KEY=your_new_anon_key_here
SUPABASE_SERVICE_KEY=your_new_service_role_key_here
```

### 3. Настроить Netlify Environment Variables

1. Зайдите на [Netlify Dashboard](https://app.netlify.com)
2. Выберите ваш сайт
3. Site settings → Environment variables
4. Добавьте:
   - `SUPABASE_URL` = https://haxfixzzcomsayyajyuq.supabase.co
   - `SUPABASE_ANON_KEY` = ваш новый anon key
   - `SUPABASE_SERVICE_KEY` = ваш новый service_role key

### 4. Очистить Git историю (опционально)

Для полной безопасности удалите старые ключи из Git истории:

```bash
# Внимание: это перепишет историю Git!
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch netlify/functions/supabase-config.js' \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

### 5. Проверить другие файлы

Убедитесь, что больше нигде в проекте нет секретных ключей:

```bash
grep -r "eyJ" . --exclude-dir=node_modules --exclude-dir=.git
```

## Файлы исправлены:

- ✅ `netlify/functions/supabase-config.js` - теперь использует переменные окружения
- ✅ `.env.example` - создан шаблон для переменных
- ✅ `.gitignore` - уже настроен правильно

## Важно:

- Файл `.env` НЕ должен попадать в Git (уже в .gitignore)
- Всегда используйте переменные окружения для секретов
- Регулярно проверяйте код на утечки секретов
