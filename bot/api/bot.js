import { Telegraf } from 'telegraf';

console.log('🤖 Initializing bot...');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found');
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

console.log('✅ Bot token found');

// Создаем экземпляр бота
export const bot = new Telegraf(BOT_TOKEN);

// Обработчик команды /start
bot.start((ctx) => {
  console.log('📨 Start command received from:', ctx.from);
  ctx.reply('👋 Привет! Я бот для обработки заказов из WebApp.');
});

// Обработчик web_app_data
bot.on('web_app_data', async (ctx) => {
  console.log('🔗 Web app data received:', ctx.webAppData);
  
  try {
    const data = JSON.parse(ctx.webAppData.data);
    console.log('📦 Parsed data:', data);
    
    const { services, total, timestamp } = data;
    
    if (!services || !Array.isArray(services)) {
      console.log('❌ Invalid services data');
      return;
    }
    
    // Формируем текст сообщения
    const servicesList = services.map(service => 
      `• ${service.name} - ${service.price}₽`
    ).join('\n');
    
    const message = `🛍️ Новый заказ через WebApp!

👤 От: ${ctx.from.first_name} ${ctx.from.last_name || ''} (@${ctx.from.username || 'без username'})

📋 Выбранные услуги:
${servicesList}

💰 Общая сумма: ${total}₽

📅 Время заказа: ${new Date(timestamp).toLocaleString('ru-RU')}

🆔 User ID: ${ctx.from.id}`;

    // Отправляем сообщение администратору
    const ADMIN_CHAT_ID = '1155907659';
    
    console.log('📤 Sending message to admin:', ADMIN_CHAT_ID);
    
    await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
    
    console.log('✅ Admin notification sent');
    
    // Отвечаем пользователю через answerWebAppQuery
    await ctx.answerWebAppQuery({
      type: 'article',
      id: 'order_success',
      title: 'Заказ принят!',
      input_message_content: {
        message_text: `✅ Ваш заказ на сумму ${total}₽ принят и обрабатывается!`
      }
    });
    
    console.log('✅ User notification sent');
    
  } catch (error) {
    console.error('❌ Error processing web_app_data:', error);
    
    try {
      await ctx.answerWebAppQuery({
        type: 'article',
        id: 'order_error',
        title: 'Ошибка',
        input_message_content: {
          message_text: '❌ Произошла ошибка при обработке заказа. Попробуйте еще раз.'
        }
      });
    } catch (answerError) {
      console.error('❌ Error sending error response:', answerError);
    }
  }
});

// Обработчик остальных сообщений
bot.on('message', (ctx) => {
  console.log('📨 Message received:', ctx.message);
  ctx.reply('Используйте WebApp для создания заказа.');
});

console.log('🚀 Bot configured successfully');

// Обработчик для Vercel (только для информации)
export default async function handler(req, res) {
  console.log('🔗 Bot handler called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Bot is running',
      timestamp: new Date().toISOString(),
      endpoints: {
        webhook: '/api/webhook',
        webapp_data: '/api/webapp-data',
        test: '/api/test',
        status: '/api/bot-status',
        webhook_info: '/api/webhook-info',
        set_webhook: '/api/set-webhook'
      }
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
