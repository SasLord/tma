<script lang="ts">
  import { onMount } from 'svelte'
  import { init, miniApp } from '@telegram-apps/sdk-svelte'

  const initializeTelegramSDK = async () => {
    try {
      await init()


      if (miniApp.ready.isAvailable()) {
        await miniApp.ready()
        console.log('Mini App готово')
      }


    } catch (error) {
      console.error('Ошибка инициализации:', error)
    }
  }

  onMount(() => {
    void initializeTelegramSDK()
    const data = JSON.stringify({
      eventType: 'web_app_setup_back_button',
      eventData: {
        is_visible: true
      }
    })

    window.parent.postMessage(data, '*')
  })
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
