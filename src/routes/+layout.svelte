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
  main {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100vh;
    border: none;
  }
</style>
