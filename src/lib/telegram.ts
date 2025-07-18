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
    const response = await fetch('/api/bot/webapp-data', {
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
export function showSendDataButton(onSuccess?: () => void) {
  if (!window.Telegram?.WebApp) {
    console.warn('Telegram WebApp недоступен');
    return;
  }

  // Показываем главную кнопку
  window.Telegram.WebApp.MainButton.setText('Отправить заказ');
  window.Telegram.WebApp.MainButton.show();

  // Обработчик нажатия
  window.Telegram.WebApp.MainButton.onClick(() => {
    // Здесь можно получить данные из компонента
    const selectedServices = getSelectedServices(); // Ваша логика получения данных
    
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
 * Получает выбранные услуги (пример функции)
 */
function getSelectedServices(): ServiceOrder[] {
  // Это пример - замените на вашу логику
  return [
    { id: '1', name: 'Услуга 1', price: 1000 },
    { id: '2', name: 'Услуга 2', price: 2000 }
  ];
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
