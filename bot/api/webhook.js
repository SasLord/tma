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
    
    // Передаем обновление боту
    await bot.handleUpdate(req.body);
    
    console.log('✅ Webhook processed successfully');
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
