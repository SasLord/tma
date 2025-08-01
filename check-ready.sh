#!/bin/bash

# 📋 Финальная проверка готовности к деплою

echo "🚀 Проверка готовности проекта к деплою"
echo "====================================="

# Проверка структуры файлов
echo "📁 Проверка файлов деплоя:"
files=("deploy.sh" "setup-webhook.sh" "test-deploy.sh" "netlify.toml" "netlify/functions/webhook.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file ОТСУТСТВУЕТ"
    fi
done

# Проверка исполняемых прав
echo ""
echo "🔐 Проверка прав доступа:"
scripts=("deploy.sh" "setup-webhook.sh" "test-deploy.sh")
for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        echo "  ✅ $script исполняемый"
    else
        echo "  ❌ $script не исполняемый (запустите: chmod +x $script)"
    fi
done

# Проверка зависимостей
echo ""
echo "📦 Проверка зависимостей:"
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules установлены"
else
    echo "  ❌ node_modules не установлены (запустите: npm install)"
fi

# Проверка сборки
echo ""
echo "🏗 Проверка возможности сборки:"
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Проект собирается без ошибок"
else
    echo "  ❌ Ошибки сборки (запустите: npm run build)"
fi

# Проверка форматирования и линтинга
echo ""
echo "🎨 Проверка форматирования и линтинга:"
if npm run lint > /dev/null 2>&1; then
    echo "  ✅ Код соответствует стандартам (Prettier + ESLint)"
else
    echo "  ❌ Проблемы с форматированием (запустите: npm run format)"
fi

echo ""
echo "====================================="
echo "🎯 Следующие шаги для деплоя:"
echo "1. ./deploy.sh                    # Полный деплой"
echo "2. Настроить BOT_TOKEN в Netlify"
echo "3. ./setup-webhook.sh TOKEN URL   # Настроить webhook"
echo "4. ./test-deploy.sh URL           # Протестировать"
echo ""
echo "📚 Документация:"
echo "- README.md         # Обзор проекта"
echo "- QUICK_START.md    # Быстрый старт"
echo "- DEPLOY_GUIDE.md   # Подробная инструкция"
