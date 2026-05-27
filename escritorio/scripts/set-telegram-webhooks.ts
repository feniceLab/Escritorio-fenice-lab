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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://escritorio.fenicelab.com.br';

async function setWebhook(slug: string, token: string): Promise<void> {
  if (!token) {
    console.error(`[${slug}] ERRO: token não encontrado`);
    return;
  }

  const webhookUrl = `${BASE_URL}/api/telegram/${slug}/webhook`;
  const apiUrl = `https://api.telegram.org/bot${token}/setWebhook`;

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const data = await res.json() as { ok: boolean; description?: string; result?: boolean };

    if (data.ok) {
      console.log(`✅ [${slug}] Webhook registrado: ${webhookUrl}`);
    } else {
      console.error(`❌ [${slug}] Falha: ${data.description}`);
    }
  } catch (err) {
    console.error(`❌ [${slug}] Erro de rede:`, err);
  }
}

async function main() {
  console.log(`\n🤖 Registrando webhooks Telegram — Base URL: ${BASE_URL}\n`);

  const entries = Object.entries(BOT_TOKENS);
  await Promise.all(entries.map(([slug, token]) => setWebhook(slug, token)));

  console.log('\n✔ Registro concluído.');
}

main();
