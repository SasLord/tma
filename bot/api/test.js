// Тестовый эндпоинт для проверки работы бота
export default async function handler(req, res) {
  try {
    console.log('🔍 Test endpoint called:', req.method, req.url);
    console.log('📝 Headers:', req.headers);
    console.log('📦 Body:', req.body);
    
    res.status(200).json({
      success: true,
      message: 'Test endpoint is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      body: req.body
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
}
