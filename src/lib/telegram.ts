// utils/telegram.ts
// Утилиты для работы с Telegram WebApp API

interface ServiceOrder {
  id: string;
  name: string;
  price: number;
}

/**
 * Проверяет связь с ботом
 */
export async function checkBotConnection() {
  try {
    console.log('🔍 Checking bot connection...');
    const response = await fetch('https://bot-1ry2rgzyt-madsas-projects-2f94475c.vercel.app/api/health');
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Bot connection OK:', result);
    return result;
  } catch (error) {
    console.error('❌ Bot connection failed:', error);
    throw error;
  }
}

/**
 * Отправляет данные о заказе в бот
 */
export async function sendOrderToBot(services: ServiceOrder[]) {
  console.log('🚀 sendOrderToBot called with services:', services);
  
  if (!window.Telegram?.WebApp?.initData) {
    console.error('❌ Telegram WebApp initData not available');
    throw new Error('Данные Telegram недоступны');
  }

  console.log('📱 Telegram initData available:', window.Telegram.WebApp.initData);

  try {
    const requestData = {
      initData: window.Telegram.WebApp.initData,
      services: services,
    };
    
    console.log('📤 Sending request to bot:', requestData);
    
    const response = await fetch('https://bot-1ry2rgzyt-madsas-projects-2f94475c.vercel.app/api/webapp-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not ok:', errorText);
      throw new Error(`Ошибка отправки: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Success response:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in sendOrderToBot:', error);
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
