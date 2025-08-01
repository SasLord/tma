// utils/telegram.ts
// Утилиты для работы с Telegram WebApp API

interface ServiceOrder {
  id: string;
  name: string;
  price: number;
}

/**
 * Определяет платформу
 */
function getPlatform(): string {
  if (typeof window === 'undefined') return 'server';
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTelegram = window.Telegram?.WebApp ? true : false;
  
  if (isTelegram && isMobile) {
    return 'telegram_mobile';
  } else if (isTelegram) {
    return 'telegram_desktop';
  } else if (isMobile) {
    return 'mobile_browser';
  } else {
    return 'desktop_browser';
  }
}

/**
 * Отправляет заказ через HTTP API - ПРОСТОЙ МЕТОД
 */
async function sendOrderViaHTTP(services: ServiceOrder[]) {
  console.log('🌐 Sending order via HTTP...');
  console.log('Services:', services);
  
  const webhookUrl = 'https://tma-webapp-store.netlify.app/.netlify/functions/webhook';
  
  const payload = {
    services: services,
    platform: getPlatform(),
    timestamp: Date.now()
  };
  
  console.log('Payload:', payload);
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('✅ HTTP order sent:', result);
  return result;
}

/**
 * ПРОСТАЯ отправка заказа - только HTTP
 */
export async function sendOrderToBot(services: ServiceOrder[], onSuccess?: () => void): Promise<void> {
  console.log('=== SENDING ORDER ===');
  console.log('Services count:', services.length);
  console.log('Services data:', services);
  
  try {
    // Только HTTP - максимально просто
    await sendOrderViaHTTP(services);
    console.log('✅ Order sent successfully!');
    
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('❌ Failed to send order:', error);
    throw error;
  }
}

/**
 * Устанавливает обработчик главной кнопки Telegram WebApp
 */
export function showSendDataButton(services: ServiceOrder[], onSuccess?: () => void) {
  console.log('=== showSendDataButton called ===');
  console.log('Services received:', services);
  console.log('Services count:', services.length);
  
  if (!window.Telegram?.WebApp?.MainButton) {
    console.error('Telegram WebApp MainButton not available');
    return;
  }

  const mainButton = window.Telegram.WebApp.MainButton;
  
  // Устанавливаем текст кнопки
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
  const buttonText = `Заказать за ${totalPrice}₽`;
  console.log('Setting button text:', buttonText);
  mainButton.setText(buttonText);
  
  // Удаляем предыдущие обработчики
  try {
    mainButton.offClick(() => {});
  } catch {
    console.log('No previous handlers to remove');
  }
  
  // Создаем новый обработчик
  const clickHandler = async () => {
    try {
      console.log('=== Main button clicked ===');
      console.log('Services in handler:', services);
      
      mainButton.showProgress();
      
      await sendOrderToBot(services, onSuccess);
      
      console.log('Order sent successfully!');
      mainButton.hideProgress();
      mainButton.hide();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Failed to send order:', error);
      mainButton.hideProgress();
    }
  };
  
  // Устанавливаем новый обработчик
  mainButton.onClick(clickHandler);
  mainButton.show();
  
  console.log('=== Main button configured ===');
}

/**
 * Экспорт типов
 */
export type { ServiceOrder };
