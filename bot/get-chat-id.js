import { Telegraf } from 'telegraf';

// Замените на ваш токен
const BOT_TOKEN = '8146779278:AAFTuA8RHRgN8IHKOYkB0IRfJM7dHA_2Tis';

const bot = new Telegraf(BOT_TOKEN);

// Обработчик для получения Chat ID
bot.on('message', (ctx) => {
  const chatId = ctx.chat.id;
  const chatType = ctx.chat.type;
  const firstName = ctx.from.first_name;
  const username = ctx.from.username;

  console.log('📋 ИНФОРМАЦИЯ О ЧАТЕ:');
  console.log(`Chat ID: ${chatId}`);
  console.log(`Тип чата: ${chatType}`);
  console.log(`Имя: ${firstName}`);
  console.log(`Username: @${username || 'не указан'}`);
  console.log('-------------------');

  // Отправляем Chat ID обратно пользователю
  ctx.reply(`🆔 Ваш Chat ID: \`${chatId}\`

📋 Информация:
• Тип чата: ${chatType}
• Имя: ${firstName}
• Username: @${username || 'не указан'}

💡 Скопируйте этот Chat ID и добавьте в переменную ADMIN_CHAT_IDS`, {
    parse_mode: 'Markdown'
  });
});

// Команда /start
bot.start((ctx) => {
  ctx.reply(`👋 Привет! 

Этот бот поможет узнать ваш Chat ID.

📝 Просто отправьте любое сообщение, и я покажу ваш Chat ID.

💡 Chat ID нужен для получения уведомлений от вашего WebApp бота.`);
});

// Команда /id
bot.command('id', (ctx) => {
  const chatId = ctx.chat.id;
  ctx.reply(`🆔 Ваш Chat ID: \`${chatId}\``, {
    parse_mode: 'Markdown'
  });
});

console.log('🤖 Бот запущен! Отправьте ему любое сообщение для получения Chat ID...');

bot.launch();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
