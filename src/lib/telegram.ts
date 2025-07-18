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
    const response = await fetch('https://bot-3zebh5cbg-madsas-projects-2f94475c.vercel.app/api/health');
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Health check failed: ${response.status} - ${errorText}`);
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
  
  // Для тестирования вне Telegram создаем фиктивные данные
  let initData = '';
  if (window.Telegram?.WebApp?.initData) {
    initData = window.Telegram.WebApp.initData;
    console.log('📱 Telegram initData available:', initData);
  } else {
    console.warn('⚠️ No Telegram initData, using mock data for testing');
    // Фиктивные данные для тестирования
    const mockUser = {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en'
    };
    
    // Создаем фиктивные initData
    const mockParams = new URLSearchParams();
    mockParams.set('user', JSON.stringify(mockUser));
    mockParams.set('auth_date', Math.floor(Date.now() / 1000).toString());
    mockParams.set('hash', 'mock_hash_for_testing');
    initData = mockParams.toString();
  }

  try {
    const requestData = {
      initData: initData,
      services: services,
    };
    
    console.log('📤 Sending request to bot:', requestData);
    
    const response = await fetch('https://bot-3zebh5cbg-madsas-projects-2f94475c.vercel.app/api/webapp-data', {
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
