export default async function handler(req, res) {
  res.status(200).json({
    message: 'Telegram Bot Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      bot_info: '/api/bot',
      webhook: '/api/webhook',
      webapp_data: '/api/webapp-data',
      test: '/api/test',
      bot_status: '/api/bot-status',
      webhook_info: '/api/webhook-info',
      set_webhook: '/api/set-webhook'
    }
  });
}
