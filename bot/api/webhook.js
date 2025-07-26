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
    
    // Обрабатываем web_app_data (данные от sendData())
    bot.on('web_app_data', async (ctx) => {
      try {
        console.log('📱 Received web_app_data:', ctx.webAppData);
        
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
        
        await ctx.telegram.sendMessage(ADMIN_CHAT_ID, message);
        
        // Отвечаем пользователю через answerWebAppQuery
        await ctx.answerWebAppQuery({
          type: 'article',
          id: 'order_success',
          title: 'Заказ принят!',
          input_message_content: {
            message_text: `✅ Ваш заказ принят!\n\nСумма: ${webAppData.total}₽\nВремя: ${new Date().toLocaleString('ru-RU')}`
          }
        });
        
        console.log('✅ WebApp order processed successfully');
      } catch (error) {
        console.error('❌ Error processing web_app_data:', error);
        
        // Отвечаем об ошибке
        await ctx.answerWebAppQuery({
          type: 'article',
          id: 'order_error',
          title: 'Ошибка обработки заказа',
          input_message_content: {
            message_text: `❌ Произошла ошибка при обработке заказа. Попробуйте еще раз.`
          }
        });
      }
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
