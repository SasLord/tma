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
    
    // Проверяем, есть ли web_app_data в обновлении
    if (req.body.message && req.body.message.web_app_data) {
      console.log('📱 Found web_app_data in message:', req.body.message.web_app_data);
      
      try {
        const webAppData = JSON.parse(req.body.message.web_app_data.data);
        console.log('📋 Parsed order data:', webAppData);
        
        // Формируем сообщение о заказе
        const servicesList = webAppData.services.map(service => 
          `• ${service.name} - ${service.price}₽`
        ).join('\n');
        
        const message = `🛍️ Новый заказ через WebApp!

📋 Выбранные услуги:
${servicesList}

💰 Общая сумма: ${webAppData.total}₽

👤 От пользователя: ${req.body.message.from.first_name} ${req.body.message.from.last_name || ''}
📅 Время заказа: ${new Date().toLocaleString('ru-RU')}`;

        // Отправляем сообщение администратору
        const ADMIN_CHAT_ID = '1155907659';
        console.log('📤 Sending order to admin:', ADMIN_CHAT_ID);
        
        await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
        
        // Отвечаем пользователю через answerWebAppQuery
        if (req.body.message.web_app_data.query_id) {
          await bot.telegram.answerWebAppQuery(req.body.message.web_app_data.query_id, {
            type: 'article',
            id: 'order_success',
            title: 'Заказ принят!',
            input_message_content: {
              message_text: `✅ Ваш заказ принят!\n\nСумма: ${webAppData.total}₽\nВремя: ${new Date().toLocaleString('ru-RU')}`
            }
          });
        }
        
        console.log('✅ WebApp order processed successfully');
      } catch (error) {
        console.error('❌ Error processing web_app_data:', error);
        
        // Отвечаем об ошибке
        if (req.body.message.web_app_data.query_id) {
          await bot.telegram.answerWebAppQuery(req.body.message.web_app_data.query_id, {
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
