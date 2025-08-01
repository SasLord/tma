import { Telegraf } from 'telegraf';

export default async function handler(req, res) {
  console.log('🔗 Webhook handler called');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // CORS заголовки для всех запросов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request');
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found');
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const bot = new Telegraf(BOT_TOKEN);
    const ADMIN_CHAT_ID = '1155907659';
    
    // === ПРОСТАЯ ОБРАБОТКА HTTP ЗАКАЗОВ ===
    if (req.body.services && Array.isArray(req.body.services)) {
      console.log('🌐 HTTP order received');
      
      const services = req.body.services;
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
      const platform = req.body.platform || 'HTTP';
      
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
        return res.status(200).json({ success: true, message: 'Order processed' });
      } catch (sendError) {
        console.error('❌ Failed to send message:', sendError);
        return res.status(500).json({ error: 'Failed to send message', details: sendError.message });
      }
    }
    
    // === ОБРАБОТКА TELEGRAM WEB_APP_DATA ===
    const webAppData = req.body.message?.web_app_data || req.body.web_app_data;
    
    if (webAppData && webAppData.data) {
      console.log('📱 Telegram WebApp data received');
      
      try {
        const parsedData = JSON.parse(webAppData.data);
        const user = req.body.message?.from || req.body.from;
        
        // Список услуг для маппинга ID
        const availableServices = [
          { id: '1', name: 'Уборка квартиры', price: 3000 },
          { id: '2', name: 'Мытье окон', price: 1500 },
          { id: '3', name: 'Химчистка дивана', price: 2500 },
          { id: '4', name: 'Уборка после ремонта', price: 5000 }
        ];
        
        let services = [];
        let totalPrice = 0;
        
        // Обрабатываем данные
        if (parsedData.serviceIds && Array.isArray(parsedData.serviceIds)) {
          services = parsedData.serviceIds.map(id => 
            availableServices.find(s => s.id === id)
          ).filter(Boolean);
          totalPrice = parsedData.totalPrice || services.reduce((sum, s) => sum + s.price, 0);
        } else if (parsedData.services && Array.isArray(parsedData.services)) {
          services = parsedData.services;
          totalPrice = parsedData.total || services.reduce((sum, s) => sum + s.price, 0);
        }
        
        if (services.length > 0) {
          const servicesList = services.map(service => 
            '• ' + service.name + ' - ' + service.price + '₽'
          ).join('\n');
          
          const userName = user ? (user.first_name || '') + ' ' + (user.last_name || '') : 'Неизвестно';

          const message = '🛍️ Новый заказ через WebApp!\n\n' +
            '📋 Выбранные услуги:\n' + servicesList + '\n\n' +
            '💰 Общая сумма: ' + totalPrice + '₽\n' +
            '👤 От пользователя: ' + userName.trim() + '\n' +
            '🌐 Платформа: Telegram WebApp\n' +
            '📅 Время: ' + new Date().toLocaleString('ru-RU');

          await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
          console.log('✅ Telegram WebApp order sent to admin');
          
          // Отвечаем через answerWebAppQuery если есть query_id
          if (webAppData.query_id) {
            try {
              await bot.telegram.answerWebAppQuery(webAppData.query_id, {
                type: 'article',
                id: 'success',
                title: 'Заказ принят!',
                input_message_content: {
                  message_text: '✅ Заказ принят!\nСумма: ' + totalPrice + '₽'
                }
              });
            } catch (err) {
              console.log('⚠️ answerWebAppQuery failed:', err.message);
            }
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse WebApp data:', parseError);
      }
    }
    
    // === ОБРАБОТКА КОМАНД ===
    bot.command('webapp', async (ctx) => {
      console.log('📱 WebApp command triggered');
      await ctx.reply('🛍️ Добро пожаловать в наш магазин услуг!\n\nНажмите кнопку ниже, чтобы открыть WebApp и оформить заказ:', {
        reply_markup: {
          inline_keyboard: [[{
            text: '🛍️ Открыть магазин',
            web_app: { url: 'https://tma-webapp-store.netlify.app' }
          }]]
        }
      });
    });
    
    bot.command('test', async (ctx) => {
      console.log('🧪 Test command triggered');
      await ctx.reply('✅ Бот работает! Используйте /webapp для открытия магазина.');
    });

    // Обрабатываем обновление через Telegraf
    await bot.handleUpdate(req.body);
    
    console.log('✅ Webhook processed successfully');
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
