<script lang="ts">
  import { onMount } from 'svelte'
  import { checkHomeScreenStatus, postEvent } from '@telegram-apps/sdk-svelte'

  let consEl: HTMLDivElement
  let testEl: HTMLDivElement

  const addToConsole = (message: string) => {
    const p = document.createElement('p')
    p.innerText = message
    consEl.appendChild(p)
    console.log(message)
  }

  const showSimpleInstructions = () => {
    try {
      if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.showAlert === 'function') {
        const webApp = window.Telegram.WebApp as any
        webApp.showAlert('В Telegram Desktop:\n1. Откройте меню приложения\n2. Нажмите "Установить"\n\nВ Telegram Mobile:\n1. Откройте меню чата с ботом\n2. Найдите пункт "Добавить на главный экран"\n\nЕсли пункта нет - функция недоступна для этого бота.')
        addToConsole('📖 Показан простой alert с правильными инструкциями')
      } else {
        addToConsole('📱 Простые инструкции: В Desktop - меню → "Установить", в Mobile - меню чата с ботом')
      }
    } catch (error) {
      addToConsole('❌ Ошибка простых инструкций: ' + error)
    }
  }

  const showInstructions = () => {
    try {
      if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.showPopup === 'function') {
        const webApp = window.Telegram.WebApp as any
        
        // Правильный формат для Telegram WebApp popup
        webApp.showPopup({
          title: 'Добавить на главный экран',
          message: 'Telegram Desktop:\n1. Меню приложения → "Установить"\n\nTelegram Mobile:\n1. Откройте профиль бота\n2. Меню → "Добавить на главный экран"\n\nЕсли пункт отсутствует:\n- Обновите Telegram\n- Функция может быть недоступна для этого бота\n- Попробуйте в другом клиенте Telegram',
          buttons: [{
            id: 'ok',
            type: 'ok',
            text: 'Понятно'
          }]
        }, (buttonId: string) => {
          addToConsole('Пользователь нажал кнопку: ' + buttonId)
        })
        addToConsole('📖 Показаны подробные инструкции')
      } else {
        addToConsole('❌ showPopup недоступен')
        
        // Альтернативный способ - через alert
        if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.showAlert === 'function') {
          const webApp = window.Telegram.WebApp as any
          webApp.showAlert('Для добавления на главный экран:\n\n1. Нажмите меню ⋮\n2. Выберите "Добавить на главный экран"\n\nИли используйте кнопку "Поделиться"')
          addToConsole('📖 Показан alert с инструкциями')
        } else {
          addToConsole('📱 Инструкции: Используйте меню Telegram (⋮) → "Добавить на главный экран"')
        }
      }
    } catch (error) {
      addToConsole('❌ Ошибка показа инструкций: ' + error)
      
      // Fallback - показываем через обычный alert браузера
      try {
        alert('Для добавления на главный экран:\n\n1. Нажмите меню ⋮ в правом верхнем углу\n2. Выберите "Добавить на главный экран"')
        addToConsole('📖 Показан browser alert')
      } catch (alertError) {
        addToConsole('❌ Даже browser alert не работает: ' + alertError)
      }
    }
  }

  const checkAddToHomeScreenRequirements = () => {
    addToConsole('🔍 ПРОВЕРКА ТРЕБОВАНИЙ ДЛЯ addToHomeScreen:')
    
    try {
      if (!window.Telegram?.WebApp) {
        addToConsole('❌ Telegram WebApp API недоступно')
        return false
      }
      
      const webApp = window.Telegram.WebApp as any
      
      // 1. Проверка версии
      const version = webApp.version || '0.0'
      const versionParts = version.split('.')
      const major = parseInt(versionParts[0]) || 0
      const minor = parseInt(versionParts[1]) || 0
      const hasRequiredVersion = major > 7 || (major === 7 && minor >= 10)
      addToConsole('1. Версия ' + version + ': ' + (hasRequiredVersion ? '✅' : '❌ Нужна 7.10+'))
      
      // 2. Проверка платформы
      const platform = webApp.platform || 'unknown'
      const isMobile = platform === 'android' || platform === 'ios'
      const isDesktop = platform === 'macos' || platform === 'windows' || platform === 'linux'
      addToConsole('2. Платформа ' + platform + ': ' + (isMobile || isDesktop ? '✅' : '❓'))
      
      // 3. Проверка развёрнутости приложения
      const isExpanded = webApp.isExpanded
      addToConsole('3. Приложение развёрнуто: ' + (isExpanded ? '✅' : '❌'))
      
      // 4. Проверка наличия функции
      const hasFunction = typeof webApp.addToHomeScreen === 'function'
      addToConsole('4. Функция существует: ' + (hasFunction ? '✅' : '❌'))
      
      // 5. Проверка URL параметров
      const hasStartParam = window.location.href.includes('tgWebAppStartParam')
      addToConsole('5. StartParam в URL: ' + (hasStartParam ? '✅' : '❓ Не обязательно'))
      
      // 6. Проверка initData
      const hasInitData = !!webApp.initData
      addToConsole('6. InitData присутствует: ' + (hasInitData ? '✅' : '❌'))
      
      const allRequirementsMet = hasRequiredVersion && (isMobile || isDesktop) && hasFunction && hasInitData
      addToConsole('🎯 ИТОГОВАЯ ОЦЕНКА: ' + (allRequirementsMet ? '✅ Должно работать' : '❌ Требования не выполнены'))
      
      if (!allRequirementsMet) {
        addToConsole('💡 ВОЗМОЖНЫЕ ПРИЧИНЫ:')
        if (!hasRequiredVersion) addToConsole('  - Обновите Telegram до последней версии')
        if (!hasFunction) addToConsole('  - Функция не поддерживается в данной версии/платформе')
        if (!hasInitData) addToConsole('  - Приложение запущено не через бота')
        if (!isExpanded) addToConsole('  - Попробуйте развернуть приложение на полный экран')
      }
      
      return allRequirementsMet
      
    } catch (error) {
      addToConsole('❌ Ошибка проверки требований: ' + error)
      return false
    }
  }

  const toHomeScreen = () => {
    addToConsole('🔄 Попытка добавления на домашний экран...')
    
    if (checkHomeScreenStatus.isAvailable()) {
      checkHomeScreenStatus().then(status => {
        addToConsole('checkHomeScreenStatus: ' + status)
      })
    }

    try {
      addToConsole('📡 Пробуем SDK postEvent...')
      postEvent('web_app_add_to_home_screen')
      addToConsole('📤 Отправлен SDK postEvent("web_app_add_to_home_screen")')
    } catch (sdkError) {
      addToConsole('❌ SDK postEvent не сработал: ' + sdkError)
    }
  }

  onMount(() => {
    const hash = window.location.hash.slice(1)
    addToConsole('Hash: ' + hash)

    const params = new URLSearchParams(hash)
    addToConsole('tgWebAppVersion: ' + (params.get('tgWebAppVersion') ?? ''))
    addToConsole(`--- HASH PARAMS ---`)
    for (const [key, value] of params.entries()) {
      addToConsole(`${key}: ${value}`)
    }
    
    const tgWebAppData = new URLSearchParams(params.get('tgWebAppData') ?? '')
    addToConsole(`--- tgWebAppData ---`)
    for (const [key, value] of tgWebAppData.entries()) {
      addToConsole(`${key}: ${value}`)
    }
    
    // Отображаем информацию о Telegram WebApp (если доступно)
    try {
      if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp
        addToConsole('--- TELEGRAM WEBAPP ---')
        addToConsole('initData: ' + (webApp.initData || 'не найдено'))
        addToConsole('version: ' + (webApp.version || 'не найдено'))
        addToConsole('platform: ' + (webApp.platform || 'не найдено'))
        addToConsole('colorScheme: ' + (webApp.colorScheme || 'не найдено'))
        
        // Проверяем поддержку addToHomeScreen
        const version = webApp.version || '0.0'
        const platform = webApp.platform || 'unknown'
        addToConsole('--- ПОДДЕРЖКА ФУНКЦИЙ ---')
        addToConsole('Версия WebApp: ' + version)
        addToConsole('Платформа: ' + platform)
        addToConsole('isExpanded: ' + (webApp.isExpanded ? 'Да' : 'Нет'))
        addToConsole('viewportHeight: ' + webApp.viewportHeight)
        
        // addToHomeScreen была добавлена в версии 7.10
        const versionParts = version.split('.')
        const major = parseInt(versionParts[0]) || 0
        const minor = parseInt(versionParts[1]) || 0
        const supportsAddToHome = major > 7 || (major === 7 && minor >= 10)
        addToConsole('Поддержка addToHomeScreen: ' + (supportsAddToHome ? '✅ Да' : '❌ Нет (требуется 7.10+)'))
        
        // Проверяем платформу
        const supportedPlatforms = ['ios', 'android', 'macos', 'windows', 'linux']
        const platformSupported = supportedPlatforms.includes(platform.toLowerCase())
        addToConsole('Платформа поддерживается: ' + (platformSupported ? '✅ Да' : '❓ Возможно нет'))
        
        // Дополнительные проверки
        addToConsole('--- ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА ---')
        addToConsole('User-Agent: ' + navigator.userAgent.substring(0, 50) + '...')
        addToConsole('URL содержит tgWebAppStartParam: ' + (window.location.href.includes('tgWebAppStartParam') ? 'Да' : 'Нет'))
        addToConsole('Доступные методы WebApp:')
        
        try {
          const webAppAny = webApp as any
          const methods = Object.getOwnPropertyNames(webAppAny).filter(prop => 
            typeof webAppAny[prop] === 'function'
          ).slice(0, 10) // показываем только первые 10
          methods.forEach(method => addToConsole('  - ' + method + '()'))
          if (methods.length === 10) addToConsole('  ... и другие')
        } catch (e) {
          addToConsole('  Не удалось получить список методов')
        }
        
        // Устанавливаем цвет фона тестового элемента
        const bgColor = webApp.themeParams?.bg_color || 
                       getComputedStyle(document.documentElement).getPropertyValue('--tg-theme-bg-color') || 
                       '#fff'
        testEl.style.backgroundColor = bgColor
      } else {
        addToConsole('Telegram WebApp API недоступно')
        testEl.style.backgroundColor = '#f0f0f0'
      }
    } catch (error) {
      addToConsole('Ошибка доступа к Telegram WebApp: ' + error)
    }
  })
</script>

<h1 style="text-align: center;">TMA</h1>

<div bind:this={consEl} class="console">
  <p style="margin-bottom: .5rem; font-weight: 700;">Console</p>
</div>

<div class="buttons">
  <button class="add-to-home-btn" on:click={() => toHomeScreen()}>
    📱 Add to HomeScreen
  </button>
  <button class="instructions-btn" on:click={() => showInstructions()}>
    📖 Show Instructions
  </button>
  <button class="simple-btn" on:click={() => showSimpleInstructions()}>
    💡 Simple Help
  </button>
  <button class="check-btn" on:click={() => checkAddToHomeScreenRequirements()}>
    🔍 Check Requirements
  </button>
</div>

<div class="test-vars">
  <div></div>
  <div bind:this={testEl}></div>
</div>

<style lang="scss">
  .console {
    overflow: auto;
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
    padding: 1rem;
    width: 100%;
    max-height: 50svh;
    color: #fff;
    background-color: #000;
    border: 1px solid #aaa;
    border-radius: .5rem;

    p:not(:first-child) {
      margin: .25rem 0;
    }
  }

  .buttons {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  }

  .add-to-home-btn, .instructions-btn, .simple-btn, .check-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
  }

  .add-to-home-btn {
    background: linear-gradient(135deg, var(--tg-theme-button-color, #2481cc), var(--tg-theme-accent-text-color, #1a6bb8));
    color: var(--tg-theme-button-text-color, #ffffff);
  }

  .instructions-btn {
    background: linear-gradient(135deg, var(--tg-theme-secondary-bg-color, #f1f1f1), var(--tg-theme-hint-color, #999999));
    color: var(--tg-theme-text-color, #000000);
  }

  .simple-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: #ffffff;
  }

  .check-btn {
    background: linear-gradient(135deg, #ffc107, #fd7e14);
    color: #212529;
  }

  .test-vars {
    display: flex;
    width: 100%;
    height: 5rem;

    div {
      width: 50%;
      height: 100%;
      border: 1px solid #aaa;

      &:first-child {
        background-color: var(--tg-theme-secondary-bg-color);
      }
    }
  }
</style>
