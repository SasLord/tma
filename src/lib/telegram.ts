// utils/telegram.ts
// Утилиты для работы с Telegram WebApp API

interface ServiceOrder {
  id: string;
  name: string;
  price: number;
}

/**
 * Проверяет связь с ботом через Telegram WebApp API
 */
export async function checkBotConnection() {
  try {
    console.log('🔍 Checking bot connection through Telegram WebApp...');
    
    if (!window.Telegram?.WebApp) {
      throw new Error('Telegram WebApp not available');
    }

    // Проверяем наличие инициализационных данных
    if (window.Telegram.WebApp.initData) {
      console.log('✅ Telegram WebApp has initData');
      return { 
        status: 'ok', 
        method: 'telegram_webapp', 
        hasInitData: true,
        timestamp: new Date().toISOString(),
        telegram: 'WebApp connection ready'
      };
    } else {
      console.log('⚠️ Telegram WebApp available but no initData');
      return { 
        status: 'ok', 
        method: 'telegram_webapp', 
        hasInitData: false,
        timestamp: new Date().toISOString(),
        telegram: 'WebApp available but no initData'
      };
    }
  } catch (error) {
    console.error('❌ Bot connection failed:', error);
    // Fallback: попробуем прямое соединение
    try {
      const response = await fetch('https://bot-iv9v10czu-madsas-projects-2f94475c.vercel.app/api/cors-test', {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Direct connection OK:', result);
      return result;
    } catch (fetchError) {
      console.error('❌ Direct connection also failed:', fetchError);
      throw error;
    }
  }
}

/**
 * Отправляет данные о заказе в бот используя встроенный API Telegram
 */
export async function sendOrderToBot(services: ServiceOrder[]) {
  console.log('🚀 sendOrderToBot called with services:', services);
  
  // Проверяем доступность Telegram WebApp
  if (!window.Telegram?.WebApp) {
    console.error('❌ Telegram WebApp не доступен');
    throw new Error('Telegram WebApp не доступен');
  }

  try {
    // Формируем данные для отправки
    const orderData = {
      services: services,
      total: services.reduce((sum, service) => sum + service.price, 0),
      timestamp: Date.now()
    };
    
    console.log('📤 Sending order data through Telegram WebApp:', orderData);
    
    // Используем встроенный метод Telegram для отправки данных
    window.Telegram.WebApp.sendData(JSON.stringify(orderData));
    
    console.log('✅ Order sent successfully through Telegram WebApp');
    return { success: true, method: 'telegram_senddata' };
    
  } catch (error) {
    console.error('❌ Error in sendOrderToBot:', error);
    
    // Fallback: попробуем прямой HTTP запрос
    console.log('🔄 Trying fallback HTTP request...');
    return await sendOrderViaHTTP(services);
  }
}

/**
 * Fallback метод для отправки через HTTP (для тестирования)
 */
async function sendOrderViaHTTP(services: ServiceOrder[]) {
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
    
    console.log('📤 Sending HTTP fallback request to bot:', requestData);
    
    const response = await fetch('https://bot-iv9v10czu-madsas-projects-2f94475c.vercel.app/api/webapp-data', {
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
    console.log('✅ HTTP fallback success:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in HTTP fallback:', error);
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
      .then((result) => {
        console.log('✅ Order sent successfully:', result);
        
        // Если использовался метод sendData, то ответ придет через answerWebAppQuery
        // и WebApp автоматически закроется или покажет результат
        if (result.method === 'telegram_senddata') {
          console.log('📱 Order sent via Telegram WebApp, waiting for bot response...');
          // Не показываем popup, так как бот сам ответит через answerWebAppQuery
          if (onSuccess) onSuccess();
        } else {
          // Fallback HTTP метод
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
        }
      })
      .catch((error) => {
        console.error('❌ Failed to send order:', error);
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
