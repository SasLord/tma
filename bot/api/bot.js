import { Telegraf } from 'telegraf';

export default async function handler(req, res) {
  console.log('🤖 Bot command handler called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const bot = new Telegraf(BOT_TOKEN);
    
    // Обрабатываем команды
    bot.command('webapp', async (ctx) => {
      console.log('📱 WebApp command triggered');
      
      const message = `🛍️ Добро пожаловать в наш магазин услуг!
      
Нажмите кнопку ниже, чтобы открыть WebApp и оформить заказ:`;

      await ctx.reply(message, {
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
    
    // Передаем обновление боту
    await bot.handleUpdate(req.body);
    
    console.log('✅ Bot command processed successfully');
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Bot command error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
