// Официальный Telegram WebApp SDK
// Современная интеграция с использованием @telegram-apps/sdk

import {
  init,
  miniApp,
  initData,
  themeParams,
  viewport,
  mainButton,
  sendData,
  popup,
  type User
} from '@telegram-apps/sdk'

interface ServiceOrder {
  id: string
  name: string
  price: number
}

// Инициализация SDK
let isSDKInitialized = false

// Система событий для отладки
type DebugEventType = 'info' | 'error' | 'warn'

// Глобальная функция для отладочных сообщений (устанавливается из компонента)
let debugCallback: ((type: DebugEventType, message: string) => void) | null = null

export function setDebugCallback(callback: (type: DebugEventType, message: string) => void) {
  debugCallback = callback
}

function debugLog(type: DebugEventType, message: string) {
  console.log(`[${type.toUpperCase()}] ${message}`)
  if (debugCallback) {
    debugCallback(type, message)
  }
}

/**
 * Инициализация Telegram WebApp SDK
 */
export async function initializeTelegramSDK(): Promise<void> {
  if (isSDKInitialized) return

  try {
    debugLog('info', 'Starting Telegram SDK initialization...')

    // Инициализация SDK
    await init()
    debugLog('info', 'SDK init() completed')

    // Инициализация основных компонентов
    await miniApp.mount()
    debugLog('info', 'miniApp mounted')

    initData.restore()
    debugLog('info', 'initData restored')

    themeParams.mount()
    debugLog('info', 'themeParams mounted')

    viewport.mount()
    debugLog('info', 'viewport mounted')

    mainButton.mount()
    debugLog('info', 'mainButton mounted')

    // Настройка viewport
    if (viewport.isMounted()) {
      viewport.expand()
      debugLog('info', 'viewport expanded')
    }

    // Готовность приложения
    miniApp.ready()
    debugLog('info', 'miniApp ready()')

    isSDKInitialized = true
    debugLog('info', 'SDK initialization completed successfully')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    debugLog('error', `SDK initialization failed: ${errorMessage}`)
    console.error('SDK initialization error:', error)
    throw error
  }
}

/**
 * Получение информации о пользователе Telegram
 */
export function getTelegramUser(): User | null {
  try {
    const user = initData.user()
    return user || null
  } catch (error) {
    console.warn('Failed to get user data:', error)
    return null
  }
}

/**
 * Получение расширенных данных инициализации
 */
export function getTelegramInitData() {
  try {
    return {
      queryId: initData.queryId(),
      user: initData.user(),
      receiver: initData.receiver(),
      chat: initData.chat(),
      chatType: initData.chatType(),
      chatInstance: initData.chatInstance(),
      startParam: initData.startParam(),
      canSendAfter: initData.canSendAfter(),
      authDate: initData.authDate(),
      hash: initData.hash(),
      raw: initData.raw()
    }
  } catch (error) {
    console.warn('Failed to get init data:', error)
    return null
  }
}

/**
 * Определяет платформу пользователя
 */
export function getPlatform(): string {
  try {
    // Детектируем мобильные платформы
    const userAgent = navigator.userAgent || ''
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
    const isDesktop = /Windows|Mac|Linux/i.test(userAgent) && !isMobile

    // Используем состояние miniApp для получения информации
    const state = miniApp.state()
    const baseInfo = `telegram_webapp_${state.isActive ? 'active' : 'inactive'}`

    if (isMobile) {
      return `${baseInfo}_mobile`
    } else if (isDesktop) {
      return `${baseInfo}_desktop`
    } else {
      return `${baseInfo}_web`
    }
  } catch {
    return 'unknown'
  }
}

/**
 * Проверяет, работает ли sendData API надежно на текущей платформе
 */
function isSendDataReliable(): boolean {
  const userAgent = navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
  const isDesktop = /Windows|Mac|Linux/i.test(userAgent) && !isMobile

  // В мобильных и десктопных версиях sendData может не работать надежно
  // Принудительно используем HTTP fallback
  return !isMobile && !isDesktop
}

/**
 * Отправка данных через Telegram sendData API
 */
async function sendOrderViaTelegramAPI(services: ServiceOrder[]): Promise<void> {
  debugLog('info', 'Attempting to send order via Telegram sendData API...')

  const orderData = {
    type: 'order',
    services: services,
    user: getTelegramUser(),
    platform: getPlatform(),
    timestamp: Date.now(),
    totalPrice: services.reduce((sum, service) => sum + service.price, 0)
  }

  debugLog(
    'info',
    `Order data prepared: services count = ${services.length}, total = ${orderData.totalPrice}`
  )

  try {
    // Отправка данных через официальный API
    sendData(JSON.stringify(orderData))
    debugLog('info', 'sendData() called successfully')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    debugLog('error', `Telegram sendData failed: ${errorMessage}`)
    throw new Error(`Telegram sendData failed: ${errorMessage}`)
  }
}

/**
 * Отправка заказа через HTTP webhook (резервный метод)
 */
async function sendOrderViaHTTP(services: ServiceOrder[]): Promise<void> {
  debugLog('info', 'Attempting to send order via HTTP webhook...')

  const webhookUrl = 'https://tma-webapp-store.netlify.app/.netlify/functions/webhook'

  const payload = {
    type: 'order',
    services: services,
    user: getTelegramUser(),
    initData: getTelegramInitData(),
    platform: getPlatform(),
    timestamp: Date.now(),
    totalPrice: services.reduce((sum, service) => sum + service.price, 0)
  }

  debugLog(
    'info',
    `HTTP payload prepared: ${payload.services.length} services, total = ${payload.totalPrice}`
  )

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      debugLog(
        'error',
        `HTTP request failed: ${response.status} ${response.statusText} - ${errorText}`
      )
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    debugLog('info', `HTTP order sent successfully: ${JSON.stringify(result)}`)
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    debugLog('error', `HTTP webhook failed: ${errorMessage}`)
    throw error
  }
}

/**
 * Основная функция отправки заказа с fallback
 */
export async function sendOrderToBot(
  services: ServiceOrder[],
  onSuccess?: () => void
): Promise<void> {
  debugLog('info', `=== SENDING ORDER === Services count: ${services.length}`)

  const platform = getPlatform()
  const isReliablePlatform = isSendDataReliable()

  debugLog('info', `Platform: ${platform}, sendData reliable: ${isReliablePlatform}`)

  // Убеждаемся что SDK инициализирован
  await initializeTelegramSDK()

  try {
    // Для мобильных и десктопных версий сразу используем HTTP fallback
    if (!isReliablePlatform) {
      debugLog('warn', 'Platform detected as unreliable for sendData, using HTTP directly')
      await sendOrderViaHTTP(services)
      debugLog('info', 'Order sent via HTTP (direct) successfully!')

      if (onSuccess) {
        onSuccess()
      }
      return
    }

    // Попытка 1: Отправка через официальный Telegram sendData API (только для веб)
    try {
      await sendOrderViaTelegramAPI(services)
      debugLog('info', 'Order sent via Telegram API successfully!')

      // Дополнительная проверка: отправляем также через HTTP для верности
      debugLog('info', 'Sending duplicate via HTTP for reliability...')
      try {
        await sendOrderViaHTTP(services)
        debugLog('info', 'Duplicate HTTP order sent successfully!')
      } catch (httpError) {
        debugLog('warn', `Duplicate HTTP failed, but Telegram API succeeded: ${httpError}`)
      }

      if (onSuccess) {
        onSuccess()
      }
      return
    } catch (telegramError) {
      const errorMessage =
        telegramError instanceof Error ? telegramError.message : String(telegramError)
      debugLog('warn', `Telegram API failed, trying HTTP fallback: ${errorMessage}`)
    }

    // Попытка 2: Отправка через HTTP webhook (fallback)
    await sendOrderViaHTTP(services)
    debugLog('info', 'Order sent via HTTP fallback successfully!')

    if (onSuccess) {
      onSuccess()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    debugLog('error', `All order sending methods failed: ${errorMessage}`)
    throw error
  }
}

/**
 * Настройка главной кнопки с использованием официального SDK
 */
export async function showSendDataButton(
  services: ServiceOrder[],
  onSuccess?: () => void
): Promise<void> {
  debugLog('info', `=== showSendDataButton called === Services count: ${services.length}`)

  // Инициализация SDK
  await initializeTelegramSDK()

  if (!mainButton.isMounted()) {
    debugLog('error', 'MainButton not mounted')
    return
  }

  try {
    // Расчет общей стоимости
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0)
    const buttonText = `Заказать за ${totalPrice.toLocaleString()}₽`

    debugLog('info', `Setting button text: ${buttonText}`)

    // Настройка кнопки
    mainButton.setParams({
      text: buttonText,
      backgroundColor: '#007ACC',
      textColor: '#FFFFFF',
      isEnabled: true,
      isVisible: true
    })

    debugLog('info', 'Button params set successfully')

    // Удаление предыдущих обработчиков
    try {
      mainButton.offClick(() => {})
    } catch {
      debugLog('info', 'No previous handlers to remove')
    }

    // Новый обработчик клика
    const clickHandler = async () => {
      try {
        debugLog('info', 'Main button clicked, sending order...')
        await sendOrderToBot(services, onSuccess)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        debugLog('error', `Button click handler failed: ${errorMessage}`)

        // Показать ошибку пользователю через popup
        try {
          popup.open({
            title: 'Ошибка',
            message: `Не удалось отправить заказ: ${errorMessage}`,
            buttons: [{ id: 'ok', type: 'ok' }]
          })
        } catch (popupError) {
          debugLog('error', `Failed to show error popup: ${popupError}`)
        }
      }
    }

    // Подключение обработчика
    mainButton.onClick(clickHandler)
    debugLog('info', 'Click handler attached successfully')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    debugLog('error', `showSendDataButton failed: ${errorMessage}`)
    throw error
  }
}

/**
 * Скрытие главной кнопки
 */
export function hideMainButton(): void {
  try {
    if (mainButton.isMounted()) {
      mainButton.setParams({ isVisible: false })
      debugLog('info', 'Main button hidden')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    debugLog('error', `Failed to hide main button: ${errorMessage}`)
  }
}

/**
 * Отображение уведомления
 */
export function showNotification(
  title: string,
  message: string,
  _type: 'success' | 'error' | 'info' = 'info'
): void {
  try {
    popup.open({
      title,
      message,
      buttons: [{ id: 'ok', type: 'ok' }]
    })
    debugLog('info', `Notification shown: ${title}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    debugLog('error', `Failed to show notification: ${errorMessage}`)
  }
}

/**
 * Получение возможностей WebApp
 */
export function getTelegramCapabilities() {
  try {
    return {
      sendData: typeof sendData === 'function',
      mainButton: mainButton.isMounted(),
      popup: typeof popup.open === 'function',
      viewport: viewport.isMounted(),
      miniApp: miniApp.isMounted()
    }
  } catch (error) {
    console.warn('Failed to get capabilities:', error)
    return null
  }
}
