// Простой CORS тест endpoint
export default async function handler(req, res) {
  console.log('CORS Test endpoint called:', req.method);
  
  // Устанавливаем CORS заголовки для всех запросов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Обрабатываем preflight запрос
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // Основной response
  const responseData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'CORS Test endpoint working',
    method: req.method,
    headers: req.headers,
    cors: 'enabled'
  };

  console.log('Sending response:', responseData);
  return res.status(200).json(responseData);
}
