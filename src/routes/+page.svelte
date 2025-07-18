<script lang="ts">
  import { onMount } from 'svelte'
  import { init, miniApp, postEvent } from '@telegram-apps/sdk-svelte'

  let consEl: HTMLDivElement
  let testEl: HTMLDivElement

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
    addToConsole(`--- HASH ---`)
    for (const [key, value] of params.entries()) {
      addToConsole(`${key}: ${value}`)
    }
    const tgWebAppData = new URLSearchParams(params.get('tgWebAppData') ?? '')
    addToConsole(`--- tgWebAppData ---`)
    for (const [key, value] of tgWebAppData.entries()) {
      addToConsole(`${key}: ${value}`)
    }
    
    // Получаем и парсим тему параметры
    const stylesParam = params.get('tgWebAppThemeParams')
    let themeParams: Record<string, string> = {}
    if (stylesParam) {
      try {
        themeParams = JSON.parse(decodeURIComponent(stylesParam))
        addToConsole('Theme params: ' + JSON.stringify(themeParams))
      } catch (error) {
        addToConsole('Ошибка парсинга theme params: ' + error)
      }
    }
    
    // addToConsole('initData: ' + (window.Telegram.WebApp.initData ?? ''))
    // addToConsole('initDataUnsafe: ' + (window.Telegram.WebApp.initDataUnsafe ?? ''))
    // addToConsole('version: ' + (window.Telegram.WebApp.version ?? ''))
    // addToConsole('platform: ' + (window.Telegram.WebApp.platform ?? ''))
    // addToConsole('colorScheme: ' + (window.Telegram.WebApp.colorScheme ?? ''))
    testEl.style.backgroundColor = themeParams.bg_color ?? '#fff'
    // postEvent('web_app_setup_back_button', { is_visible: true })
  })
</script>

<h1 style="text-align: center;">TMA</h1>

<div bind:this={consEl} class="console">
  <p style="margin-bottom: .5rem; font-weight: 700;">Console</p>
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
