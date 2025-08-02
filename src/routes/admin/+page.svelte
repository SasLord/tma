<script lang="ts">
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { initializeTelegramSDK, getTelegramUser } from '$lib/telegram'

  interface Order {
    id: number
    user_id: string
    user_name: string
    username: string
    total_price: number
    platform: string
    status: string
    created_at: string
    services_list: string
  }

  interface User {
    id: number
    first_name: string
    last_name?: string
    username?: string
  }

  let user: User | null = null
  let orders: Order[] = []
  let loading = true
  let error = ''
  let isAdmin = false

  // Форма добавления администратора
  let newAdminId = ''
  let newAdminName = ''
  let newAdminUsername = ''
  let addingAdmin = false

  // Проверка и загрузка данных
  onMount(async () => {
    if (browser) {
      try {
        await initializeTelegramSDK()
        user = getTelegramUser()

        if (!user?.id) {
          error = 'Не удалось получить данные пользователя Telegram'
          loading = false
          return
        }

        // Проверяем права администратора
        await checkAdminStatus()

        if (isAdmin) {
          await loadOrders()
        }
      } catch (err) {
        console.error('Initialization error:', err)
        error = 'Ошибка инициализации: ' + (err instanceof Error ? err.message : String(err))
      } finally {
        loading = false
      }
    }
  })

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
      } else {
        isAdmin = false
      }
    } catch (err) {
      console.error('Admin check error:', err)
      isAdmin = false
    }
  }

  async function loadOrders() {
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
      } else {
        error = 'Не удалось загрузить заказы'
      }
    } catch (err) {
      console.error('Load orders error:', err)
      error = 'Ошибка загрузки заказов: ' + (err instanceof Error ? err.message : String(err))
    }
  }

  async function addAdmin() {
    if (!newAdminId.trim()) {
      alert('Введите ID пользователя')
      return
    }

    addingAdmin = true
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
            targetUserName: newAdminName.trim() || 'Unknown',
            targetUsername: newAdminUsername.trim() || null
          })
        }
      )

      if (response.ok) {
        alert('Администратор успешно добавлен!')
        newAdminId = ''
        newAdminName = ''
        newAdminUsername = ''
      } else {
        const errorResult = await response.json()
        alert('Ошибка: ' + (errorResult.error || 'Неизвестная ошибка'))
      }
    } catch (err) {
      console.error('Add admin error:', err)
      alert(
        'Ошибка добавления администратора: ' + (err instanceof Error ? err.message : String(err))
      )
    } finally {
      addingAdmin = false
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'new':
        return '#ff9800'
      case 'processing':
        return '#2196f3'
      case 'completed':
        return '#4caf50'
      case 'cancelled':
        return '#f44336'
      default:
        return '#757575'
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'new':
        return 'Новый'
      case 'processing':
        return 'В обработке'
      case 'completed':
        return 'Выполнен'
      case 'cancelled':
        return 'Отменен'
      default:
        return status
    }
  }
</script>

<svelte:head>
  <title>Административная панель - Заказы</title>
</svelte:head>

<div class="admin-page">
  <h1>🔐 Административная панель</h1>

  {#if loading}
    <div class="loading">
      <p>Загрузка...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>❌ {error}</p>
    </div>
  {:else if !isAdmin}
    <div class="access-denied">
      <h2>🚫 Доступ запрещен</h2>
      <p>У вас нет прав администратора для просмотра этой страницы.</p>
      <p>Если вы считаете, что это ошибка, обратитесь к главному администратору.</p>
      <a href="/" class="back-button">← Вернуться на главную</a>
    </div>
  {:else}
    <div class="admin-content">
      <!-- Информация о пользователе -->
      <div class="user-info">
        <h3>👤 Администратор</h3>
        <p><strong>Имя:</strong> {user?.first_name} {user?.last_name || ''}</p>
        <p><strong>ID:</strong> {user?.id}</p>
        {#if user?.username}
          <p><strong>Username:</strong> @{user.username}</p>
        {/if}
      </div>

      <!-- Добавление нового администратора -->
      <div class="add-admin">
        <h3>➕ Добавить администратора</h3>
        <div class="form-group">
          <label for="adminId">ID пользователя Telegram *</label>
          <input
            type="text"
            id="adminId"
            bind:value={newAdminId}
            placeholder="123456789"
            disabled={addingAdmin}
          />
        </div>
        <div class="form-group">
          <label for="adminName">Имя</label>
          <input
            type="text"
            id="adminName"
            bind:value={newAdminName}
            placeholder="Иван Иванов"
            disabled={addingAdmin}
          />
        </div>
        <div class="form-group">
          <label for="adminUsername">Username (без @)</label>
          <input
            type="text"
            id="adminUsername"
            bind:value={newAdminUsername}
            placeholder="username"
            disabled={addingAdmin}
          />
        </div>
        <button class="add-button" on:click={addAdmin} disabled={addingAdmin || !newAdminId.trim()}>
          {addingAdmin ? 'Добавление...' : 'Добавить администратора'}
        </button>
      </div>

      <!-- Список заказов -->
      <div class="orders-section">
        <div class="section-header">
          <h3>📋 Заказы ({orders.length})</h3>
          <button class="refresh-button" on:click={loadOrders}>🔄 Обновить</button>
        </div>

        {#if orders.length === 0}
          <div class="empty-orders">
            <p>Пока нет заказов</p>
          </div>
        {:else}
          <div class="orders-list">
            {#each orders as order (order.id)}
              <div class="order-card">
                <div class="order-header">
                  <div class="order-id">Заказ #{order.id}</div>
                  <div class="order-status" style="color: {getStatusColor(order.status)}">
                    {getStatusText(order.status)}
                  </div>
                </div>

                <div class="order-info">
                  <div class="customer-info">
                    <strong>👤 Клиент:</strong>
                    {order.user_name}
                    {#if order.username}
                      <span class="username">(@{order.username})</span>
                    {/if}
                    <br />
                    <strong>🆔 ID:</strong>
                    {order.user_id}
                  </div>

                  <div class="order-details">
                    <strong>💰 Сумма:</strong>
                    {order.total_price?.toLocaleString()}₽<br />
                    <strong>🌐 Платформа:</strong>
                    {order.platform}<br />
                    <strong>📅 Дата:</strong>
                    {formatDate(order.created_at)}
                  </div>
                </div>

                {#if order.services_list}
                  <div class="services-info">
                    <strong>📋 Услуги:</strong>
                    <div class="services-list">
                      {#each order.services_list.split('\n') as service}
                        <div class="service-item">• {service}</div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="actions">
        <a href="/" class="back-button">← Вернуться на главную</a>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .admin-page {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1 {
    text-align: center;
    color: var(--tg-theme-text-color, #000);
    margin-bottom: 30px;
  }

  .loading,
  .error {
    text-align: center;
    padding: 40px 20px;

    p {
      font-size: 18px;
      color: var(--tg-theme-hint-color, #666);
    }
  }

  .error p {
    color: #f44336;
  }

  .access-denied {
    text-align: center;
    padding: 40px 20px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 12px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);

    h2 {
      color: #f44336;
      margin-bottom: 20px;
    }

    p {
      color: var(--tg-theme-text-color, #000);
      margin-bottom: 15px;
    }
  }

  .admin-content {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .user-info {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);

    h3 {
      margin: 0 0 15px 0;
      color: var(--tg-theme-text-color, #000);
    }

    p {
      margin: 5px 0;
      color: var(--tg-theme-text-color, #000);
    }
  }

  .add-admin {
    background: var(--tg-theme-bg-color, #fff);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);

    h3 {
      margin: 0 0 20px 0;
      color: var(--tg-theme-text-color, #000);
    }

    .form-group {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: var(--tg-theme-text-color, #000);
      }

      input {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--tg-theme-hint-color, #ccc);
        border-radius: 8px;
        font-size: 16px;
        background: var(--tg-theme-bg-color, #fff);
        color: var(--tg-theme-text-color, #000);

        &:focus {
          outline: none;
          border-color: var(--tg-theme-link-color, #007acc);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .add-button {
      background: var(--tg-theme-link-color, #007acc);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .orders-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        color: var(--tg-theme-text-color, #000);
      }

      .refresh-button {
        background: var(--tg-theme-secondary-bg-color, #f5f5f5);
        border: 1px solid var(--tg-theme-hint-color, #ccc);
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        color: var(--tg-theme-text-color, #000);

        &:hover {
          background: var(--tg-theme-hint-color, #e0e0e0);
        }
      }
    }
  }

  .empty-orders {
    text-align: center;
    padding: 40px 20px;
    color: var(--tg-theme-hint-color, #666);
    font-style: italic;
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .order-card {
    background: var(--tg-theme-bg-color, #fff);
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--tg-theme-link-color, #007acc);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      .order-id {
        font-weight: bold;
        font-size: 18px;
        color: var(--tg-theme-text-color, #000);
      }

      .order-status {
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
      }
    }

    .order-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;

      .customer-info,
      .order-details {
        color: var(--tg-theme-text-color, #000);
        line-height: 1.5;

        .username {
          color: var(--tg-theme-link-color, #007acc);
          font-weight: 500;
        }
      }
    }

    .services-info {
      border-top: 1px solid var(--tg-theme-hint-color, #e0e0e0);
      padding-top: 15px;
      color: var(--tg-theme-text-color, #000);

      .services-list {
        margin-top: 10px;

        .service-item {
          padding: 5px 0;
          border-bottom: 1px dotted var(--tg-theme-hint-color, #e0e0e0);

          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
  }

  .actions {
    text-align: center;
    margin-top: 20px;
  }

  .back-button {
    display: inline-block;
    background: var(--tg-theme-hint-color, #666);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      opacity: 0.9;
    }
  }

  @media (max-width: 768px) {
    .admin-page {
      padding: 15px;
    }

    .order-card .order-info {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .add-admin .form-group input {
      font-size: 16px; /* Предотвращает зум на iOS */
    }
  }
</style>
