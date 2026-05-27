const TelegramBot = require('node-telegram-bot-api');
const token = '8328357265:AAHU7LGl7Cy1zeFLuDm5bT1tF-Q2xAEJi3E';
const bot = new TelegramBot(token, {polling: true});
bot.on('message', (msg) => {
  console.log('>>> NOVA MENSAGEM NO TELEGRAM <<<');
  console.log('De:', msg.from.first_name);
  console.log('Texto:', msg.text);
  bot.sendMessage(msg.chat.id, 'Opa! O servidor recebeu sua mensagem perfeitamente. Em breve serei conectada à minha IA!');
});
console.log('Aguardando mensagens da Lurdinha...');
