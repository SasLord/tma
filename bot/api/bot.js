export default async function handler(req, res) {
  console.log('🔗 Bot info handler called');
  console.log('Method:', req.method);
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Bot is running',
      timestamp: new Date().toISOString(),
      endpoints: {
        webhook: '/api/webhook',
        webapp_data: '/api/webapp-data'
      }
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
