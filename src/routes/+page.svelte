<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { backButton } from '@telegram-apps/sdk-svelte'
  import {
    showSendDataButton,
    hideMainButton,
    initializeTelegramSDK,
    getTelegramCapabilities,
    getTelegramUser,
    showNotification,
    setDebugCallback,
    getPlatform
  } from '$lib/telegram'

  interface Service {
    id: string
    name: string
    price: number
    selected: boolean
  }

  let services: Service[] = [
    { id: '1', name: 'Уборка квартиры', price: 3000, selected: false },
    { id: '2', name: 'Мытье окон', price: 1500, selected: false },
    { id: '3', name: 'Химчистка дивана', price: 2500, selected: false },
    { id: '4', name: 'Уборка после ремонта', price: 5000, selected: false }
  ]

  let showSuccessMessage = false
  let isMainButtonShown = false
  let telegramCapabilities: ReturnType<typeof getTelegramCapabilities> | null = null
  let telegramUser: ReturnType<typeof getTelegramUser> | null = null
  let isSDKInitialized = false
  let platformInfo = ''
  let isUserAdmin = false

  // Система отладки для мобильных устройств
  let debugMessages: { time: string; type: 'info' | 'error' | 'warn'; message: string }[] = []
  let lastError: string | null = null

  function addDebugMessage(type: 'info' | 'error' | 'warn', message: string) {
    const timestamp = new Date().toLocaleTimeString()
    debugMessages = [...debugMessages.slice(-9), { time: timestamp, type, message }] // Оставляем последние 10 сообщений

    if (type === 'error') {
      lastError = message
    }
  }

  $: selectedServices = services.filter((s) => s.selected)
  $: totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0)
  $: hasSelectedServices = selectedServices.length > 0

  function toggleService(serviceId: string) {
    console.log('Toggling service:', serviceId)
    services = services.map((service) =>
      service.id === serviceId ? { ...service, selected: !service.selected } : service
    )

    console.log('Updated services:', services)
  }

  function handleOrderSuccess() {
    addDebugMessage('info', 'Order success handler called')

    // Показываем сообщение об успехе
    showSuccessMessage = true

    // Очищаем выбор после успешного заказа
    services = services.map((service) => ({ ...service, selected: false }))

    // Показать уведомление через SDK
    if (isSDKInitialized) {
      try {
        showNotification(
          'Заказ отправлен',
          'Администратор свяжется с вами в ближайшее время.',
          'success'
        )
        addDebugMessage('info', 'SDK notification shown')
      } catch (error) {
        addDebugMessage('error', `SDK notification failed: ${error}`)
      }
    } else {
      addDebugMessage('warn', 'SDK not initialized, cannot show notification')
    }

    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
      showSuccessMessage = false
    }, 5000)
  }

  // Проверка административных прав
  async function checkAdminStatus() {
    if (!telegramUser?.id) {
      addDebugMessage('warn', 'No telegram user ID available for admin check')
      return
    }

    addDebugMessage('info', `Checking admin status for user ID: ${telegramUser.id}`)

    try {
      // Определяем URL API в зависимости от окружения
      const apiUrl =
        browser && window.location.hostname === 'localhost'
          ? 'http://localhost:8888/.netlify/functions/webhook'
          : 'https://tma-webapp-store.netlify.app/.netlify/functions/webhook'

      addDebugMessage('info', `Making request to: ${apiUrl}`)

      const requestBody = {
        action: 'check_admin',
        user: telegramUser
      }

      addDebugMessage('info', `Request body: ${JSON.stringify(requestBody)}`)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      addDebugMessage('info', `Response status: ${response.status}`)

      if (response.ok) {
        const result = await response.json()
        addDebugMessage('info', `Response body: ${JSON.stringify(result)}`)
        isUserAdmin = result.isAdmin || result.isSuperAdmin
        addDebugMessage(
          'info',
          `Final admin status: ${isUserAdmin} (isAdmin: ${result.isAdmin}, isSuperAdmin: ${result.isSuperAdmin})`
        )
      } else {
        const errorText = await response.text()
        addDebugMessage('error', `HTTP error ${response.status}: ${errorText}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addDebugMessage('error', `Admin check failed: ${errorMessage}`)
    }
  }

  // Инициализация при монтировании
  onMount(async () => {
    if (browser) {
      // Устанавливаем callback для отладочных сообщений
      setDebugCallback((type, message) => {
        addDebugMessage(type, message)
      })

      try {
        addDebugMessage('info', 'Starting Telegram WebApp initialization...')

        // Инициализация SDK
        await initializeTelegramSDK()
        isSDKInitialized = true
        addDebugMessage('info', 'SDK initialized successfully')

        // Применяем цвета темы Telegram
        applyTelegramTheme()

        // Скрываем кнопку "Назад" на главной странице (должен быть только крестик)
        try {
          if (backButton.hide.isAvailable()) {
            backButton.hide()
            addDebugMessage('info', 'Back button hidden on main page')
          }
        } catch (error) {
          addDebugMessage('warn', `Failed to hide back button: ${error}`)
        }

        // Получение информации о возможностях
        telegramCapabilities = getTelegramCapabilities()
        telegramUser = getTelegramUser()
        platformInfo = getPlatform()

        addDebugMessage('info', `User: ${telegramUser?.first_name || 'Unknown'}`)
        addDebugMessage('info', `Platform: ${platformInfo}`)
        addDebugMessage('info', `Capabilities: ${JSON.stringify(telegramCapabilities)}`)

        // Проверяем права администратора
        if (telegramUser?.id) {
          addDebugMessage('info', `Found user ID: ${telegramUser.id}, checking admin status...`)
          await checkAdminStatus()
        } else {
          addDebugMessage('warn', 'No user ID found, cannot check admin status')
        }

        console.log('📊 Telegram capabilities:', telegramCapabilities)
        console.log('👤 Telegram user:', telegramUser)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        addDebugMessage('error', `SDK initialization failed: ${errorMessage}`)
        console.error('❌ Failed to initialize Telegram SDK:', error)
      }
    }
  })

  // Функция для применения цветов темы Telegram
  function applyTelegramTheme() {
    try {
      const webApp = window.Telegram?.WebApp
      if (webApp?.themeParams) {
        const themeParams = webApp.themeParams
        addDebugMessage('info', `Applying Telegram theme: ${JSON.stringify(themeParams)}`)

        const root = document.documentElement

        // Применяем цвета темы Telegram к CSS переменным
        if (themeParams.bg_color) {
          root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color)
        }
        if (themeParams.text_color) {
          root.style.setProperty('--tg-theme-text-color', themeParams.text_color)
        }
        if (themeParams.hint_color) {
          root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color)
        }
        if (themeParams.link_color) {
          root.style.setProperty('--tg-theme-link-color', themeParams.link_color)
        }
        if (themeParams.button_color) {
          root.style.setProperty('--tg-theme-button-color', themeParams.button_color)
        }
        if (themeParams.button_text_color) {
          root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color)
        }
        if (themeParams.secondary_bg_color) {
          root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color)
        }

        // Создаем динамический градиент на основе цветов темы
        const primaryColor = themeParams.link_color || '#667eea'
        const secondaryColor = themeParams.button_color || '#764ba2'
        root.style.setProperty(
          '--dynamic-gradient',
          `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        )

        addDebugMessage('info', 'Telegram theme applied successfully')
      } else {
        addDebugMessage('warn', 'No theme params available, using default theme')
        // Устанавливаем дефолтный градиент
        document.documentElement.style.setProperty(
          '--dynamic-gradient',
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        )
      }
    } catch (error) {
      addDebugMessage('error', `Failed to apply Telegram theme: ${error}`)
      // Устанавливаем дефолтный градиент в случае ошибки
      document.documentElement.style.setProperty(
        '--dynamic-gradient',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      )
    }
  }

  // Очистка при размонтировании
  onDestroy(() => {
    if (browser && isSDKInitialized) {
      hideMainButton()
    }
  })

  // Реактивное обновление главной кнопки
  $: {
    if (browser && isSDKInitialized) {
      console.log('=== Button state check ===')
      console.log('hasSelectedServices:', hasSelectedServices)
      console.log('selectedServices:', selectedServices)
      console.log('selectedServices.length:', selectedServices.length)
      console.log('isMainButtonShown:', isMainButtonShown)

      if (hasSelectedServices) {
        console.log('Should show button with services:', selectedServices)
        addDebugMessage('info', `Showing button for ${selectedServices.length} services`)

        const serviceOrders = selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price
        }))
        console.log('Service orders mapped:', serviceOrders)

        try {
          // Показываем кнопку с актуальными данными
          showSendDataButton(serviceOrders, handleOrderSuccess)
          isMainButtonShown = true
          addDebugMessage('info', 'Main button shown successfully')
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          addDebugMessage('error', `Button show failed: ${errorMessage}`)
        }
      } else {
        console.log('Should hide button - no services selected')
        if (isMainButtonShown) {
          try {
            hideMainButton()
            isMainButtonShown = false
            addDebugMessage('info', 'Main button hidden')
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            addDebugMessage('error', `Button hide failed: ${errorMessage}`)
          }
        }
      }
    }
  }
</script>

<div class="services-page">
  <div class="container">
    <h1>Выберите услуги</h1>

    <!-- Админская ссылка -->
    {#if isUserAdmin}
      <div class="admin-link">
        <a href="/admin" class="admin-button"> 🔐 Административная панель </a>
      </div>
    {/if}

    <!-- Уведомление об успехе -->
    {#if showSuccessMessage}
      <div class="success-message">
        ✅ Заказ отправлен! Администратор свяжется с вами в ближайшее время.
      </div>
    {/if}

    <div class="services-section">
      <div class="services-list">
        {#each services as service (service.id)}
          <label class="service-item" class:selected={service.selected}>
            <input
              type="checkbox"
              checked={service.selected}
              on:change={(e) => {
                console.log('Checkbox changed:', service.id, e.currentTarget.checked)
                toggleService(service.id)
              }}
            />
            <div class="service-content">
              <h3>{service.name}</h3>
              <span class="price">{service.price.toLocaleString()} ₽</span>
            </div>
          </label>
        {/each}
      </div>

      {#if hasSelectedServices}
        <div class="summary">
          <h3>Выбрано услуг: {selectedServices.length}</h3>
          <div class="total">
            Итого: <strong>{totalPrice.toLocaleString()} ₽</strong>
          </div>

          <div class="selected-services">
            {#each selectedServices as service (service.id)}
              <div class="selected-service">
                {service.name} - {service.price.toLocaleString()} ₽
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <p>Выберите услуги для заказа</p>
        </div>
      {/if}
    </div>

    <!-- Отладочная информация -->
    <div class="debug-info">
      <p><strong>System Status:</strong></p>
      <p>Selected services: {selectedServices.length}</p>
      <p>Has selections: {hasSelectedServices}</p>
      <p>Main button shown: {isMainButtonShown}</p>
      <p>SDK initialized: {isSDKInitialized ? 'Yes' : 'No'}</p>
      <p>User is admin: {isUserAdmin ? 'Yes' : 'No'}</p>
      <p><strong>Platform:</strong> {platformInfo}</p>
      <p><strong>User Agent:</strong> {navigator?.userAgent?.substring(0, 50) || 'Unknown'}...</p>

      {#if lastError}
        <p style="color: #ff6b6b;"><strong>Last Error:</strong> {lastError}</p>
      {/if}

      {#if telegramCapabilities}
        <p><strong>Capabilities:</strong> {JSON.stringify(telegramCapabilities, null, 2)}</p>
      {/if}

      {#if telegramUser}
        <p><strong>User:</strong> {telegramUser.first_name} {telegramUser.last_name || ''}</p>
        <p><strong>User ID:</strong> {telegramUser.id}</p>
      {/if}

      <p>
        <strong>Services state:</strong>
        {JSON.stringify(services.map((s) => ({ id: s.id, selected: s.selected })))}
      </p>

      {#if debugMessages.length > 0}
        <div style="margin-top: 10px; border-top: 1px solid #777; padding-top: 10px;">
          <p><strong>Debug Log:</strong></p>
          {#each debugMessages as msg}
            <div
              style="margin: 2px 0; padding: 2px 5px; border-radius: 3px; 
              background: {msg.type === 'error'
                ? '#ff6b6b'
                : msg.type === 'warn'
                  ? '#ffa726'
                  : '#4caf50'}; 
              color: white; font-size: 10px;"
            >
              [{msg.time}] {msg.type.toUpperCase()}: {msg.message}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .services-page {
    background: var(--dynamic-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
    min-height: 100vh;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

    /* Отступы для полноэкранного режима */
    padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right))
      max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));

    /* Дополнительные отступы для мобильных устройств в полноэкранном режиме */
    padding-top: max(20px, env(safe-area-inset-top, 20px));
    padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
  }

  h1 {
    text-align: center;
    font-size: 2rem;
    margin: 0 0 30px 0;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .success-message {
    background: rgba(81, 207, 102, 0.2);
    border: 2px solid #51cf66;
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    text-align: center;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  }

  .admin-link {
    text-align: center;
    margin-bottom: 30px;
  }

  .admin-button {
    display: inline-block;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    padding: 12px 24px;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .admin-button:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .services-section {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 25px;
    backdrop-filter: blur(10px);
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .services-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 25px;
  }

  .service-item {
    display: flex;
    align-items: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid rgba(255, 255, 255, 0.2);
    position: relative;
  }

  .service-item:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .service-item.selected {
    /* Яркое выделение для выбранных услуг */
    border-color: var(--tg-theme-button-color, #ffffff);
    background: rgba(255, 255, 255, 0.25);
    box-shadow:
      0 5px 15px rgba(0, 0, 0, 0.2),
      0 0 0 2px var(--tg-theme-button-color, #ffffff),
      inset 0 0 20px rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .service-item.selected::before {
    content: '✓';
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--tg-theme-button-color, #ffffff);
    color: var(--tg-theme-button-text-color, #000000);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .service-item input[type='checkbox'] {
    width: 20px;
    height: 20px;
    margin-right: 15px;
    accent-color: var(--tg-theme-button-color, white);
    cursor: pointer;
    transform: scale(1.2);
  }

  .service-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .service-content h3 {
    margin: 0;
    color: white;
    font-size: 16px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .service-content .price {
    font-weight: bold;
    color: white;
    font-size: 18px;
    opacity: 0.95;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .service-item.selected .service-content h3,
  .service-item.selected .service-content .price {
    color: white;
    opacity: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .summary {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .summary h3 {
    margin: 0 0 15px 0;
    color: white;
    font-size: 1.2rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .total {
    font-size: 18px;
    margin-bottom: 15px;
    color: white;
  }

  .total strong {
    color: white;
    font-size: 20px;
    opacity: 0.95;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .selected-services {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .selected-service {
    padding: 10px 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 14px;
    color: white;
    opacity: 0.9;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }

  .debug-info {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    padding: 10px;
    margin: 20px 0;
    border-radius: 8px;
    font-size: 12px;
    max-height: 300px;
    overflow-y: auto;
  }

  /* Улучшенная адаптивность для мобильных устройств */
  @media (max-width: 480px) {
    .services-page {
      padding: max(15px, env(safe-area-inset-top, 15px)) max(15px, env(safe-area-inset-right, 15px))
        max(15px, env(safe-area-inset-bottom, 15px)) max(15px, env(safe-area-inset-left, 15px));
    }

    .container {
      padding: 0;
    }

    h1 {
      font-size: 1.5rem;
      margin-bottom: 20px;
    }

    .services-section {
      padding: 20px;
    }

    .service-item {
      padding: 15px;
      padding-right: 40px; /* Место для галочки */
    }

    .service-item.selected::before {
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      font-size: 12px;
    }

    .service-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .service-content .price {
      font-size: 16px;
    }

    .summary {
      padding: 15px;
    }
  }

  /* Дополнительные стили для улучшения видимости на разных темах */
  @media (prefers-color-scheme: dark) {
    .service-item.selected {
      box-shadow:
        0 5px 15px rgba(0, 0, 0, 0.4),
        0 0 0 2px var(--tg-theme-button-color, #ffffff),
        inset 0 0 20px rgba(255, 255, 255, 0.2);
    }
  }

  /* Специальные стили для полноэкранного режима */
  @supports (padding: max(0px)) {
    .services-page {
      padding-top: max(20px, env(safe-area-inset-top));
      padding-bottom: max(
        80px,
        env(safe-area-inset-bottom)
      ); /* Больше места снизу для кнопки Telegram */
    }
  }
</style>
