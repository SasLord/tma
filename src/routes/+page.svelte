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

  const showInstructions = () => {
    try {
      if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.showPopup === 'function') {
        const webApp = window.Telegram.WebApp as any
        webApp.showPopup({
          title: '📱 Как добавить на главный экран',
          message: 'Есть 2 способа:\n\n🔹 Способ 1:\n1. Нажмите ⋮ (меню) в правом верхнем углу\n2. Выберите "Добавить на главный экран"\n\n🔹 Способ 2:\n1. Нажмите кнопку "Поделиться" ↗️\n2. Выберите "Добавить на главный экран"\n\n💡 Если не видите эти опции, обновите Telegram до последней версии.',
          buttons: [
            {type: 'default', text: 'Понятно'}
          ]
        })
        addToConsole('📖 Показаны подробные инструкции')
      } else {
        addToConsole('❌ showPopup недоступен')
      }
    } catch (error) {
      addToConsole('❌ Ошибка показа инструкций: ' + error)
    }
  }

  const toHomeScreen = () => {
    addToConsole('🔄 Попытка добавления на домашний экран...')
    
    try {
      // Проверяем доступность функции из SDK
      if (addToHomeScreen.isAvailable()) {
        addToConsole('✅ addToHomeScreen доступна через SDK')
        addToHomeScreen()
        addToConsole('📤 Вызвана addToHomeScreen() из SDK')
        
        // Через секунду показываем инструкции на всякий случай
        setTimeout(() => {
          showInstructions()
        }, 1000)
        
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
          
          if (typeof webApp.addToHomeScreen === 'function') {
            addToConsole('✅ Найден webApp.addToHomeScreen, вызываем...')
            
            // Дополнительные проверки
            addToConsole('🔍 Дополнительные проверки:')
            addToConsole('- isExpanded: ' + (webApp.isExpanded ? 'Да' : 'Нет'))
            addToConsole('- viewportHeight: ' + webApp.viewportHeight)
            addToConsole('- platform: ' + webApp.platform)
            
            try {
              webApp.addToHomeScreen()
              addToConsole('📤 Вызвана webApp.addToHomeScreen()')
              
              // Через секунду показываем инструкции
              setTimeout(() => {
                showInstructions()
              }, 1000)
              
            } catch (addError) {
              addToConsole('❌ Ошибка при вызове addToHomeScreen: ' + addError)
              showInstructions()
            }
          } else {
            addToConsole('❌ webApp.addToHomeScreen не найдена')
            showInstructions()
          }
        } else {
          addToConsole('❌ Telegram WebApp API недоступно')
          showInstructions()
        }
      }
    } catch (error) {
      addToConsole('💥 Ошибка: ' + error)
      console.error('Полная ошибка:', error)
      showInstructions()
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
        
        // addToHomeScreen была добавлена в версии 7.10
        const [major, minor] = version.split('.').map(Number)
        const supportsAddToHome = major > 7 || (major === 7 && minor >= 10)
        addToConsole('Поддержка addToHomeScreen: ' + (supportsAddToHome ? '✅ Да' : '❌ Нет (требуется 7.10+)'))
        
        // Проверяем платформу
        const supportedPlatforms = ['ios', 'android', 'macos', 'windows', 'linux']
        const platformSupported = supportedPlatforms.includes(platform.toLowerCase())
        addToConsole('Платформа поддерживается: ' + (platformSupported ? '✅ Да' : '❓ Возможно нет'))
        
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

  .add-to-home-btn, .instructions-btn {
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
