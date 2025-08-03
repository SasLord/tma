import { Telegraf } from 'telegraf'
import {
  saveOrder,
  getAllOrders,
  clearAllOrders,
  isAdmin,
  addAdmin,
  removeAdmin,
  updateAdmin,
  getAllAdmins,
  isSuperAdmin
} from './database.js'

const SUPER_ADMIN_ID = '1155907659' // ID супер-администратора

export const handler = async (event) => {
  console.log('🔗 Netlify webhook handler called')
  console.log('Method:', event.httpMethod)
  console.log('Body:', event.body)

  // CORS заголовки
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // Функция отправки сообщения всем администраторам
  async function sendToAllAdmins(message, botInstance) {
    try {
      // Получаем список всех администраторов
      const admins = await getAllAdmins()
      console.log(`📋 Found ${admins.length} admins to notify`)

      if (admins.length === 0) {
        console.log('⚠️ No admins found to notify')
        return { success: false, sent: 0, total: 0, error: 'No admins found' }
      }

      // Отправляем сообщение каждому администратору
      const promises = admins.map(async (admin) => {
        try {
          console.log(`📤 Sending message to admin ${admin.user_id} (${admin.name})`)
          const result = await botInstance.telegram.sendMessage(admin.user_id, message)
          console.log(`✅ Message sent to admin ${admin.user_id}`)
          return result
        } catch (error) {
          console.error(`❌ Failed to send message to admin ${admin.user_id}:`, error.message)
          return null
        }
      })

      // Ждем завершения всех отправок
      const results = await Promise.all(promises)
      const successful = results.filter((r) => r !== null).length

      console.log(`📨 Message sent to ${successful}/${admins.length} admins`)
      return { success: successful > 0, sent: successful, total: admins.length }
    } catch (error) {
      console.error('❌ Failed to send to all admins:', error)
      return { success: false, error: error.message, sent: 0, total: 0 }
    }
  }

  // Обрабатываем preflight запросы
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight request')
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Обрабатываем GET запросы для получения данных
  if (event.httpMethod === 'GET') {
    console.log('📖 GET request processing')
    const queryParams = event.queryStringParameters || {}

    if (queryParams.type === 'get_orders') {
      const userId = queryParams.user_id
      if (!userId || !(await isAdmin(userId))) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Access denied' })
        }
      }

      const orders = await getAllOrders()
      console.log('📋 Retrieved orders:', orders.length)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ orders })
      }
    }

    if (queryParams.type === 'check_admin') {
      const userId = queryParams.user_id
      const adminStatus = await isAdmin(userId)
      console.log('👤 Admin check for user:', userId, 'Result:', adminStatus)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ isAdmin: adminStatus })
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid GET request type' })
    }
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ Invalid method:', event.httpMethod)
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN

    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Bot token not configured' })
      }
    }

    const bot = new Telegraf(BOT_TOKEN)
    const ADMIN_CHAT_ID = '1155907659'
    const WEBAPP_URL = 'https://tma-webapp-store.netlify.app/'

    // Настройка Menu Button (кнопка "Open" в меню чата)
    const setupMenuButton = async () => {
      try {
        await bot.telegram.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: '🛍️ Каталог услуг',
            web_app: {
              url: WEBAPP_URL
            }
          }
        })
        console.log('✅ Menu button updated successfully')
      } catch (error) {
        console.error('❌ Failed to set menu button:', error)
      }
    }

    // Устанавливаем Menu Button при первом запуске
    await setupMenuButton()

    // Парсим JSON из event.body
    let requestBody
    try {
      requestBody = JSON.parse(event.body)
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' })
      }
    }

    // === ОБРАБОТКА TELEGRAM BOT UPDATES ===
    if (requestBody.update_id || requestBody.message || requestBody.callback_query) {
      console.log('🤖 Telegram bot update received')

      // Настройка команд бота
      bot.start((ctx) => {
        const welcomeMessage =
          '🎉 Добро пожаловать в наш сервис!\n\n' +
          '🛍️ Используйте команду /webapp чтобы открыть каталог услуг\n' +
          '💰 Выберите нужные услуги и оформите заказ прямо в Telegram!'

        ctx.reply(welcomeMessage, {
          reply_markup: {
            inline_keyboard: [[{ text: '🛍️ Открыть каталог', web_app: { url: WEBAPP_URL } }]]
          }
        })
      })

      bot.command('webapp', (ctx) => {
        console.log('🌐 /webapp command triggered')

        const message =
          '🛍️ Откройте наш каталог услуг в веб-приложении!\n\n' +
          '👆 Нажмите кнопку ниже, чтобы выбрать и заказать услуги'

        ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [[{ text: '🛍️ Открыть каталог услуг', web_app: { url: WEBAPP_URL } }]]
          }
        })
      })

      bot.help((ctx) => {
        const helpMessage =
          '📋 Доступные команды:\n\n' +
          '/start - Начать работу с ботом\n' +
          '/webapp - Открыть каталог услуг\n' +
          '/help - Показать эту справку\n' +
          '/updatemenu - Обновить кнопку меню (для админов)\n\n' +
          '🛎️ Для заказа услуг используйте веб-приложение!'

        ctx.reply(helpMessage)
      })

      // Команда для принудительного обновления Menu Button (только для админов)
      bot.command('updatemenu', async (ctx) => {
        const userId = ctx.from.id.toString()
        
        // Проверяем, является ли пользователь администратором
        const userIsAdmin = await isAdmin(userId)
        const userIsSuperAdmin = await isSuperAdmin(userId)
        
        if (!userIsAdmin && !userIsSuperAdmin) {
          ctx.reply('❌ Эта команда доступна только администраторам')
          return
        }

        try {
          await setupMenuButton()
          ctx.reply('✅ Кнопка меню успешно обновлена!')
          console.log(`🔄 Menu button updated by admin ${userId}`)
        } catch (error) {
          ctx.reply('❌ Ошибка при обновлении кнопки меню')
          console.error('❌ Menu button update failed:', error)
        }
      })

      // Обработка веб-данных от приложения
      bot.on('web_app_data', (ctx) => {
        console.log('📱 Web app data received:', ctx.webAppData)

        try {
          const data = JSON.parse(ctx.webAppData.data)
          console.log('📊 Parsed web app data:', data)
          // Здесь можно обработать данные от веб-приложения
          ctx.reply('✅ Данные получены и обрабатываются!')
        } catch (error) {
          console.error('❌ Failed to parse web app data:', error)
          ctx.reply('❌ Ошибка обработки данных')
        }
      })

      // Обработка всех остальных сообщений
      bot.on('text', (ctx) => {
        const message =
          '🤖 Используйте команду /webapp для открытия каталога услуг\n' +
          'Или /help для получения справки'

        ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [[{ text: '🛍️ Открыть каталог', web_app: { url: WEBAPP_URL } }]]
          }
        })
      })

      // Обрабатываем обновление
      try {
        await bot.handleUpdate(requestBody)
        console.log('✅ Telegram update processed')

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Update processed' })
        }
      } catch (botError) {
        console.error('❌ Bot error:', botError)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Bot processing failed', details: botError.message })
        }
      }
    }

    // === ОБРАБОТКА ЗАКАЗОВ ЧЕРЕЗ SDK ===
    if (requestBody.services && Array.isArray(requestBody.services)) {
      console.log('🌐 Order received via Telegram SDK')

      const services = requestBody.services
      const totalPrice = requestBody.totalPrice || services.reduce((sum, s) => sum + s.price, 0)
      const platform = requestBody.platform || 'HTTP'
      const user = requestBody.user
      const orderType = requestBody.type || 'order'

      try {
        // Сохраняем заказ в базу данных
        const orderId = await saveOrder({
          services,
          totalPrice,
          platform,
          user,
          type: orderType
        })
        console.log(`✅ Order saved to database with ID: ${orderId}`)
      } catch (dbError) {
        console.error('❌ Failed to save order to database:', dbError)
        // Продолжаем выполнение даже если БД недоступна
      }

      // Формируем список услуг
      const servicesList = services
        .map((service) => '• ' + service.name + ' - ' + service.price.toLocaleString() + '₽')
        .join('\n')

      // Информация о пользователе
      let userInfo = ''
      if (user) {
        userInfo =
          '👤 Пользователь: ' +
          (user.first_name || 'Неизвестно') +
          ' ' +
          (user.last_name || '') +
          '\n' +
          '🆔 ID: ' +
          (user.id || 'Неизвестно') +
          '\n' +
          '👤 Username: @' +
          (user.username || 'отсутствует') +
          '\n\n'
      }

      // Расширенное сообщение с данными SDK
      const message =
        '🛍️ Новый заказ через Telegram WebApp!\n\n' +
        userInfo +
        '📋 Выбранные услуги:\n' +
        servicesList +
        '\n\n' +
        '💰 Общая сумма: ' +
        totalPrice.toLocaleString() +
        '₽\n' +
        '🌐 Платформа: ' +
        platform +
        '\n' +
        '📱 Тип: ' +
        orderType +
        '\n' +
        '📅 Время: ' +
        new Date().toLocaleString('ru-RU', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })

      try {
        const sendResult = await sendToAllAdmins(message, bot)
        console.log(`✅ SDK order sent to admins: ${sendResult.sent}/${sendResult.total}`)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Order processed via Telegram SDK',
            orderType,
            totalPrice,
            servicesCount: services.length,
            notifiedAdmins: sendResult.sent
          })
        }
      } catch (sendError) {
        console.error('❌ Failed to send message:', sendError)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to send message', details: sendError.message })
        }
      }
    }

    // === API ДЛЯ АДМИНИСТРИРОВАНИЯ ===
    if (requestBody.action) {
      const userId = requestBody.user?.id?.toString()

      // Обработка проверки административных прав (не требует авторизации)
      if (requestBody.action === 'check_admin') {
        console.log('🔍 Admin check request for user:', userId)

        const userIsAdmin = await isAdmin(userId)
        const userIsSuperAdmin = await isSuperAdmin(userId)

        console.log(
          `👤 User ${userId} - isAdmin: ${userIsAdmin}, isSuperAdmin: ${userIsSuperAdmin}`
        )

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            isAdmin: userIsAdmin,
            isSuperAdmin: userIsSuperAdmin
          })
        }
      }

      // Проверяем, что пользователь является администратором
      if (!userId || !(await isAdmin(userId))) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Access denied. Admin privileges required.' })
        }
      }

      switch (requestBody.action) {
        case 'get_orders':
          try {
            const orders = await getAllOrders()
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ success: true, orders })
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to get orders', details: error.message })
            }
          }

        case 'clear_orders':
          try {
            // Только супер-администратор может очистить все заказы
            const isSuper = await isSuperAdmin(userId)
            if (!isSuper) {
              return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Only super admin can clear all orders' })
              }
            }

            await clearAllOrders()
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ success: true, message: 'All orders cleared successfully' })
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to clear orders', details: error.message })
            }
          }

        case 'get_admins':
          try {
            const adminsList = await getAllAdmins()
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ success: true, admins: adminsList })
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to get admins', details: error.message })
            }
          }

        case 'get_user_data':
          try {
            const { targetUserId } = requestBody
            if (!targetUserId) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Target user ID is required' })
              }
            }

            // Пытаемся получить информацию о пользователе через Telegram Bot API
            try {
              const chatInfo = await bot.telegram.getChat(targetUserId)
              const userData = {
                id: chatInfo.id,
                first_name: chatInfo.first_name,
                last_name: chatInfo.last_name,
                username: chatInfo.username
              }

              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, userData })
              }
            } catch (error) {
              // Если не удалось получить через Telegram API, возвращаем ошибку
              console.error('❌ Failed to get user data from Telegram:', error)
              return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                  success: false,
                  error: 'Пользователь не найден или бот не имеет доступа к его данным'
                })
              }
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to get user data', details: error.message })
            }
          }

        case 'add_admin':
          try {
            const { targetUserId, targetUserName, targetUsername } = requestBody
            if (!targetUserId) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Target user ID is required' })
              }
            }

            const newAdmin = await addAdmin(targetUserId, targetUserName, targetUsername)
            if (newAdmin) {
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  success: true,
                  message: 'Admin added successfully',
                  admin: newAdmin
                })
              }
            } else {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Admin already exists or invalid data' })
              }
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to add admin', details: error.message })
            }
          }

        case 'remove_admin':
          try {
            const { targetUserId } = requestBody
            if (!targetUserId) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Target user ID is required' })
              }
            }

            const result = await removeAdmin(targetUserId, userId)
            if (result.success) {
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Admin removed successfully' })
              }
            } else {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: result.error })
              }
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to remove admin', details: error.message })
            }
          }

        case 'update_admin':
          try {
            const { targetUserId, updates } = requestBody
            if (!targetUserId) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Target user ID is required' })
              }
            }

            const result = await updateAdmin(targetUserId, updates)
            if (result.success) {
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  success: true,
                  message: 'Admin updated successfully',
                  admin: result.admin
                })
              }
            } else {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: result.error })
              }
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to update admin', details: error.message })
            }
          }

        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Unknown action' })
          }
      }
    }

    console.log('❌ No valid services in request')
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No services provided' })
    }
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    }
  }
}
