import { sendTelegramMessage } from '@/lib/telegram/client';

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name: string; username?: string };
  chat: { id: number; type: string };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ botSlug: string }> }
) {
  const { botSlug } = await params;
  const body: TelegramUpdate = await req.json();

  console.log(`[Telegram/${botSlug}]`, JSON.stringify(body).slice(0, 200));

  const message = body?.message;
  if (message?.text?.startsWith('/')) {
    await handleCommand(botSlug, message);
  }

  return Response.json({ ok: true });
}

async function handleCommand(botSlug: string, message: TelegramMessage) {
  const chatId = message.chat.id;
  const text = message.text ?? '';
  const command = text.split(' ')[0].toLowerCase();

  try {
    switch (command) {
      case '/status':
        await sendTelegramMessage(botSlug, chatId, '✅ Serviços operacionais\n🤖 Fenix-Lab online\n⏱ Uptime: ativo');
        break;
      case '/clientes':
        await sendTelegramMessage(botSlug, chatId, '👥 *Clientes ativos*\nConsulte o painel em escritorio.fenicelab.com.br', { parseMode: 'Markdown' });
        break;
      case '/help':
        await sendTelegramMessage(
          botSlug,
          chatId,
          '📋 *Comandos disponíveis:*\n/status — status dos serviços\n/clientes — lista clientes ativos\n/help — esta mensagem',
          { parseMode: 'Markdown' }
        );
        break;
      default:
        await sendTelegramMessage(botSlug, chatId, '❓ Comando desconhecido. Use /help para ver os comandos disponíveis.');
    }
  } catch (err) {
    console.error(`[Telegram/${botSlug}] Erro ao processar comando:`, err);
  }
}
