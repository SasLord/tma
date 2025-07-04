<script lang="ts">
  import { onMount } from 'svelte'
  import { init, miniApp, postEvent } from '@telegram-apps/sdk-svelte'

  let consEl: HTMLParagraphElement
  let consEl2: HTMLParagraphElement
  let consEl3: HTMLParagraphElement

  const initializeTelegramSDK = async () => {
    try {
      await init()


      if (miniApp.ready.isAvailable()) {
        await miniApp.ready()
        console.log('Mini App готово')
        consEl.innerText = 'Mini App готово'
      }


    } catch (error) {
      console.error('Ошибка инициализации:', error)
      consEl.innerText = 'Ошибка инициализации: ' + error
    }
  }

  onMount(() => {
    void initializeTelegramSDK()

    const hash = window.location.hash.slice(1);
    console.log(hash); // tgWebAppData=...&tgWebAppVersion=6.2&...

    const params = new URLSearchParams(hash);
    console.log(params.get('tgWebAppVersion')); // "6.2"
    consEl2.innerText = hash
    consEl3.innerText = params.get('tgWebAppVersion') ?? ''
    // postEvent('web_app_setup_back_button', { is_visible: true })
  })
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<p style="margin-top: 2rem; font-weight: 700;">Console</p>
<p bind:this={consEl}></p>
<p bind:this={consEl2}></p>
<p bind:this={consEl3}></p>
