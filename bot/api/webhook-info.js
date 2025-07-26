export default async function handler(req, res) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // Получаем информацию о вебхуке
    const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const webhookData = await webhookResponse.json();

    // Получаем информацию о боте
    const botResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botData = await botResponse.json();

    res.status(200).json({
      webhook: webhookData,
      bot: botData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({ 
      error: 'Failed to get webhook info',
      details: error.message 
    });
  }
}
