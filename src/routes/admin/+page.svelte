<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { backButton } from '@telegram-apps/sdk-svelte'

  interface Order {
    id: number
    user_id: string
    user_name: string
    username: string | null
    total_price: number
    platform: string
    status: string
    created_at: string
    services: Array<{
      id: string
      name: string
      price: number
    }>
  }

  interface Admin {
    id: string
    user_id: string
    name: string
    username: string | null
    is_super_admin: boolean
    created_at: string
  }

  interface User {
    id: number
    first_name: string
    last_name?: string
    username?: string
  }

  let user: User | null = null
  let orders: Order[] = []
  let admins: Admin[] = []
  let loading = true
  let ordersLoading = false
  let adminsLoading = false
  let error = ''
  let success = ''
  let isAdmin = false
  let isSuperAdmin = false
  let activeSection: 'orders' | 'admins' = 'orders'

  // Поля для добавления админа
  let newAdminId = ''
  let newAdminName = ''
  let newAdminUsername = ''
  let loadingUserData = false

  onMount(async () => {
    if (browser) {
      // Настройка кнопки "Назад" в Telegram WebApp
      try {
        if (backButton.mount.isAvailable()) {
          backButton.mount()
          backButton.show()

          // Настраиваем обработчик клика для возврата на главную страницу
          const unsubscribe = backButton.onClick(() => {
            goto('/')
          })

          // Сохраняем функцию отписки для cleanup
          backButtonCleanup = () => {
            unsubscribe()
            if (backButton.hide.isAvailable()) {
              backButton.hide()
            }
          }
        }
      } catch (error) {
        console.error('Failed to setup back button:', error)
      }

      try {
        // Пытаемся получить пользователя из Telegram WebApp
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          user = window.Telegram.WebApp.initDataUnsafe.user
        } else {
          // Fallback для тестирования - используем тестового пользователя
          user = { id: 1155907659, first_name: 'Admin', username: 'admin' }
        }

        if (!user?.id) {
          error = 'Не удалось получить данные пользователя'
          loading = false
          return
        }

        await checkAdminStatus()

        if (isAdmin) {
          await loadOrders()
          await loadAdmins()
        }
      } catch (err) {
        console.error('Initialization error:', err)
        error = 'Ошибка инициализации: ' + (err instanceof Error ? err.message : String(err))
      } finally {
        loading = false
      }
    }
  })

  let backButtonCleanup: (() => void) | null = null

  onDestroy(() => {
    if (backButtonCleanup) {
      backButtonCleanup()
    }
  })

  // Функция для красивого отображения платформы
  function formatPlatform(platform: string): { icon: string; text: string; title: string } {
    // Анализируем строку платформы
    const isActive = platform.includes('active')
    const isMobile = platform.includes('mobile')
    const isDesktop = platform.includes('desktop')
    const isWeb = platform.includes('web')
    const isTelegram = platform.includes('telegram_webapp')

    // Определяем иконку
    let icon = '🌐' // По умолчанию
    let text = 'Неизв.'
    let title = platform // Полное название в tooltip

    if (isTelegram) {
      if (isMobile) {
        icon = '📱'
        text = 'Мобильный'
      } else if (isDesktop) {
        icon = '💻'
        text = 'Десктоп'
      } else if (isWeb) {
        icon = '🌐'
        text = 'Веб'
      } else {
        icon = '✈️'
        text = 'Telegram'
      }

      // Добавляем статус активности
      if (!isActive) {
        icon = '⚫' + icon
        text = 'Неакт. ' + text
      }
    } else {
      // Другие платформы
      text = platform.length > 10 ? platform.substring(0, 8) + '...' : platform
    }

    return { icon, text, title }
  }

  async function checkAdminStatus() {
    try {
      const response = await fetch(
        'https://tma-webapp-store.netlify.app/.netlify/functions/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check_admin',
            user: user
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        isAdmin = result.isAdmin
        isSuperAdmin = result.isSuperAdmin
      }
    } catch (err) {
      console.error('Admin check error:', err)
      isAdmin = false
      isSuperAdmin = false
    }
  }

  async function loadOrders() {
    ordersLoading = true
    try {
      const response = await fetch(
        'https://tma-webapp-store.netlify.app/.netlify/functions/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_orders',
            user: user
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        orders = result.orders || []
      }
    } catch (err) {
      console.error('Load orders error:', err)
    } finally {
      ordersLoading = false
    }
  }

  async function loadAdmins() {
    adminsLoading = true
    try {
      const response = await fetch(
        'https://tma-webapp-store.netlify.app/.netlify/functions/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_admins',
            user: user
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        admins = result.admins || []
      }
    } catch (err) {
      console.error('Load admins error:', err)
    } finally {
      adminsLoading = false
    }
  }

  async function addAdmin() {
    if (!newAdminId.trim() || !newAdminName.trim()) {
      error = 'Заполните ID и имя'
      return
    }

    if (!/^\d+$/.test(newAdminId.trim())) {
      error = 'ID должен содержать только цифры'
      return
    }

    try {
      const response = await fetch(
        'https://tma-webapp-store.netlify.app/.netlify/functions/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_admin',
            user: user,
            targetUserId: newAdminId.trim(),
            targetUserName: newAdminName.trim(),
            targetUsername: newAdminUsername.trim() || null
          })
        }
      )

      const result = await response.json()

      if (result.success) {
        success = 'Администратор добавлен успешно!'
        newAdminId = ''
        newAdminName = ''
        newAdminUsername = ''
        await loadAdmins()
      } else {
        error = result.error || 'Ошибка при добавлении администратора'
      }
    } catch (err) {
      error = 'Ошибка сети: ' + (err instanceof Error ? err.message : String(err))
    }
  }

  async function getUserDataById() {
    if (!newAdminId.trim()) {
      error = 'Введите ID пользователя'
      return
    }

    if (!/^\d+$/.test(newAdminId.trim())) {
      error = 'ID должен содержать только цифры'
      return
    }

    loadingUserData = true

    try {
      const response = await fetch(
        'https://tma-webapp-store.netlify.app/.netlify/functions/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_user_data',
            user: user,
            targetUserId: newAdminId.trim()
          })
        }
      )

      const result = await response.json()

      if (result.success && result.userData) {
        if (!newAdminName.trim()) {
          newAdminName =
            result.userData.first_name +
            (result.userData.last_name ? ' ' + result.userData.last_name : '')
        }
        if (!newAdminUsername.trim() && result.userData.username) {
          newAdminUsername = result.userData.username
        }
        success = 'Данные пользователя загружены!'
      } else {
        error = result.error || 'Пользователь не найден или нет доступа к его данным'
      }
    } catch (err) {
      error = 'Ошибка получения данных: ' + (err instanceof Error ? err.message : String(err))
    } finally {
      loadingUserData = false
    }
  }
  async function removeAdmin(adminId: string) {
    if (!confirm('Удалить администратора?')) return

    try {
      const response = await fetch(
        'https://tma-webapp-store.netlify.app/.netlify/functions/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'remove_admin',
            user: user,
            targetUserId: adminId
          })
        }
      )

      const result = await response.json()

      if (result.success) {
        success = 'Администратор удален успешно!'
        await loadAdmins()
      } else {
        error = result.error || 'Ошибка при удалении администратора'
      }
    } catch (err) {
      error = 'Ошибка сети: ' + (err instanceof Error ? err.message : String(err))
    }
  }

  async function clearAllOrders() {
    if (!confirm('Удалить ВСЕ заказы? Это действие нельзя отменить!')) return

    try {
      const response = await fetch(
        'https://tma-webapp-store.netlify.app/.netlify/functions/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clear_orders',
            user: user
          })
        }
      )

      const result = await response.json()

      if (result.success) {
        success = 'Все заказы удалены успешно!'
        await loadOrders()
      } else {
        error = result.error || 'Ошибка при удалении заказов'
      }
    } catch (err) {
      error = 'Ошибка сети: ' + (err instanceof Error ? err.message : String(err))
    }
  }

  // Очистка сообщений
  function clearMessages() {
    error = ''
    success = ''
  }
</script>

<svelte:head>
  <title>Админ-панель</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>

<main class="admin-panel">
  <div class="container">
    <header class="header">
      <h1>🔧 Админ-панель</h1>
      {#if user}
        <p class="user-info">
          👤 {user.first_name}
          {user.last_name || ''}
          {#if user.username}(@{user.username}){/if}
          - ID: {user.id}
        </p>
      {/if}
    </header>

    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>
    {:else if error}
      <div class="message error">
        <p>❌ {error}</p>
        <button class="clear-btn" on:click={clearMessages}>✕</button>
      </div>
    {:else if !isAdmin}
      <div class="message error">
        <p>❌ У вас нет прав администратора</p>
      </div>
    {:else}
      {#if success}
        <div class="message success">
          <p>✅ {success}</p>
          <button class="clear-btn" on:click={clearMessages}>✕</button>
        </div>
      {/if}

      <div class="controls">
        <div class="tabs">
          <button
            class="tab-btn {activeSection === 'orders' ? 'active' : ''}"
            on:click={() => {
              activeSection = 'orders'
              clearMessages()
            }}
          >
            📋 Заказы ({orders.length})
          </button>
          <button
            class="tab-btn {activeSection === 'admins' ? 'active' : ''}"
            on:click={() => {
              activeSection = 'admins'
              clearMessages()
            }}
          >
            👥 Админы ({admins.length})
          </button>
        </div>
      </div>

      {#if activeSection === 'orders'}
        <section class="section">
          <div class="section-header">
            <h2>📋 Заказы</h2>
            <div class="actions">
              <button class="btn primary" on:click={loadOrders} disabled={ordersLoading}>
                {ordersLoading ? '⏳' : '🔄'} Обновить
              </button>
              {#if isSuperAdmin}
                <button class="btn danger" on:click={clearAllOrders}> 🗑️ Очистить все </button>
              {/if}
            </div>
          </div>

          {#if ordersLoading}
            <div class="loading-small">Загрузка заказов...</div>
          {:else if orders.length === 0}
            <div class="empty">📭 Заказы не найдены</div>
          {:else}
            <div class="orders-grid">
              {#each orders as order (order.id)}
                {@const platformInfo = formatPlatform(order.platform)}
                <div class="order-card">
                  <div class="order-header">
                    <span class="order-id">Заказ #{order.id}</span>
                    <span class="order-status {order.status}">{order.status}</span>
                  </div>

                  <div class="order-user">
                    <strong>👤 {order.user_name}</strong>
                    {#if order.username}(@{order.username}){/if}
                    <br /><small>ID: {order.user_id}</small>
                  </div>

                  <div class="order-services">
                    <strong>📋 Услуги:</strong>
                    {#each order.services as service}
                      <div class="service">
                        • {service.name} - {service.price.toLocaleString()}₽
                      </div>
                    {/each}
                  </div>

                  <div class="order-footer">
                    <div class="order-total">💰 {order.total_price.toLocaleString()}₽</div>
                    <div class="order-date">
                      📅 {new Date(order.created_at).toLocaleDateString('ru')}
                    </div>
                    <div class="order-platform" title={platformInfo.title}>
                      {platformInfo.icon}
                      {platformInfo.text}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      {/if}

      {#if activeSection === 'admins'}
        <section class="section">
          <div class="section-header">
            <h2>👥 Администраторы</h2>
            <button class="btn primary" on:click={loadAdmins} disabled={adminsLoading}>
              {adminsLoading ? '⏳' : '🔄'} Обновить
            </button>
          </div>

          {#if isSuperAdmin}
            <div class="add-admin-form">
              <h3>➕ Добавить администратора</h3>
              <div class="form-row">
                <div class="input-group">
                  <input
                    bind:value={newAdminId}
                    placeholder="ID пользователя *"
                    class="input"
                    type="text"
                  />
                  <button
                    class="btn secondary small"
                    on:click={getUserDataById}
                    disabled={loadingUserData}
                    title="Получить данные пользователя по ID"
                  >
                    {loadingUserData ? '⏳' : '🔍'}
                  </button>
                </div>
                <input bind:value={newAdminName} placeholder="Имя *" class="input" type="text" />
                <input
                  bind:value={newAdminUsername}
                  placeholder="Username (необязательно)"
                  class="input"
                  type="text"
                />
                <button class="btn success" on:click={addAdmin}>Добавить</button>
              </div>
              <small style="opacity: 0.8; margin-top: 10px; display: block;">
                * Обязательные поля. Нажмите 🔍 чтобы автоматически заполнить поля по ID.
              </small>
            </div>
          {/if}

          {#if adminsLoading}
            <div class="loading-small">Загрузка администраторов...</div>
          {:else if admins.length === 0}
            <div class="empty">👥 Администраторы не найдены</div>
          {:else}
            <div class="admins-grid">
              {#each admins as admin (admin.id)}
                <div class="admin-card">
                  <div class="admin-header">
                    <span class="admin-name">
                      {admin.name}
                      {#if admin.is_super_admin}👑{/if}
                    </span>
                  </div>

                  <div class="admin-info">
                    <div>🆔 ID: {admin.user_id}</div>
                    <div>👤 @{admin.username || 'не указан'}</div>
                    <div>📅 {new Date(admin.created_at).toLocaleDateString('ru')}</div>
                    <div class="admin-role">
                      {admin.is_super_admin ? '👑 Супер-администратор' : '🔧 Администратор'}
                    </div>
                  </div>

                  {#if isSuperAdmin && !admin.is_super_admin}
                    <button class="btn danger small" on:click={() => removeAdmin(admin.user_id)}>
                      🗑️ Удалить
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </section>
      {/if}
    {/if}
  </div>
</main>

<style>
  .admin-panel {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .header h1 {
    margin: 0 0 10px 0;
    font-size: 2rem;
  }

  .user-info {
    background: rgba(255, 255, 255, 0.1);
    padding: 10px 20px;
    border-radius: 20px;
    display: inline-block;
    margin: 0;
  }

  .loading {
    text-align: center;
    padding: 50px 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-small {
    text-align: center;
    padding: 20px;
    font-style: italic;
    opacity: 0.8;
  }

  .message {
    padding: 15px 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .message.success {
    background: rgba(81, 207, 102, 0.2);
    border: 2px solid #51cf66;
  }

  .message.error {
    background: rgba(255, 107, 107, 0.2);
    border: 2px solid #ff6b6b;
  }

  .clear-btn {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 5px;
    opacity: 0.7;
  }

  .clear-btn:hover {
    opacity: 1;
  }

  .tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .tab-btn {
    flex: 1;
    padding: 15px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .tab-btn.active {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .section {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 25px;
    backdrop-filter: blur(10px);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    flex-wrap: wrap;
    gap: 15px;
  }

  .section-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn.primary {
    background: linear-gradient(135deg, #74b9ff, #0984e3);
    color: white;
  }

  .btn.success {
    background: linear-gradient(135deg, #00b894, #00a085);
    color: white;
  }

  .btn.secondary {
    background: linear-gradient(135deg, #b2bec3, #636e72);
    color: white;
  }

  .btn.danger {
    background: linear-gradient(135deg, #ff6b6b, #e55656);
    color: white;
  }

  .btn.small {
    padding: 5px 12px;
    font-size: 0.9rem;
  }

  .empty {
    text-align: center;
    padding: 40px 20px;
    opacity: 0.7;
    font-style: italic;
  }

  .orders-grid,
  .admins-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  .order-card,
  .admin-card {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 20px;
    transition: transform 0.3s ease;
  }

  .order-card:hover,
  .admin-card:hover {
    transform: translateY(-5px);
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .order-id {
    font-weight: bold;
    font-size: 1.1rem;
  }

  .order-status {
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.2);
  }

  .order-user {
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .order-services {
    margin-bottom: 15px;
  }

  .service {
    margin: 5px 0;
    padding-left: 10px;
  }

  .order-footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 0.9rem;
  }

  .order-total {
    font-weight: bold;
    font-size: 1.1rem;
    grid-column: 1 / -1;
  }

  .order-platform {
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: help;
    transition: background-color 0.2s;
  }

  .order-platform:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .admin-header {
    margin-bottom: 15px;
  }

  .admin-name {
    font-weight: bold;
    font-size: 1.1rem;
  }

  .admin-info {
    margin-bottom: 15px;
  }

  .admin-info > div {
    margin: 5px 0;
  }

  .admin-role {
    font-weight: bold;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .add-admin-form {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
  }

  .add-admin-form h3 {
    margin: 0 0 15px 0;
  }

  .form-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .input {
    padding: 10px 15px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    flex: 1;
    min-width: 120px;
  }

  .input::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  .input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }

  .input-group {
    display: flex;
    gap: 5px;
    align-items: center;
    flex: 1;
    min-width: 200px;
  }

  .input-group .input {
    flex: 1;
    margin-right: 0;
  }

  @media (max-width: 768px) {
    .container {
      padding: 15px;
    }

    .section-header {
      flex-direction: column;
      align-items: stretch;
    }

    .form-row {
      flex-direction: column;
    }

    .input {
      min-width: auto;
    }

    .orders-grid,
    .admins-grid {
      grid-template-columns: 1fr;
    }

    .order-footer {
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      font-size: 0.8rem;
    }

    .order-total {
      grid-column: 1 / -1;
      font-size: 1rem;
    }

    .order-platform {
      font-size: 0.75rem;
      padding: 3px 6px;
    }
  }
</style>
