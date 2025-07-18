/**
 * Модуль для работы с темой Telegram WebApp
 */

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

/**
 * Устанавливает CSS переменные для темы Telegram
 */
export const setCSSThemeVariables = (themeParams: Record<string, string>) => {
  const root = document.documentElement
  
  Object.entries(themeParams).forEach(([key, value]) => {
    root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value)
  })
  
  console.log('CSS переменные темы установлены:', Object.keys(themeParams).length)
}

/**
 * Устанавливает fallback тему по умолчанию
 */
export const setFallbackTheme = () => {
  const root = document.documentElement
  const fallbackTheme: Record<string, string> = {
    'bg-color': '#ffffff',
    'text-color': '#000000',
    'hint-color': '#999999',
    'link-color': '#2481cc',
    'button-color': '#2481cc',
    'button-text-color': '#ffffff',
    'secondary-bg-color': '#f1f1f1',
    'header-bg-color': '#ffffff',
    'accent-text-color': '#2481cc',
    'section-bg-color': '#ffffff',
    'section-header-text-color': '#6d6d71',
    'subtitle-text-color': '#999999',
    'destructive-text-color': '#ff3b30'
  }
  
  Object.entries(fallbackTheme).forEach(([key, value]) => {
    root.style.setProperty(`--tg-theme-${key}`, value)
  })
  
  console.log('Установлена fallback тема')
}

/**
 * Получает theme параметры из URL
 */
export const getThemeFromURL = (): Record<string, string> | null => {
  try {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const stylesParam = params.get('tgWebAppThemeParams')
    
    if (stylesParam) {
      return JSON.parse(decodeURIComponent(stylesParam))
    }
  } catch (error) {
    console.error('Ошибка парсинга theme params из URL:', error)
  }
  
  return null
}

/**
 * Получает theme параметры из Telegram WebApp API
 */
export const getThemeFromWebApp = (): Record<string, string> | null => {
  try {
    if (window.Telegram?.WebApp?.themeParams) {
      return window.Telegram.WebApp.themeParams as Record<string, string>
    }
  } catch (error) {
    console.error('Ошибка получения theme params из WebApp API:', error)
  }
  
  return null
}

/**
 * Инициализирует тему Telegram WebApp
 */
export const initializeTelegramTheme = () => {
  // Сначала пробуем получить из URL
  let themeParams = getThemeFromURL()
  if (themeParams) {
    console.log('Theme params из URL:', themeParams)
    setCSSThemeVariables(themeParams)
    return
  }
  
  // Затем пробуем получить из WebApp API
  themeParams = getThemeFromWebApp()
  if (themeParams) {
    console.log('Theme params из WebApp API:', themeParams)
    setCSSThemeVariables(themeParams)
    return
  }
  
  // Если ничего не найдено, устанавливаем fallback тему
  console.log('Theme params не найдены, используем fallback тему')
  setFallbackTheme()
}
