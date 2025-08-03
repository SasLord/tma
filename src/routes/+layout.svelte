<script lang="ts">
  import { onMount } from 'svelte'
  import { init, miniApp } from '@telegram-apps/sdk-svelte'
  import { initializeTelegramTheme } from '$lib/telegramTheme'

  // Глобальная инициализация Telegram SDK
  const initializeTelegramSDK = async () => {
    try {
      await init()
      console.log('Telegram SDK инициализирован')

      if (miniApp.ready.isAvailable()) {
        await miniApp.ready()
        console.log('Mini App готово')
      }
    } catch (error) {
      console.error('Ошибка инициализации Telegram SDK:', error)
    }
  }

  onMount(async () => {
    // Инициализируем Telegram SDK
    await initializeTelegramSDK()

    // Инициализируем тему
    initializeTelegramTheme()
  })
</script>

<!-- Глобальный layout для всех страниц -->
<main>
  <slot />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-x: hidden;

    /* Поддержка safe areas для мобильных устройств */
    padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0)
      env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  }

  :global(html) {
    /* Улучшение отображения на мобильных устройствах */
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }

  main {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100vh;
    border: none;
    position: relative;
  }

  /* Базовые переменные цветов темы Telegram как fallback */
  :global(:root) {
    --tg-theme-bg-color: #ffffff;
    --tg-theme-text-color: #000000;
    --tg-theme-hint-color: #999999;
    --tg-theme-link-color: #2481cc;
    --tg-theme-button-color: #2481cc;
    --tg-theme-button-text-color: #ffffff;
    --tg-theme-secondary-bg-color: #f1f1f1;
    --tg-theme-header-bg-color: #ffffff;
    --tg-theme-accent-text-color: #2481cc;
    --tg-theme-section-bg-color: #ffffff;
    --tg-theme-section-header-text-color: #6d6d71;
    --tg-theme-subtitle-text-color: #999999;
    --tg-theme-destructive-text-color: #ff3b30;

    /* Переменная для динамического градиента */
    --dynamic-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* Поддержка viewport для мобильных устройств */
  @viewport {
    width: device-width;
    initial-scale: 1;
    maximum-scale: 1;
    user-scalable: no;
  }
</style>
