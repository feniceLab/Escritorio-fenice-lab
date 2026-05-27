import { sendDailyReport } from '@/lib/telegram/client';

interface ClientReport {
  name: string;
  openTasks: number;
  closedTasks: number;
  scheduledPosts: number;
}

function formatReport(client: ClientReport): string {
  return [
    `📌 Tarefas abertas: *${client.openTasks}*`,
    `✅ Tarefas fechadas (24h): *${client.closedTasks}*`,
    `📅 Publicações agendadas hoje: *${client.scheduledPosts}*`,
  ].join('\n');
}

async function runDailyReport() {
  console.log('[DailyReportWorker] Iniciando relatório diário:', new Date().toISOString());

  try {
    // Importação dinâmica para evitar dependência circular em tempo de módulo
    const { db } = await import('@/db');

    // Busca clientes ativos via DB (adaptar conforme schema real)
    let clients: ClientReport[] = [];

    try {
      // Tentativa de buscar dados reais do banco
      const { npcs } = await import('@/db');
      const { eq } = await import('drizzle-orm');

      // Placeholder: substitua pela query real quando o schema for confirmado
      clients = [
        { name: 'Geral', openTasks: 0, closedTasks: 0, scheduledPosts: 0 },
      ];
    } catch {
      clients = [{ name: 'Geral', openTasks: 0, closedTasks: 0, scheduledPosts: 0 }];
    }

    for (const client of clients) {
      await sendDailyReport(formatReport(client), client.name);
    }

    console.log('[DailyReportWorker] Relatório enviado com sucesso.');
  } catch (err) {
    console.error('[DailyReportWorker] Erro ao gerar relatório:', err);
  }
}

function scheduleAt8AM() {
  const now = new Date();
  const next8AM = new Date();
  next8AM.setHours(8, 0, 0, 0);
  if (now >= next8AM) next8AM.setDate(next8AM.getDate() + 1);

  const msUntil8AM = next8AM.getTime() - now.getTime();

  setTimeout(() => {
    runDailyReport();
    // Após o primeiro disparo, repetir a cada 24h
    setInterval(runDailyReport, 24 * 60 * 60 * 1000);
  }, msUntil8AM);

  console.log(`[DailyReportWorker] Próximo relatório em ${Math.round(msUntil8AM / 60000)} minutos`);
}

// Tenta usar node-cron se disponível, caso contrário usa setInterval
async function start() {
  try {
    const cron = await import('node-cron');
    cron.schedule('0 8 * * *', runDailyReport);
    console.log('[DailyReportWorker] Agendado via node-cron (08:00 diário)');
  } catch {
    console.log('[DailyReportWorker] node-cron indisponível, usando setTimeout');
    scheduleAt8AM();
  }
}

start();

export { runDailyReport };
