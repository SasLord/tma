import { Telegraf } from 'telegraf';

export default async function handler(req, res) {
  console.log('🔗 WebApp data handler called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'WebApp Data Handler',
      status: 'ready',
      timestamp: new Date().toISOString() 
    });
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Processing WebApp data:', JSON.stringify(req.body, null, 2));
    
    const { initData, services } = req.body;

    if (!services) {
      console.log('❌ Missing services field');
      return res.status(400).json({ error: 'Missing services' });
    }

    // Инициализируем бота для отправки сообщения
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found');
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const bot = new Telegraf(BOT_TOKEN);

    // Формируем текст сообщения
    const servicesList = services.map(service => 
      `• ${service.name} - ${service.price}₽`
    ).join('\n');
    
    const total = services.reduce((sum, service) => sum + service.price, 0);
    
    const message = `🛍️ Новый заказ!

📋 Выбранные услуги:
${servicesList}

💰 Общая сумма: ${total}₽

📅 Время заказа: ${new Date().toLocaleString('ru-RU')}`;

    // Отправляем сообщение администратору
    const ADMIN_CHAT_ID = '1155907659';
    
    console.log('📤 Sending message to admin:', ADMIN_CHAT_ID);
    console.log('Message:', message);
    
    await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
    
    console.log('✅ WebApp data processed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Order processed successfully',
      timestamp: new Date().toISOString() 
    });
    
  } catch (error) {
    console.error('❌ WebApp data error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
