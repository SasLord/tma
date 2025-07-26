import { Telegraf } from 'telegraf';

export default async function handler(req, res) {
  console.log('🔧 Set webhook handler called');
  
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found');
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const bot = new Telegraf(BOT_TOKEN);
    const webhookUrl = 'https://bot-blue-five.vercel.app/api/webhook';
    
    console.log('📍 Setting webhook URL:', webhookUrl);
    
    // Устанавливаем webhook
    await bot.telegram.setWebhook(webhookUrl);
    
    console.log('✅ Webhook set successfully');
    
    // Проверяем, что webhook установлен
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('📋 Webhook info:', webhookInfo);
    
    res.status(200).json({ 
      success: true, 
      message: 'Webhook set successfully',
      webhookUrl: webhookUrl,
      webhookInfo: webhookInfo,
      timestamp: new Date().toISOString() 
    });
    
  } catch (error) {
    console.error('❌ Set webhook error:', error);
    res.status(500).json({ 
      error: 'Failed to set webhook', 
      details: error.message 
    });
  }
}
