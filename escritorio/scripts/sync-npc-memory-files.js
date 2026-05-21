const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const root = path.resolve(__dirname, '..', '..');
const db = new Database(path.resolve(__dirname, '..', 'data', 'deskrpg.db'));
const agentMemoryRoot = path.join(root, 'agent-memory');
const obsidianRoot = path.join(agentMemoryRoot, '_obsidian-clones');

const folderByAgent = {
  'gael-ceo': ['lord-stanken','lord-starken'],
  'gerente-operacional': ['lurdinha'],
  'maria-onboarding-clientes': ['maria-onboarding-de-clientes','maria'],
  'joao-relatorios-analise': ['joao-relatorios-analise-de-dados','joao'],
  'zezin-monitoramento-proativo': ['zezin-monitoramento-proativo','zezin'],
  'josy-integracoes-ferramentas': ['josy-int-c-ferramentas','josy'],
  'sneider-design': ['sneider-design','sneider'],
  'ravi-engenharia-plataforma': ['ravi-engenharia-de-plataforma','ravi'],
  'nina-qa-publicacoes': ['nina-qa-de-publicacoes','nina'],
  'teo-eficiencia-operacional': ['teo-eficiencia-operacional','teo'],
  'gaia-produto-e-evolucao': ['gaia-produto-evolucao','gaia'],
  'maya-memoria-e-conhecimento': ['maya-memoria-conhecimento','maya'],
  'strategic-steve-jobs': ['steve-jobs-produto-experiencia'],
  'strategic-claude-hopkins': ['claude-hopkins-copy-cientifico'],
  'strategic-eugene-schwartz': ['eugene-schwartz-desejo-mercado'],
  'strategic-frank-kern': ['frank-kern-funis-conversacionais'],
  'strategic-pedro-sobral': ['pedro-sobral-meta-ads'],
  'strategic-alex-hormozi': ['alex-hormozi-oferta-monetizacao'],
  'strategic-daniel-kahneman': ['daniel-kahneman-decisao-comportamento'],
  'strategic-james-clear': ['james-clear-processos-habitos'],
  'strategic-cal-newport': ['cal-newport-foco-operacao-profunda'],
  'strategic-sam-altman': ['sam-altman-ia-produto'],
  'strategic-nassim-taleb': ['taleb-risco-antifragilidade'],
  'strategic-tony-robbins': ['tony-robbins-vendas-energia'],
  'strategic-priscila-zillo': ['priscila-zillo-branding-humanizado'],
};

const obsidianByAgent = {
  'strategic-claude-hopkins': 'Claude Hopkins',
  'strategic-eugene-schwartz': 'Eugene Schwartz',
  'strategic-frank-kern': 'Frank Kern',
  'strategic-pedro-sobral': 'Pedro Sobral',
  'strategic-alex-hormozi': 'Alex Hormozi',
  'strategic-daniel-kahneman': 'Daniel Kahneman',
  'strategic-james-clear': 'James Clear',
  'strategic-cal-newport': 'Cal Newport',
  'strategic-sam-altman': 'Sam Altman',
  'strategic-nassim-taleb': 'Nassim Nicholas Taleb',
  'strategic-tony-robbins': 'Tony Robbins',
  'strategic-priscila-zillo': 'Priscila Zillo',
  'strategic-steve-jobs': 'Steve Jobs',
};

const telegramUsernames = {
  'strategic-eugene-schwartz': 'EugeneSchwartzStarken_bot',
  'strategic-frank-kern': 'FrankKernStarken_bot',
  'strategic-nassim-taleb': 'NassimNicholasTalebStarken_bot',
  'strategic-pedro-sobral': 'PedroSobralStarken_bot',
  'strategic-priscila-zillo': 'PriscilaZiloStarken_bot',
  'strategic-sam-altman': 'SamAltmanStarken_bot',
  'strategic-steve-jobs': 'SteveJobsStarken_bot',
  'strategic-tony-robbins': 'TonyRobbinsStarken_bot',
};

const classify = (file) => {
  const base = path.basename(file).toLowerCase();
  if (base.includes('profile')) return 'profile';
  if (base.includes('long-term')) return 'long_term';
  if (base.includes('working-context')) return 'working_context';
  if (base.includes('telegram')) return 'telegram_summary';
  if (base.includes('summary')) return 'summary';
  if (base.includes('quality')) return 'quality_report';
  if (base.includes('fontes') || base.includes('refer')) return 'references';
  if (base.match(/^m\d/)) return 'clone_module';
  if (base.startsWith('00')) return 'executive_summary';
  return 'knowledge';
};

const titleFrom = (file) => path.basename(file, path.extname(file)).replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
const approxTokens = (text) => Math.ceil((text || '').length / 4);
const hashId = (prefix, parts) => prefix + '-' + crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 24);

function walkMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'logs') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push(full);
    }
  }
  return out.sort();
}

const upsertMemory = db.prepare(`
  INSERT INTO npc_memory_items (id, npc_id, memory_type, title, content, metadata, pinned, sort_order, created_at, updated_at)
  VALUES (@id, @npc_id, @memory_type, @title, @content, @metadata, @pinned, @sort_order, datetime('now'), datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    memory_type=excluded.memory_type,
    title=excluded.title,
    content=excluded.content,
    metadata=excluded.metadata,
    pinned=excluded.pinned,
    sort_order=excluded.sort_order,
    updated_at=datetime('now')
`);

const updateNpc = db.prepare("UPDATE npcs SET openclaw_config = @config, total_tokens = CASE WHEN total_tokens < @tokens THEN @tokens ELSE total_tokens END, updated_at = datetime('now') WHERE id = @id");
const npcs = db.prepare('SELECT id, name, total_tokens, openclaw_config FROM npcs').all();
let syncedMemoryItems = 0;
let touchedNpcs = 0;

const tx = db.transaction(() => {
  for (const npc of npcs) {
    let cfg = {};
    try { cfg = JSON.parse(npc.openclaw_config || '{}'); } catch {}
    const agentId = cfg.agentId || cfg.agent_id || '';
    if (!agentId) continue;

    const files = [];
    for (const folder of (folderByAgent[agentId] || [])) {
      files.push(...walkMd(path.join(agentMemoryRoot, folder)).map(f => ({ file: f, source: 'agent-memory-file' })));
    }
    const obsidianFolder = obsidianByAgent[agentId];
    if (obsidianFolder) {
      files.push(...walkMd(path.join(obsidianRoot, obsidianFolder)).map(f => ({ file: f, source: 'obsidian-clone-file' })));
    }
    if (!files.length && !telegramUsernames[agentId]) continue;

    let tokenTotal = npc.total_tokens || 0;
    let order = 0;
    for (const item of files) {
      const content = fs.readFileSync(item.file, 'utf8').trim();
      if (!content) continue;
      const rel = path.relative(root, item.file);
      const metadata = JSON.stringify({ source: item.source, file: rel, syncedAt: new Date().toISOString() });
      upsertMemory.run({
        id: hashId('memfile', [npc.id, rel]),
        npc_id: npc.id,
        memory_type: classify(item.file),
        title: titleFrom(item.file),
        content,
        metadata,
        pinned: item.file.includes('profile.md') || (item.source === 'obsidian-clone-file' && /(^|\/)00\s*-/.test(rel)) ? 1 : 0,
        sort_order: order++,
      });
      tokenTotal += approxTokens(content);
      syncedMemoryItems++;
    }

    if (!cfg.sourcePaths) cfg.sourcePaths = {};
    if ((folderByAgent[agentId] || [])[0]) cfg.sourcePaths.agentMemory = 'agent-memory/' + folderByAgent[agentId][0];
    if (obsidianFolder) cfg.sourcePaths.obsidianClone = 'agent-memory/_obsidian-clones/' + obsidianFolder;
    if (telegramUsernames[agentId]) {
      cfg.botUsername = telegramUsernames[agentId];
      cfg.telegram = Object.assign({}, cfg.telegram || {}, {
        enabled: true,
        username: telegramUsernames[agentId],
        tokenEnv: cfg.telegramTokenEnv || ('TELEGRAM_' + agentId.replace(/^strategic-/, '').replace(/-/g, '_').toUpperCase() + '_BOT_TOKEN')
      });
    }
    updateNpc.run({ id: npc.id, config: JSON.stringify(cfg), tokens: tokenTotal });
    touchedNpcs++;
  }
});

tx();
console.log(JSON.stringify({ ok: true, touchedNpcs, syncedMemoryItems }, null, 2));
