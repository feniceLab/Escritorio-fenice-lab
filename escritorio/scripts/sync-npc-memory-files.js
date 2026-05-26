const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const root = path.resolve(__dirname, '..', '..');
const db = new Database(path.resolve(__dirname, '..', 'data', 'deskrpg.db'));
const agentMemoryRoot = path.join(root, 'agent-memory');
const obsidianRoot = path.join(agentMemoryRoot, '_obsidian-clones');
const codexAgentStoreRoot = path.join(root, '.deskrpg-cli-agents');

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
  'strategic-eugene-schwartz': 'EugeneSchwartzFenix_bot',
  'strategic-frank-kern': 'FrankKernFenix_bot',
  'strategic-nassim-taleb': 'NassimNicholasTalebFenix_bot',
  'strategic-pedro-sobral': 'PedroSobralFenix_bot',
  'strategic-priscila-zillo': 'PriscilaZiloFenix_bot',
  'strategic-sam-altman': 'SamAltmanFenix_bot',
  'strategic-steve-jobs': 'SteveJobsFenix_bot',
  'strategic-tony-robbins': 'TonyRobbinsFenix_bot',
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
const clip = (text, max) => {
  const value = String(text || '').trim();
  return value.length > max ? value.slice(0, max).trim() + '\n\n[conteudo truncado para o prompt ativo; arquivo completo permanece na biblioteca do NPC]' : value;
};
const sanitizeAgentId = (agentId) => String(agentId || '')
  .trim()
  .replace(/[^a-zA-Z0-9-_]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

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

const upsertLibrary = db.prepare(`
  INSERT INTO npc_library_items (id, npc_id, layer, category, name, content, metadata, sort_order, created_at, updated_at)
  VALUES (@id, @npc_id, @layer, @category, @name, @content, @metadata, @sort_order, datetime('now'), datetime('now'))
  ON CONFLICT(npc_id, layer, category, name) DO UPDATE SET
    content=excluded.content,
    metadata=excluded.metadata,
    sort_order=excluded.sort_order,
    updated_at=datetime('now')
`);

const updateNpc = db.prepare("UPDATE npcs SET openclaw_config = @config, total_tokens = CASE WHEN total_tokens < @tokens THEN @tokens ELSE total_tokens END, updated_at = datetime('now') WHERE id = @id");
const npcs = db.prepare('SELECT id, name, total_tokens, openclaw_config FROM npcs').all();
let syncedMemoryItems = 0;
let syncedLibraryItems = 0;
let generatedAgentFiles = 0;
let touchedNpcs = 0;

function libraryLayerFor(category) {
  if (category === 'telegram_summary') return 'outputs';
  if (category === 'references') return 'knowledge';
  if (category === 'quality_report') return 'rules';
  if (category === 'profile' || category === 'executive_summary') return 'rules';
  return 'knowledge';
}

function modulePriority(file) {
  const base = path.basename(file).toLowerCase();
  if (base.includes('profile')) return 0;
  if (base.startsWith('00')) return 1;
  if (base.includes('quality')) return 2;
  if (base.includes('m4') || base.includes('comunica')) return 3;
  if (base.includes('m5') || base.includes('valores')) return 4;
  if (base.includes('m6') || base.includes('contexto')) return 5;
  if (base.includes('m2') || base.includes('sistemas')) return 6;
  if (base.includes('m3') || base.includes('dominio') || base.includes('expertise')) return 7;
  return 20;
}

function readFileItem(item) {
  const content = fs.readFileSync(item.file, 'utf8').trim();
  const rel = path.relative(root, item.file);
  const category = classify(item.file);
  return {
    file: item.file,
    source: item.source,
    rel,
    category,
    title: titleFrom(item.file),
    content,
  };
}

function buildPersonaBundle(npc, agentId, sourceFiles) {
  const sorted = sourceFiles.slice().sort((a, b) => modulePriority(a.file) - modulePriority(b.file) || a.rel.localeCompare(b.rel));
  const primary = sorted.filter((f) => f.category === 'profile' || f.category === 'executive_summary' || f.category === 'quality_report').slice(0, 4);
  const style = sorted.filter((f) => /m4|comunica|m5|valores|m6|contexto|soul|tom/i.test(path.basename(f.file))).slice(0, 4);
  const identitySources = (primary.length ? primary : sorted.slice(0, 3));
  const soulSources = (style.length ? style : sorted.slice(3, 6));
  const sourceIndex = sorted.map((f, idx) => `${idx + 1}. ${f.title} (${f.rel})`).join('\n');
  const identity = [
    `# ${npc.name}`,
    '',
    `Agente operacional do Fenix OS. Esta persona foi sincronizada dos arquivos reais do Obsidian/agent-memory vinculados ao agentId "${agentId}".`,
    '',
    identitySources.map((f) => `## ${f.title}\n\n${clip(f.content, 9000)}`).join('\n\n'),
  ].filter(Boolean).join('\n');
  const soul = [
    `# Tom, alma e estilo - ${npc.name}`,
    '',
    soulSources.map((f) => `## ${f.title}\n\n${clip(f.content, 7000)}`).join('\n\n'),
  ].filter(Boolean).join('\n');
  const meetingProtocol = [
    `# Protocolo ativo - ${npc.name}`,
    '',
    'Use os arquivos de biblioteca e memória deste NPC como fonte primária. Responda em português, com ação clara, dono, prazo e próximo passo quando houver operação.',
    '',
    '## Fontes sincronizadas',
    sourceIndex || 'Nenhum arquivo de fonte encontrado.',
    '',
    '## Regra de contexto',
    '- No escritório virtual, considere a operação inteira.',
    '- Em menus de cliente, considere primeiro o cliente selecionado e depois a operação global.',
    '- Quando faltar acesso real, diga exatamente qual acesso falta e qual ação humana destrava.',
  ].join('\n');
  return {
    identity: clip(identity, 24000),
    soul: clip(soul, 18000),
    meetingProtocol: clip(meetingProtocol, 22000),
    sourceIndex,
  };
}

function writeAgentSourceFiles(agentId, npc, bundle) {
  const agentDir = path.resolve(__dirname, '..', 'agents', agentId);
  fs.mkdirSync(agentDir, { recursive: true });
  const files = {
    'persona.md': bundle.identity,
    'soul.md': bundle.soul,
    'prompt.md': bundle.meetingProtocol,
    'library-index.md': bundle.sourceIndex || `# ${npc.name}\n\nNenhuma fonte encontrada.`,
  };
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(agentDir, name), content.trim() + '\n', 'utf8');
    generatedAgentFiles++;
  }
}

function writeCodexRuntimeAgentFiles(agentId, npc, bundle) {
  const sanitizedAgentId = sanitizeAgentId(agentId);
  if (!sanitizedAgentId) return;
  const agentDir = path.join(codexAgentStoreRoot, sanitizedAgentId);
  fs.mkdirSync(agentDir, { recursive: true });
  const now = new Date().toISOString();
  const existingMetadataPath = path.join(agentDir, 'metadata.json');
  let existingMetadata = {};
  try {
    if (fs.existsSync(existingMetadataPath)) {
      existingMetadata = JSON.parse(fs.readFileSync(existingMetadataPath, 'utf8')) || {};
    }
  } catch {}
  const metadata = {
    ...existingMetadata,
    id: sanitizedAgentId,
    name: npc.name || existingMetadata.name || sanitizedAgentId,
    workspace: root,
    source: 'starken-os-sync-npc-memory-files',
    updatedAt: now,
    createdAt: existingMetadata.createdAt || now,
  };
  fs.writeFileSync(existingMetadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');

  const runtimeFiles = {
    'IDENTITY.md': bundle.identity,
    'SOUL.md': bundle.soul,
    'AGENTS.md': bundle.meetingProtocol,
    'LIBRARY_INDEX.md': [
      `# Biblioteca indexada - ${npc.name}`,
      '',
      'Estes arquivos vieram do Obsidian/agent-memory e devem orientar o clone. O conteudo completo fica sincronizado na biblioteca do NPC no banco.',
      '',
      bundle.sourceIndex || 'Nenhuma fonte encontrada.',
    ].join('\n'),
  };
  for (const [name, content] of Object.entries(runtimeFiles)) {
    fs.writeFileSync(path.join(agentDir, name), String(content || '').trim() + '\n', 'utf8');
    generatedAgentFiles++;
  }
}

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

    const sourceFiles = [];
    let tokenTotal = npc.total_tokens || 0;
    let order = 0;
    for (const item of files) {
      const sourceFile = readFileItem(item);
      if (!sourceFile.content) continue;
      sourceFiles.push(sourceFile);
      const rel = sourceFile.rel;
      const category = sourceFile.category;
      const title = sourceFile.title;
      const content = sourceFile.content;
      const metadata = JSON.stringify({ source: item.source, file: rel, syncedAt: new Date().toISOString() });
      upsertMemory.run({
        id: hashId('memfile', [npc.id, rel]),
        npc_id: npc.id,
        memory_type: category,
        title,
        content,
        metadata,
        pinned: item.file.includes('profile.md') || (item.source === 'obsidian-clone-file' && /(^|\/)00\s*-/.test(rel)) ? 1 : 0,
        sort_order: order++,
      });
      upsertLibrary.run({
        id: hashId('libfile', [npc.id, rel]),
        npc_id: npc.id,
        layer: libraryLayerFor(category),
        category,
        name: title,
        content,
        metadata,
        sort_order: order,
      });
      tokenTotal += approxTokens(content);
      syncedMemoryItems++;
      syncedLibraryItems++;
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
    if (sourceFiles.length) {
      const bundle = buildPersonaBundle(npc, agentId, sourceFiles);
      cfg.personaConfig = Object.assign({}, cfg.personaConfig || {}, {
        identity: bundle.identity,
        soul: bundle.soul,
      });
      cfg.persona = bundle.identity;
      cfg.meetingProtocol = bundle.meetingProtocol;
      cfg.sourceIndex = bundle.sourceIndex;
      writeAgentSourceFiles(agentId, npc, bundle);
      writeCodexRuntimeAgentFiles(agentId, npc, bundle);
    }
    updateNpc.run({ id: npc.id, config: JSON.stringify(cfg), tokens: tokenTotal });
    touchedNpcs++;
  }
});

tx();
console.log(JSON.stringify({ ok: true, touchedNpcs, syncedMemoryItems, syncedLibraryItems, generatedAgentFiles }, null, 2));
