export default async function handler(req, res) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // URL для вебхука (текущий домен + /api/webhook)
    const webhookUrl = `https://${req.headers.host}/api/webhook`;
    
    console.log(`Setting webhook to: ${webhookUrl}`);

    // Устанавливаем вебхук
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'web_app_data', 'callback_query']
      })
    });

    const data = await response.json();
    
    console.log('Webhook setup response:', data);

    if (data.ok) {
      res.status(200).json({
        success: true,
        webhook_url: webhookUrl,
        response: data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.description,
        response: data
      });
    }
    
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ 
      error: 'Failed to set webhook',
      details: error.message 
    });
  }
}
