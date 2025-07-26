// Проверка статуса бота и вебхука
import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new Telegraf(BOT_TOKEN);

export default async function handler(req, res) {
  try {
    console.log('🤖 Checking bot status...');
    
    // Получаем информацию о боте
    const botInfo = await bot.telegram.getMe();
    
    // Получаем информацию о вебхуке
    const webhookInfo = await bot.telegram.getWebhookInfo();
    
    console.log('Bot info:', botInfo);
    console.log('Webhook info:', webhookInfo);
    
    res.status(200).json({
      success: true,
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name
      },
      webhook: {
        url: webhookInfo.url,
        has_custom_certificate: webhookInfo.has_custom_certificate,
        pending_update_count: webhookInfo.pending_update_count,
        last_error_date: webhookInfo.last_error_date,
        last_error_message: webhookInfo.last_error_message,
        max_connections: webhookInfo.max_connections,
        allowed_updates: webhookInfo.allowed_updates
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Bot status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
