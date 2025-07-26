import { Telegraf } from 'telegraf';

export default async function handler(req, res) {
  console.log('🧪 Test send handler called');
  
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

    console.log('🤖 Bot token found, length:', BOT_TOKEN.length);

    const bot = new Telegraf(BOT_TOKEN);
    const ADMIN_CHAT_ID = '1155907659';
    
    const testMessage = `🧪 Тестовое сообщение от бота
    
⏰ Время: ${new Date().toLocaleString('ru-RU')}
🔗 URL: ${req.url}
📊 Method: ${req.method}`;

    console.log('📤 Sending test message to admin:', ADMIN_CHAT_ID);
    
    const result = await bot.telegram.sendMessage(ADMIN_CHAT_ID, testMessage);
    
    console.log('✅ Message sent successfully:', result.message_id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Test message sent successfully',
      message_id: result.message_id,
      timestamp: new Date().toISOString() 
    });
    
  } catch (error) {
    console.error('❌ Test send error:', error);
    res.status(500).json({ 
      error: 'Failed to send test message', 
      details: error.message 
    });
  }
}
