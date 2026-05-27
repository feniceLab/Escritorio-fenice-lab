import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKENS: Record<string, string> = {
  'eugene-schwartz': process.env.TELEGRAM_EUGENE_SCHWARTZ_BOT_TOKEN!,
  'frank-kern': process.env.TELEGRAM_FRANK_KERN_BOT_TOKEN!,
  'nassim-taleb': process.env.TELEGRAM_NASSIM_TALEB_BOT_TOKEN!,
  'pedro-sobral': process.env.TELEGRAM_PEDRO_SOBRAL_BOT_TOKEN!,
  'priscila-zillo': process.env.TELEGRAM_PRISCILA_ZILLO_BOT_TOKEN!,
  'sam-altman': process.env.TELEGRAM_SAM_ALTMAN_BOT_TOKEN!,
  'steve-jobs': process.env.TELEGRAM_STEVE_JOBS_BOT_TOKEN!,
  'tony-robbins': process.env.TELEGRAM_TONY_ROBBINS_BOT_TOKEN!,
};

const botInstances: Record<string, TelegramBot> = {};

function getBot(slug: string): TelegramBot {
  if (!botInstances[slug]) {
    const token = BOT_TOKENS[slug];
    if (!token) throw new Error(`Bot token not found for slug: ${slug}`);
    botInstances[slug] = new TelegramBot(token, { polling: false });
  }
  return botInstances[slug];
}

export async function sendTelegramMessage(
  botSlug: string,
  chatId: string | number,
  message: string,
  options?: { parseMode?: 'HTML' | 'Markdown' }
): Promise<void> {
  const bot = getBot(botSlug);
  await bot.sendMessage(chatId, message, {
    parse_mode: options?.parseMode ?? 'Markdown',
  });
}

export async function broadcastToGroup(
  message: string,
  groupType: 'operational' | 'agents' | 'meeting'
): Promise<void> {
  const groupMap: Record<string, string> = {
    operational: process.env.TELEGRAM_OPERATIONAL_GROUP_ID!,
    agents: process.env.TELEGRAM_AGENTS_GROUP_ID!,
    meeting: process.env.TELEGRAM_MEETING_GROUP_ID!,
  };
  const chatId = groupMap[groupType];
  if (!chatId) throw new Error(`Group ID not found for type: ${groupType}`);
  await sendTelegramMessage('pedro-sobral', chatId, message);
}

export async function notifyPublishSuccess(
  clientName: string,
  platform: string,
  postTitle: string
): Promise<void> {
  const message = `✅ *${clientName}* — publicado em ${platform}\n📝 ${postTitle}`;
  await broadcastToGroup(message, 'operational');
}

export async function notifyPublishFailed(
  clientName: string,
  platform: string,
  error: string
): Promise<void> {
  const message = `❌ *${clientName}* — falha ao publicar em ${platform}\n⚠️ ${error}`;
  await broadcastToGroup(message, 'operational');
}

export async function notifyTaskOverdue(
  npcName: string,
  taskTitle: string,
  clientName: string
): Promise<void> {
  const message = `⏰ Tarefa atrasada!\n🤖 ${npcName}: *${taskTitle}*\n👥 Cliente: ${clientName}`;
  await broadcastToGroup(message, 'operational');
}

export async function sendDailyReport(
  reportText: string,
  clientName: string
): Promise<void> {
  const message = `📊 *Relatório Diário — ${clientName}*\n\n${reportText}`;
  await broadcastToGroup(message, 'operational');
}

export { BOT_TOKENS };
