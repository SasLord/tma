import { Telegraf } from 'telegraf';

export default async function handler(req, res) {
  console.log('🔗 Webhook handler called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Processing webhook update:', JSON.stringify(req.body, null, 2));
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found');
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const bot = new Telegraf(BOT_TOKEN);
    
    // Обработчик для web_app_data событий
    bot.on('web_app_data', async (ctx) => {
      console.log('🌐 WebApp data event received:', ctx.update);
      console.log('📱 WebApp data:', ctx.webAppData);
      
      try {
        const webAppData = JSON.parse(ctx.webAppData.data);
        console.log('📋 Parsed order data:', webAppData);
        
        // Формируем сообщение о заказе
        const servicesList = webAppData.services.map(service => 
          `• ${service.name} - ${service.price}₽`
        ).join('\n');
        
        const message = `🛍️ Новый заказ через WebApp!

📋 Выбранные услуги:
${servicesList}

💰 Общая сумма: ${webAppData.total}₽

👤 От пользователя: ${ctx.from.first_name} ${ctx.from.last_name || ''}
📅 Время заказа: ${new Date().toLocaleString('ru-RU')}`;

        // Отправляем сообщение администратору
        const ADMIN_CHAT_ID = '1155907659';
        console.log('📤 Sending order to admin:', ADMIN_CHAT_ID);
        
        await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
        
        // Отвечаем пользователю через answerWebAppQuery
        if (ctx.webAppData.query_id) {
          console.log('📲 Answering WebApp query:', ctx.webAppData.query_id);
          await bot.telegram.answerWebAppQuery(ctx.webAppData.query_id, {
            type: 'article',
            id: 'order_success',
            title: 'Заказ принят!',
            input_message_content: {
              message_text: `✅ Ваш заказ принят!\n\nСумма: ${webAppData.total}₽\nВремя: ${new Date().toLocaleString('ru-RU')}`
            }
          });
        } else {
          console.log('⚠️ No query_id in web_app_data, skipping answerWebAppQuery');
        }
        
        console.log('✅ WebApp order processed successfully via event handler');
      } catch (error) {
        console.error('❌ Error processing web_app_data event:', error);
        
        // Отвечаем об ошибке
        if (ctx.webAppData.query_id) {
          await bot.telegram.answerWebAppQuery(ctx.webAppData.query_id, {
            type: 'article',
            id: 'order_error',
            title: 'Ошибка обработки заказа',
            input_message_content: {
              message_text: `❌ Произошла ошибка при обработке заказа. Попробуйте еще раз.`
            }
          });
        }
      }
    });
    
    // Обрабатываем команды
    bot.command('webapp', async (ctx) => {
      console.log('📱 WebApp command triggered');
      
      const message = `🛍️ Добро пожаловать в наш магазин услуг!
      
Нажмите кнопку ниже, чтобы открыть WebApp и оформить заказ:`;

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [[{
            text: '🛍️ Открыть магазин',
            web_app: { url: 'https://bot-blue-five.vercel.app' }
          }]]
        }
      });
    });
    
    bot.command('test', async (ctx) => {
      console.log('🧪 Test command triggered');
      await ctx.reply('✅ Бот работает! Используйте /webapp для открытия магазина.');
    });
    
    // Проверяем, есть ли web_app_data в обновлении
    const webAppDataSource = req.body.message?.web_app_data || req.body.web_app_data;
    
    if (webAppDataSource) {
      console.log('📱 Found web_app_data:', webAppDataSource);
      
      try {
        const webAppData = JSON.parse(webAppDataSource.data);
        console.log('📋 Parsed order data:', webAppData);
        
        // Получаем данные пользователя из разных источников
        const user = req.body.message?.from || req.body.from;
        
        // Формируем сообщение о заказе
        const servicesList = webAppData.services.map(service => 
          `• ${service.name} - ${service.price}₽`
        ).join('\n');
        
        const message = `🛍️ Новый заказ через WebApp!

📋 Выбранные услуги:
${servicesList}

💰 Общая сумма: ${webAppData.total}₽

👤 От пользователя: ${user?.first_name || 'Неизвестно'} ${user?.last_name || ''}
📅 Время заказа: ${new Date().toLocaleString('ru-RU')}`;

        // Отправляем сообщение администратору
        const ADMIN_CHAT_ID = '1155907659';
        console.log('📤 Sending order to admin:', ADMIN_CHAT_ID);
        
        await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
        
        // Отвечаем пользователю через answerWebAppQuery
        if (webAppDataSource.query_id) {
          console.log('📲 Answering WebApp query:', webAppDataSource.query_id);
          await bot.telegram.answerWebAppQuery(webAppDataSource.query_id, {
            type: 'article',
            id: 'order_success',
            title: 'Заказ принят!',
            input_message_content: {
              message_text: `✅ Ваш заказ принят!\n\nСумма: ${webAppData.total}₽\nВремя: ${new Date().toLocaleString('ru-RU')}`
            }
          });
        } else {
          console.log('⚠️ No query_id in web_app_data, skipping answerWebAppQuery');
        }
        
        console.log('✅ WebApp order processed successfully');
      } catch (error) {
        console.error('❌ Error processing web_app_data:', error);
        
        // Отвечаем об ошибке
        if (webAppDataSource.query_id) {
          await bot.telegram.answerWebAppQuery(webAppDataSource.query_id, {
            type: 'article',
            id: 'order_error',
            title: 'Ошибка обработки заказа',
            input_message_content: {
              message_text: `❌ Произошла ошибка при обработке заказа. Попробуйте еще раз.`
            }
          });
        }
      }
    } else {
      console.log('ℹ️ No web_app_data found in update');
    }
    
    // Также настраиваем обработчик через Telegraf для других случаев
    bot.on('web_app_data', async (ctx) => {
      console.log('📱 Telegraf web_app_data handler triggered:', ctx.webAppData);
      // Этот обработчик может не вызваться в serverless среде
    });
    
    // Передаем обновление боту
    await bot.handleUpdate(req.body);
    
    console.log('✅ Webhook processed successfully');
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
