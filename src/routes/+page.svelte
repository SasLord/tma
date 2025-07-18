<script lang="ts">
  import { onMount } from 'svelte'
  import { init, miniApp, postEvent } from '@telegram-apps/sdk-svelte'

  let consEl: HTMLParagraphElement

  const initializeTelegramSDK = async () => {
    try {
      await init()


      if (miniApp.ready.isAvailable()) {
        await miniApp.ready()
        addToConsole('Mini App готово')
      }


    } catch (error) {
      addToConsole('Ошибка инициализации: ' + error)
    }
  }

  const addToConsole = (message: string) => {
    const p = document.createElement('p')
    p.innerText = message
    consEl.appendChild(p)
    console.log(message)
  }

  onMount(() => {
    void initializeTelegramSDK()

    const hash = window.location.hash.slice(1)
    addToConsole('Hash: ' + hash) // tgWebAppData=...&tgWebAppVersion=6.2&...

    const params = new URLSearchParams(hash)
    addToConsole('tgWebAppVersion: ' + (params.get('tgWebAppVersion') ?? ''))
    addToConsole('initData: ' + ((window as any).Telegram.WebApp.initData ?? ''))
    addToConsole('initDataUnsafe: ' + ((window as any).Telegram.WebApp.initDataUnsafe ?? ''))
    addToConsole('version: ' + ((window as any).Telegram.WebApp.version ?? ''))
    addToConsole('platform: ' + ((window as any).Telegram.WebApp.platform ?? ''))
    addToConsole('colorScheme: ' + ((window as any).Telegram.WebApp.colorScheme ?? ''))
    // postEvent('web_app_setup_back_button', { is_visible: true })
  })
</script>

<h1 style="text-align: center;">TMA</h1>

<div bind:this={consEl} class="console">
  <p style="margin-bottom: .5rem; font-weight: 700;">Console</p>
</div>

<style lang="scss">
  .console {
    overflow-x: auto;
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
</style>
