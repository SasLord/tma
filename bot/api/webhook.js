// Отдельный обработчик для вебхука Telegram
import { bot } from './bot.js';

export default async function handler(req, res) {
  try {
    console.log('📥 Webhook received:', req.method, req.url);
    
    if (req.method === 'POST') {
      // Обработка вебхука от Telegram
      return bot.webhookCallback('/api/webhook')(req, res);
    } else {
      // GET запросы - информация о боте
      res.status(200).json({ 
        status: 'Bot webhook is ready',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      });
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}
