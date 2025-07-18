// utils/telegram.ts
// Утилиты для работы с Telegram WebApp API

interface ServiceOrder {
  id: string;
  name: string;
  price: number;
}

/**
 * Отправляет данные о заказе в бот
 */
export async function sendOrderToBot(services: ServiceOrder[]) {
  if (!window.Telegram?.WebApp?.initData) {
    throw new Error('Данные Telegram недоступны');
  }

  try {
    const response = await fetch('https://bot-1ry2rgzyt-madsas-projects-2f94475c.vercel.app/api/webapp-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initData: window.Telegram.WebApp.initData,
        services: services,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка отправки: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Ошибка отправки заказа:', error);
    throw error;
  }
}

/**
 * Показывает кнопку "Отправить данные" в Telegram
 */
export function showSendDataButton(selectedServices: ServiceOrder[], onSuccess?: () => void) {
  if (!window.Telegram?.WebApp) {
    console.warn('Telegram WebApp недоступен');
    return;
  }

  console.log('Setting up main button with services:', selectedServices);

  // Показываем главную кнопку
  window.Telegram.WebApp.MainButton.setText('Отправить заказ');
  window.Telegram.WebApp.MainButton.show();

  // Очищаем предыдущие обработчики
  window.Telegram.WebApp.MainButton.offClick(() => {});

  // Обработчик нажатия
  window.Telegram.WebApp.MainButton.onClick(() => {
    console.log('Main button clicked, sending order:', selectedServices);
    
    sendOrderToBot(selectedServices)
      .then(() => {
        window.Telegram.WebApp.showPopup({
          title: 'Успех!',
          message: 'Ваш заказ был отправлен',
          buttons: [{ type: 'ok' }]
        });
        
        if (onSuccess) onSuccess();
        
        // Закрываем WebApp после успешной отправки
        setTimeout(() => {
          window.Telegram.WebApp.close();
        }, 1500);
      })
      .catch(() => {
        window.Telegram.WebApp.showPopup({
          title: 'Ошибка',
          message: 'Не удалось отправить заказ. Попробуйте еще раз.',
          buttons: [{ type: 'ok' }]
        });
      });
  });
}

/**
 * Уведомляет бота о действии пользователя
 */
export async function notifyBotAction(action: string, data?: unknown) {
  if (!window.Telegram?.WebApp?.initData) {
    return;
  }

  try {
    await fetch('/api/bot/user-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initData: window.Telegram.WebApp.initData,
        action,
        data
      }),
    });
  } catch (error) {
    console.error('Ошибка уведомления бота:', error);
  }
}
