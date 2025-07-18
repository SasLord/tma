<script lang="ts">
  import { onMount } from 'svelte'
  import { addToHomeScreen, postEvent } from '@telegram-apps/sdk-svelte'

  let consEl: HTMLDivElement
  let testEl: HTMLDivElement

  const addToConsole = (message: string) => {
    const p = document.createElement('p')
    p.innerText = message
    consEl.appendChild(p)
    console.log(message)
  }

  const toHomeScreen = () => {
    addToConsole('🔄 Попытка добавления на домашний экран...')
    
    try {
      // Проверяем доступность функции из SDK
      if (addToHomeScreen.isAvailable()) {
        addToConsole('✅ addToHomeScreen доступна через SDK')
        addToHomeScreen()
        addToConsole('📤 Вызвана addToHomeScreen() из SDK')
      } else {
        addToConsole('❌ addToHomeScreen недоступна через SDK')
        
        // Пробуем через SDK postEvent
        try {
          addToConsole('📡 Пробуем SDK postEvent...')
          postEvent('web_app_add_to_home_screen')
          addToConsole('📤 Отправлен SDK postEvent("web_app_add_to_home_screen")')
        } catch (sdkError) {
          addToConsole('❌ SDK postEvent не сработал: ' + sdkError)
        }
        
        // Пробуем напрямую через Telegram WebApp API
        if (window.Telegram?.WebApp) {
          const webApp = window.Telegram.WebApp as any
          addToConsole('🔍 Проверяем Telegram WebApp API...')
          
          // Проверяем все доступные методы
          addToConsole('Доступные методы WebApp:')
          try {
            Object.getOwnPropertyNames(webApp).forEach(prop => {
              if (typeof webApp[prop] === 'function') {
                addToConsole(`  - ${prop}()`)
              }
            })
          } catch (e) {
            addToConsole('Не удалось получить список методов')
          }
          
          if (typeof webApp.addToHomeScreen === 'function') {
            addToConsole('✅ Найден webApp.addToHomeScreen, вызываем...')
            webApp.addToHomeScreen()
            addToConsole('📤 Вызвана webApp.addToHomeScreen()')
          } else {
            addToConsole('❌ webApp.addToHomeScreen не найдена')
            
            // Альтернативные попытки
            addToConsole('🔄 Пробуем альтернативные методы...')
            
            // Попытка через postEvent (для более старых версий)
            try {
              if (typeof webApp.postEvent === 'function') {
                addToConsole('📡 Пробуем postEvent...')
                webApp.postEvent('web_app_add_to_home_screen')
                addToConsole('📤 Отправлен postEvent("web_app_add_to_home_screen")')
              }
            } catch (postEventError) {
              addToConsole('❌ postEvent не сработал: ' + postEventError)
            }
            
            if (typeof webApp.showPopup === 'function') {
              addToConsole('💡 Показываем popup с инструкциями')
              webApp.showPopup({
                title: 'Добавить на главный экран',
                message: 'Для добавления приложения на главный экран:\n\n1. Откройте меню Telegram (⋮)\n2. Выберите "Добавить на главный экран"\n\nИли используйте кнопку "Поделиться" в верхнем меню.',
                buttons: [{type: 'ok', text: 'Понятно'}]
              })
            } else {
              addToConsole('📱 Инструкции: Используйте меню Telegram → "Добавить на главный экран"')
            }
          }
        } else {
          addToConsole('❌ Telegram WebApp API недоступно')
        }
      }
    } catch (error) {
      addToConsole('💥 Ошибка: ' + error)
      console.error('Полная ошибка:', error)
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
        addToConsole('--- ПОДДЕРЖКА ФУНКЦИЙ ---')
        addToConsole('Версия WebApp: ' + version)
        
        // addToHomeScreen была добавлена в версии 7.10
        const [major, minor] = version.split('.').map(Number)
        const supportsAddToHome = major > 7 || (major === 7 && minor >= 10)
        addToConsole('Поддержка addToHomeScreen: ' + (supportsAddToHome ? '✅ Да' : '❌ Нет (требуется 7.10+)'))
        
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
<button class="add-to-home-btn" on:click={() => toHomeScreen()}>
  📱 Add to HomeScreen
</button>
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

  .add-to-home-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 1rem 0;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, var(--tg-theme-button-color, #2481cc), var(--tg-theme-accent-text-color, #1a6bb8));
    color: var(--tg-theme-button-text-color, #ffffff);
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
