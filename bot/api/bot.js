import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import express from 'express'

// Конфигурация (в продакшене используйте переменные окружения)
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN'
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-webapp.vercel.app'
const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS?.split(',') || []

// Инициализация
const bot = new Telegraf(BOT_TOKEN)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const app = express()

app.use(express.json())

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Функция проверки данных от Telegram WebApp
function validateTelegramData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    
    return calculatedHash === hash
  } catch (error) {
    console.error('Ошибка валидации:', error)
    return false
  }
}

// Функция сохранения пользователя в базу данных
async function saveUserToDatabase(user) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert([
        {
          telegram_id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          is_premium: user.is_premium || false,
          language_code: user.language_code || 'en',
          updated_at: new Date().toISOString()
        }
      ])

    if (error) {
      console.error('❌ Error saving user:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('❌ saveUserToDatabase failed:', error)
    throw error
  }
}

// Команды бота
bot.start((ctx) => {
  const keyboard = {
    inline_keyboard: [[
      { 
        text: '🚀 Открыть WebApp', 
        web_app: { url: WEBAPP_URL }
      }
    ]]
  }
  
  ctx.reply(
    'Добро пожаловать! 👋\n\nОткройте наше веб-приложение для выбора услуг:',
    { reply_markup: keyboard }
  )
})

bot.help((ctx) => {
  ctx.reply(`
🤖 Команды бота:

/start - Открыть WebApp
/help - Показать справку
/status - Проверить статус

📱 Используйте кнопку ниже для открытия приложения.
  `)
})

bot.command('status', (ctx) => {
  ctx.reply('✅ Бот работает нормально!')
})

// Обработчик данных от WebApp (через sendData)
bot.on('web_app_data', async (ctx) => {
  try {
    console.log('📱 Received WebApp data:', ctx.webAppData);
    
    const data = JSON.parse(ctx.webAppData.data);
    console.log('📦 Parsed WebApp data:', data);
    
    // Получаем пользователя из контекста
    const user = ctx.from;
    
    // Формируем заказ в том же формате, что и HTTP API
    const orderData = {
      services: data.services,
      total: data.total,
      user_id: user.id,
      telegram_user_data: JSON.stringify(user)
    };
    
    // Сохраняем пользователя
    await saveUserToDatabase(user);
    
    // Сохраняем заказ
    console.log('📦 Saving order to database...');
    const { data: orderResult, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log('✅ Order saved successfully:', orderResult);
    
    // Отправляем уведомления администраторам
    for (const adminId of ADMIN_CHAT_IDS) {
      try {
        await bot.telegram.sendMessage(adminId, 
          `🔔 Новый заказ #${orderResult[0].id}\n\n` +
          `👤 Пользователь: ${user.first_name} ${user.last_name || ''} (@${user.username || 'без username'})\n` +
          `💰 Сумма: ${data.total} ₽\n\n` +
          `📋 Услуги:\n${data.services.map(s => `• ${s.name} - ${s.price} ₽`).join('\n')}`
        );
      } catch (error) {
        console.error(`Failed to send notification to admin ${adminId}:`, error);
      }
    }
    
    // Отправляем подтверждение пользователю
    await ctx.answerWebAppQuery(ctx.webAppData.query_id, {
      type: 'article',
      id: 'order_success',
      title: '✅ Заказ отправлен',
      description: `Заказ на сумму ${data.total} ₽ успешно отправлен`,
      input_message_content: {
        message_text: `✅ Заказ #${orderResult[0].id} отправлен!\n\nСумма: ${data.total} ₽\nУслуги: ${data.services.length} шт.`
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing WebApp data:', error);
    
    // Отправляем ошибку пользователю
    try {
      await ctx.answerWebAppQuery(ctx.webAppData.query_id, {
        type: 'article',
        id: 'order_error',
        title: '❌ Ошибка',
        description: 'Произошла ошибка при обработке заказа',
        input_message_content: {
          message_text: '❌ Произошла ошибка при обработке заказа. Попробуйте еще раз.'
        }
      });
    } catch (answerError) {
      console.error('❌ Failed to answer WebApp query:', answerError);
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Устанавливаем CORS заголовки
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Bot API is working'
  });
});

// OPTIONS handler для CORS preflight
app.options('/api/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// API endpoint для получения данных от WebApp
app.post('/api/webapp-data', async (req, res) => {
  // Устанавливаем CORS заголовки
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    console.log('📨 Received WebApp request:', JSON.stringify(req.body, null, 2));
    
    const { initData, services } = req.body
    
    if (!initData) {
      console.error('❌ Missing initData');
      return res.status(400).json({ error: 'initData отсутствует' });
    }
    
    if (!services || !Array.isArray(services)) {
      console.error('❌ Missing or invalid services:', services);
      return res.status(400).json({ error: 'Услуги отсутствуют или неверны' });
    }
    
    console.log('🔐 Validating Telegram data...');
    
    // Проверяем подлинность данных (пропускаем для тестовых данных)
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    
    if (hash === 'mock_hash_for_testing') {
      console.log('⚠️ Using mock data for testing - skipping validation');
    } else if (!validateTelegramData(initData, BOT_TOKEN)) {
      console.error('❌ Invalid Telegram data');
      return res.status(401).json({ error: 'Недействительные данные' })
    }
    
    console.log('✅ Telegram data validation passed');
    
    // Парсим данные пользователя из initData
    const user = JSON.parse(urlParams.get('user') || '{}')
    
    console.log('👤 Parsed user:', user);
    
    // Сохраняем пользователя в базу данных
    console.log('💾 Saving user to database...');
    await saveUserToDatabase(user)
    console.log('✅ User saved successfully');
    
    // Сохраняем заказ в базу
    console.log('📦 Saving order to database...');
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          services: services,
          created_at: new Date().toISOString()
        }
      ])
    
    if (error) {
      console.error('❌ Supabase error:', error)
      return res.status(500).json({ error: 'Ошибка сохранения данных: ' + error.message })
    }
    
    console.log('✅ Order saved successfully:', data);
    
    // Уведомляем админов
    const orderText = `
🆕 Новый заказ!

👤 Пользователь: ${user.first_name} ${user.last_name || ''}
📱 Username: @${user.username || 'не указан'}
🆔 ID: ${user.id}

🛍️ Выбранные услуги:
${services.map(service => `• ${service.name} - ${service.price}₽`).join('\n')}

💰 Общая сумма: ${services.reduce((sum, s) => sum + s.price, 0)}₽

⏰ Время: ${new Date().toLocaleString('ru-RU')}
    `
    
    console.log('📢 Sending notifications to admins...');
    
    // Отправляем уведомления всем админам
    for (const adminId of ADMIN_CHAT_IDS) {
      try {
        await bot.telegram.sendMessage(adminId, orderText)
        console.log(`✅ Notification sent to admin ${adminId}`);
      } catch (error) {
        console.error(`❌ Error sending to admin ${adminId}:`, error)
      }
    }
    
    // Отправляем подтверждение пользователю
    try {
      await bot.telegram.sendMessage(user.id, `
✅ Заказ принят!

Спасибо за ваш заказ. Мы свяжемся с вами в ближайшее время.

📋 Детали заказа:
${services.map(service => `• ${service.name}`).join('\n')}

💰 Сумма: ${services.reduce((sum, s) => sum + s.price, 0)}₽
      `)
    } catch (error) {
      console.error('Ошибка отправки пользователю:', error)
    }
    
    res.json({ success: true, orderId: data[0]?.id })
    
  } catch (error) {
    console.error('Ошибка обработки:', error)
    res.status(500).json({ error: 'Внутренняя ошибка сервера' })
  }
})

// API endpoint для получения статистики (для админов)
app.get('/api/stats', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    res.json({ orders })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Запуск бота и сервера
if (process.env.NODE_ENV === 'production') {
  // В продакшене используем вебхуки
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`)
  })
  
  // Настройка вебхука для Vercel
  app.use(bot.webhookCallback('/api/webhook'))
} else {
  // В разработке используем polling
  bot.launch()
  app.listen(3001, () => {
    console.log('🔧 Режим разработки на порту 3001')
  })
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export default app
