import { Telegraf } from 'telegraf';

exports.handler = async (event) => {
  console.log('🔗 Netlify webhook handler called');
  console.log('Method:', event.httpMethod);
  console.log('Body:', event.body);
  
  // CORS заголовки
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Обрабатываем preflight запросы
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight request');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  if (event.httpMethod !== 'POST') {
    console.log('❌ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Bot token not configured' })
      };
    }

    const bot = new Telegraf(BOT_TOKEN);
    const ADMIN_CHAT_ID = '1155907659';
    
    // Парсим JSON из event.body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }
    
    // === ПРОСТАЯ ОБРАБОТКА HTTP ЗАКАЗОВ ===
    if (requestBody.services && Array.isArray(requestBody.services)) {
      console.log('🌐 HTTP order received');
      
      const services = requestBody.services;
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
      const platform = requestBody.platform || 'HTTP';
      
      // Формируем список услуг
      const servicesList = services.map(service => 
        '• ' + service.name + ' - ' + service.price + '₽'
      ).join('\n');

      // Простое сообщение
      const message = '🛍️ Новый заказ через WebApp!\n\n' +
        '📋 Выбранные услуги:\n' + servicesList + '\n\n' +
        '💰 Общая сумма: ' + totalPrice + '₽\n' +
        '🌐 Платформа: ' + platform + '\n' +
        '📅 Время: ' + new Date().toLocaleString('ru-RU');

      try {
        await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
        console.log('✅ HTTP order sent to admin');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Order processed' })
        };
      } catch (sendError) {
        console.error('❌ Failed to send message:', sendError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to send message', details: sendError.message })
        };
      }
    }
    
    console.log('❌ No valid services in request');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No services provided' })
    };
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
