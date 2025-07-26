import { Telegraf } from 'telegraf';

export default async function handler(req, res) {
  console.log('🧪 Test WebApp endpoint called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const bot = new Telegraf(BOT_TOKEN);
    const ADMIN_CHAT_ID = '1155907659';
    
    // Отправляем сообщение с кнопкой WebApp
    const message = `🧪 Тестирование WebApp
    
Нажмите кнопку ниже, чтобы открыть WebApp и протестировать отправку заказов:`;

    await bot.telegram.sendMessage(ADMIN_CHAT_ID, message, {
      reply_markup: {
        inline_keyboard: [[{
          text: '🛍️ Открыть WebApp',
          web_app: { url: 'https://bot-blue-five.vercel.app' }
        }]]
      }
    });
    
    console.log('✅ Test WebApp message sent to admin');
    res.status(200).json({ 
      ok: true, 
      message: 'Test WebApp message sent',
      webapp_url: 'https://bot-blue-five.vercel.app'
    });
  } catch (error) {
    console.error('❌ Error in test-webapp:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
