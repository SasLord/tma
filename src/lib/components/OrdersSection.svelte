<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

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

  export let orders: Order[] = []
  export let loading = false
  export let isSuperAdmin = false

  function refreshOrders() {
    dispatch('refresh')
  }

  async function clearAllOrders() {
    if (!confirm('⚠️ Вы уверены, что хотите удалить ВСЕ заказы? Это действие необратимо!')) {
      return
    }

    if (
      !confirm('🚨 ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ: Все заказы будут безвозвратно удалены. Продолжить?')
    ) {
      return
    }

    dispatch('clearOrders')
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

<div class="orders-section">
  <div class="section-header">
    <h3>📋 Заказы ({orders.length})</h3>
    <div class="header-actions">
      <button class="refresh-button" on:click={refreshOrders} disabled={loading}>
        {loading ? '⏳' : '🔄'}
        {loading ? 'Загрузка...' : 'Обновить'}
      </button>
      {#if isSuperAdmin && orders.length > 0}
        <button class="clear-button" on:click={clearAllOrders}> 🗑️ Очистить все </button>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="loading-state">
      <p>Загрузка заказов...</p>
    </div>
  {:else if orders.length === 0}
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

<style lang="scss">
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

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;

        .refresh-button {
          background: var(--tg-theme-secondary-bg-color, #f5f5f5);
          border: 1px solid var(--tg-theme-hint-color, #ccc);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: var(--tg-theme-text-color, #000);
          transition: all 0.3s ease;

          &:hover:not(:disabled) {
            background: var(--tg-theme-hint-color, #e0e0e0);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        .clear-button {
          background: #f44336;
          border: 1px solid #d32f2f;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;

          &:hover {
            background: #d32f2f;
            transform: translateY(-1px);
          }
        }
      }
    }
  }

  .loading-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--tg-theme-hint-color, #666);
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
    background: var(--tg-theme-secondary-bg-color, #f9f9f9);
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
      }

      .customer-info .username {
        color: var(--tg-theme-link-color, #007acc);
        font-weight: 500;
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

  @media (max-width: 768px) {
    .order-card .order-info {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }
</style>
