// Простой тест endpoint
export default function handler(req, res) {
  try {
    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Простой успешный ответ
    return res.status(200).json({
      status: 'ok',
      message: 'Bot is working',
      timestamp: new Date().toISOString(),
      telegram: 'WebApp connection successful'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
