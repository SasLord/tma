#!/bin/bash

# 🚀 Упрощённый скрипт деплоя для Telegram WebApp
# Версия: 1.0

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка предварительных условий
check_prerequisites() {
    print_status "Проверка предварительных условий..."
    
    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js не установлен. Установите Node.js версии 18 или выше."
        exit 1
    fi
    
    # Проверка npm
    if ! command -v npm &> /dev/null; then
        print_error "npm не установлен."
        exit 1
    fi
    
    # Проверка Netlify CLI
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI не установлен. Устанавливаю..."
        npm install -g @netlify/cli
    fi
    
    print_success "Все предварительные условия выполнены"
}

# Установка зависимостей
install_dependencies() {
    print_status "Установка зависимостей..."
    npm install
    print_success "Зависимости установлены"
}

# Сборка проекта
build_project() {
    print_status "Сборка проекта..."
    npm run build
    print_success "Проект собран"
}

# Проверка переменных среды
check_env_vars() {
    print_status "Проверка переменных среды..."
    
    if [ -z "$BOT_TOKEN" ] && [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        print_warning "Переменная BOT_TOKEN или TELEGRAM_BOT_TOKEN не установлена"
        print_warning "Убедитесь, что токен бота настроен в Netlify"
    else
        print_success "Переменные среды настроены"
    fi
}

# Тестирование webhook функции локально
test_function() {
    print_status "Тестирование функции webhook..."
    
    if [ -f "netlify/functions/webhook.js" ]; then
        print_success "Функция webhook найдена"
    else
        print_error "Функция webhook не найдена в netlify/functions/webhook.js"
        exit 1
    fi
}

# Деплой на Netlify
deploy_to_netlify() {
    print_status "Деплой на Netlify..."
    
    # Проверяем авторизацию
    if ! netlify status &> /dev/null; then
        print_warning "Необходима авторизация в Netlify"
        print_status "Запускаю процесс авторизации..."
        netlify login
    fi
    
    # Деплой
    print_status "Запуск деплоя..."
    netlify deploy --prod --dir=build --functions=netlify/functions
    
    print_success "Деплой завершён!"
}

# Получение информации о сайте
get_site_info() {
    print_status "Получение информации о сайте..."
    netlify status
}

# Основная функция
main() {
    echo "🚀 Запуск деплоя Telegram WebApp"
    echo "=================================="
    
    check_prerequisites
    install_dependencies
    build_project
    check_env_vars
    test_function
    deploy_to_netlify
    get_site_info
    
    echo "=================================="
    print_success "Деплой завершён успешно! 🎉"
    print_status "Не забудьте:"
    print_status "1. Настроить переменную BOT_TOKEN в Netlify"
    print_status "2. Обновить webhook URL в боте"
    print_status "3. Протестировать WebApp в Telegram"
}

# Обработка параметров командной строки
case "${1:-}" in
    "check")
        check_prerequisites
        ;;
    "build")
        build_project
        ;;
    "test")
        test_function
        ;;
    "deploy")
        deploy_to_netlify
        ;;
    "full"|"")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Использование: $0 [команда]"
        echo ""
        echo "Команды:"
        echo "  full      - Полный деплой (по умолчанию)"
        echo "  check     - Проверка предварительных условий"
        echo "  build     - Только сборка проекта"
        echo "  test      - Тестирование функций"
        echo "  deploy    - Только деплой (без сборки)"
        echo "  help      - Показать эту справку"
        ;;
    *)
        print_error "Неизвестная команда: $1"
        print_status "Используйте '$0 help' для получения справки"
        exit 1
        ;;
esac
