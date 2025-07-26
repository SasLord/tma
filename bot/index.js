export default async function handler(req, res) {
  res.status(200).json({
    message: 'Telegram Bot Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      bot_info: '/api/bot',
      webhook: '/api/webhook',
      webapp_data: '/api/webapp-data',
      test_send: '/api/test-send',
      set_webhook: '/api/set-webhook'
    }
  });
}
