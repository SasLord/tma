<script lang="ts">
  import { onMount } from 'svelte';
  import { showSendDataButton, notifyBotAction } from '$lib/telegram';

  interface Service {
    id: string;
    name: string;
    price: number;
    selected: boolean;
  }

  let services: Service[] = [
    { id: '1', name: 'Уборка квартиры', price: 3000, selected: false },
    { id: '2', name: 'Мытье окон', price: 1500, selected: false },
    { id: '3', name: 'Химчистка дивана', price: 2500, selected: false },
    { id: '4', name: 'Уборка после ремонта', price: 5000, selected: false }
  ];

  $: selectedServices = services.filter(s => s.selected);
  $: totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  $: hasSelectedServices = selectedServices.length > 0;

  function toggleService(serviceId: string) {
    services = services.map(service => 
      service.id === serviceId 
        ? { ...service, selected: !service.selected }
        : service
    );

    // Уведомляем бота о выборе услуги
    const service = services.find(s => s.id === serviceId);
    if (service) {
      notifyBotAction('service_toggle', {
        serviceId: service.id,
        serviceName: service.name,
        selected: service.selected
      });
    }
  }

  function handleOrderSuccess() {
    // Очищаем выбор после успешного заказа
    services = services.map(service => ({ ...service, selected: false }));
  }

  onMount(() => {
    // Уведомляем бота об открытии страницы заказа
    notifyBotAction('page_opened', { page: 'services' });

    return () => {
      // Очищаем обработчики при размонтировании
      if (window.Telegram?.WebApp?.MainButton) {
        window.Telegram.WebApp.MainButton.hide();
      }
    };
  });

  // Реактивное обновление главной кнопки
  $: if (hasSelectedServices && window.Telegram?.WebApp) {
    showSendDataButton(handleOrderSuccess);
  } else if (window.Telegram?.WebApp?.MainButton) {
    window.Telegram.WebApp.MainButton.hide();
  }
</script>

<div class="services-page">
  <h1>Выберите услуги</h1>
  
  <div class="services-list">
    {#each services as service (service.id)}
      <label class="service-item" class:selected={service.selected}>
        <input 
          type="checkbox" 
          bind:checked={service.selected}
          on:change={() => toggleService(service.id)}
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
        {#each selectedServices as service}
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

<style lang="scss">
  .services-page {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  }

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: var(--tg-theme-text-color);
  }

  .services-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
  }

  .service-item {
    display: flex;
    align-items: center;
    padding: 15px;
    border: 2px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--tg-theme-bg-color);

    &:hover {
      border-color: var(--tg-theme-link-color, #007acc);
    }

    &.selected {
      border-color: var(--tg-theme-link-color, #007acc);
      background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    }

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-right: 15px;
      accent-color: var(--tg-theme-link-color, #007acc);
    }

    .service-content {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: var(--tg-theme-text-color);
        font-size: 16px;
      }

      .price {
        font-weight: bold;
        color: var(--tg-theme-link-color, #007acc);
        font-size: 18px;
      }
    }
  }

  .summary {
    padding: 20px;
    border-radius: 12px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border: 1px solid var(--tg-theme-hint-color, #ccc);

    h3 {
      margin: 0 0 15px 0;
      color: var(--tg-theme-text-color);
    }

    .total {
      font-size: 18px;
      margin-bottom: 15px;
      color: var(--tg-theme-text-color);

      strong {
        color: var(--tg-theme-link-color, #007acc);
        font-size: 20px;
      }
    }

    .selected-services {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .selected-service {
        padding: 8px 12px;
        background: var(--tg-theme-bg-color);
        border-radius: 8px;
        font-size: 14px;
        color: var(--tg-theme-text-color);
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--tg-theme-hint-color);
    font-style: italic;
  }

  @media (max-width: 480px) {
    .services-page {
      padding: 15px;
    }

    .service-item {
      padding: 12px;

      .service-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;

        .price {
          font-size: 16px;
        }
      }
    }
  }
</style>
