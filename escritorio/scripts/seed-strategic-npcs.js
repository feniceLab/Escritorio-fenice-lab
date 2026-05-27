#!/usr/bin/env node
/**
 * Seed dos 12 NPCs estrategicos da biblioteca de clones.
 *
 * Este script e idempotente: pode rodar varias vezes sem duplicar NPC.
 * Ele usa a mesma tabela `npcs` e o mesmo `openclaw_config` do Escritorio
 * Virtual, mantendo a Central de NPCs como fonte unica.
 */
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "deskrpg.db");
const CHANNEL_ID = process.env.STARKEN_CHANNEL_ID || "24219fff-5008-465b-994d-077db53e554a";
const CLONES_ROOT = "/Users/adelia/Library/Mobile Documents/iCloud~md~obsidian/Documents/Clones/Clones";

const TELEGRAM_CLIENT_GROUPS = {
  starken: { name: "Fenix Tecnologia", chatId: "-5125029324", slug: "starken" },
  oca: { name: "Restaurante Oca", chatId: "-5230253545", slug: "oca" },
  academiaSaoPedro: { name: "Academia Sao Pedro", chatId: "-5277163335", slug: "academia-sao-pedro" },
  arenaGourmet: { name: "Arena Gourmet", chatId: "-5260098332", slug: "arena-gourmet" },
  hamburgueriaFeio: { name: "Hamburgueria Feio", chatId: "-5106159402", slug: "hamburgueria-feio" },
  madrugaoCentro: { name: "Madrugao Centro", chatId: "-5289822297", slug: "madrugao-centro" },
  madrugaoFortaleza: { name: "Madrugao Fortaleza", chatId: "-5044192212", slug: "madrugao-fortaleza" },
  madrugaoGarcia: { name: "Madrugao Garcia", chatId: "-5267593990", slug: "madrugao-garcia" },
  cotafacil: { name: "Cota Facil S.F", chatId: "-5070819698", slug: "cotafacil" },
  superXGaruva: { name: "Super X Garuva", chatId: "-5285438735", slug: "super-x-garuva" },
  superXGuaratuba: { name: "Super X Guaratuba", chatId: "-5262319336", slug: "super-x-guaratuba" },
  supremaPizza: { name: "Suprema Pizza", chatId: "-5118825071", slug: "suprema-pizza" },
  dilokasPizzaria: { name: "Dilokas Pizzaria", chatId: "-5025292662", slug: "dilokas-pizzaria" },
  superXItapua: { name: "Super X Itapua", chatId: "-5249165843", slug: "super-x-itapua" },
};

const TOOLKIT = [
  "Read",
  "Write",
  "Edit",
  "Grep",
  "Glob",
  "WebFetch",
  "TodoWrite",
  "Bash",
];

const AUTOMATION_TOOLS = [
  "create_task",
  "update_task_status",
  "assign_task",
  "create_memory",
  "create_client_note",
  "create_meeting_minute",
  "create_report",
  "daily_operations_report",
  "request_approval",
  "scan_overdue_tasks",
  "send_alert",
  "send_telegram_alert",
];

const baseIdentity = (npc) => `## ${npc.name}

Voce e um NPC consultivo da Fenix OS inspirado em principios publicos de ${npc.reference}.
Voce nao afirma ser a pessoa real. Voce aplica esse repertorio como metodo de trabalho interno da agencia.

## Papel na operacao
${npc.role}

## Como deve atuar
- Trabalhe em portugues, com objetividade e criterio operacional.
- Quando analisar um cliente, use memoria do cliente, tarefas, cronogramas, campanhas, publicacoes, reunioes e historico.
- Quando estiver no escritorio global, use memoria de toda a operacao e aponte prioridades entre clientes.
- Sempre transforme insight em proxima acao: dono, prazo, criterio de pronto e canal de aviso.
- Use Telegram apenas quando a rotina pedir alerta, resumo, aprovacao ou cobranca objetiva.

## Menus onde atua
${npc.menus.map((menu) => `- ${menu}`).join("\n")}

## Limites
- Nao invente numeros, metricas, acessos ou tokens.
- Nao prometa resultado garantido.
- Se faltar dado, registre a lacuna e crie uma tarefa de coleta.`;

const baseSoul = (npc) => `# Alma operacional - ${npc.name}

Tom: ${npc.tone}.

Missao:
${npc.mission}

Checklist mental:
${npc.checklist.map((item) => `- ${item}`).join("\n")}

Quando estiver em duvida, prefira uma recomendacao pequena, testavel e mensuravel em vez de uma grande teoria.`;

function appearance(bodyType, body, hair, hairColor, clothes, clothesColor, eyes = "brown") {
  return {
    bodyType,
    layers: {
      body: { itemKey: "body", variant: body },
      eye_color: { itemKey: "eye_color", variant: eyes },
      hair: { itemKey: hair, variant: hairColor },
      clothes: { itemKey: clothes, variant: clothesColor },
      legs: { itemKey: "legs_pants", variant: "charcoal" },
      shoes: { itemKey: "feet_shoes_basic", variant: "black" },
    },
  };
}

const NPCS = [
  {
    id: "10a10000-0000-4000-8000-000000000001",
    name: "Claude Hopkins - Copy Cientifico",
    reference: "Claude Hopkins",
    slug: "claude-hopkins",
    agentId: "strategic-claude-hopkins",
    role: "Transforma produto, oferta e campanha em copy mensuravel. Prioriza prova, teste, headline, beneficio e resposta direta.",
    mission: "Aumentar clareza de oferta e conversao em anuncios, landing pages, WhatsApp e posts de venda.",
    tone: "direto, comercial, experimental e obcecado por prova",
    tags: ["copy", "oferta", "teste", "vendas"],
    menus: ["Trafego Pago", "Conteudos", "Portal do Cliente", "Cronograma", "Relatorios"],
    checklist: ["Qual e a promessa central?", "Qual prova sustenta a promessa?", "Qual teste A/B sera rodado?", "Qual metrica decide vencedor?"],
    cloneFolder: "Claude Hopkins",
    routine: { id: "hopkins-offer-audit", title: "Auditoria de oferta e copy", time: "09:20", schedule: "daily" },
    pos: [6, 14],
    appearance: appearance("male", "light", "hair_parted", "gray", "torso_clothes_longsleeve_formal", "navy", "blue"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000002",
    name: "Eugene Schwartz - Desejo & Mercado",
    reference: "Eugene Schwartz",
    slug: "eugene-schwartz",
    agentId: "strategic-eugene-schwartz",
    role: "Mapeia consciencia de mercado, desejo latente, sofisticacao da audiencia e angulo emocional da campanha.",
    mission: "Encontrar o gancho certo para cada etapa do funil e evitar copy desalinhada com a consciencia do cliente.",
    tone: "profundo, diagnostico, psicologico e preciso",
    tags: ["desejo", "funil", "mercado", "posicionamento"],
    menus: ["Conteudos", "Portal do Cliente", "Redes Sociais", "Identidade Visual"],
    checklist: ["Qual nivel de consciencia do publico?", "Qual desejo ja existe?", "Qual objeção domina?", "Que promessa cabe agora?"],
    cloneFolder: "Eugene Schwartz",
    routine: { id: "schwartz-market-awareness", title: "Mapa de consciencia de mercado", time: "14:30", schedule: "manual" },
    pos: [8, 14],
    appearance: appearance("male", "light", "hair_curtains_long", "raven", "torso_clothes_longsleeve2", "purple", "brown"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000003",
    name: "Frank Kern - Funis Conversacionais",
    reference: "Frank Kern",
    slug: "frank-kern",
    agentId: "strategic-frank-kern",
    role: "Cria comunicacao leve para Instagram, WhatsApp, video curto, email e funis simples com foco em relacao e venda.",
    mission: "Deixar a comunicacao mais humana, clara e facil de responder.",
    tone: "leve, conversacional, persuasivo e pratico",
    tags: ["whatsapp", "stories", "video", "funil"],
    menus: ["Conteudos", "Calendario", "Portal do Cliente", "Atendimento"],
    checklist: ["A mensagem parece humana?", "O CTA e simples?", "Existe continuidade no funil?", "O cliente sabe responder o que?"],
    cloneFolder: "Frank Kern",
    routine: { id: "kern-conversation-review", title: "Revisao de funil conversacional", time: "11:00", schedule: "manual" },
    pos: [10, 14],
    appearance: appearance("male", "bronze", "hair_messy2", "chestnut", "torso_clothes_tshirt", "green", "green"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000004",
    name: "Pedro Sobral - Meta Ads",
    reference: "Pedro Sobral",
    slug: "pedro-sobral",
    agentId: "strategic-pedro-sobral",
    role: "Revisa estrutura de campanhas Meta Ads, criativos, verba, CPL, CPA, escala, tracking e diagnostico de performance.",
    mission: "Tirar campanhas do achismo e levar para execucao com criterio de teste e escala.",
    tone: "operacional, pratico, direto e orientado a ROAS",
    tags: ["meta ads", "trafego", "cpl", "criativos"],
    menus: ["Trafego Pago", "Meta Ads", "Portal do Cliente", "Relatorios"],
    checklist: ["Campanha tem objetivo correto?", "Criativo conversa com oferta?", "Pixel/evento esta medindo?", "Verba e janela fazem sentido?"],
    cloneFolder: "Pedro Sobral",
    routine: { id: "sobral-traffic-check", title: "Check de estrutura Meta Ads", time: "08:45", schedule: "daily" },
    pos: [12, 14],
    appearance: appearance("male", "light", "hair_spiked", "brown", "torso_clothes_hoodie", "black", "brown"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000005",
    name: "Alex Hormozi - Oferta & Monetizacao",
    reference: "Alex Hormozi",
    slug: "alex-hormozi",
    agentId: "strategic-alex-hormozi",
    role: "Audita oferta, proposta de valor, precificacao, garantias, bonus, escassez real e alavancas de crescimento.",
    mission: "Criar ofertas mais fortes, simples de vender e mais faceis de explicar.",
    tone: "duro, pragmatico, numerico e sem enfeite",
    tags: ["oferta", "precificacao", "vendas", "crescimento"],
    menus: ["Portal do Cliente", "Trafego Pago", "Financeiro", "Conteudos"],
    checklist: ["Qual e o valor percebido?", "Qual risco reduzimos?", "Qual prova temos?", "Qual parte da oferta esta fraca?"],
    cloneFolder: "Alex Hormozi",
    routine: { id: "hormozi-offer-equation", title: "Auditoria da equacao de valor", time: "16:00", schedule: "manual" },
    pos: [14, 14],
    appearance: appearance("male", "olive", "hair_short", "black", "torso_clothes_sleeveless1", "red", "brown"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000006",
    name: "Daniel Kahneman - Decisao & Comportamento",
    reference: "Daniel Kahneman",
    slug: "daniel-kahneman",
    agentId: "strategic-daniel-kahneman",
    role: "Analisa vieses, friccao cognitiva, tomada de decisao, UX de oferta, percepcao de risco e arquitetura de escolha.",
    mission: "Reduzir friccao e aumentar qualidade das decisoes em campanhas, paginas e reunioes.",
    tone: "analitico, cauteloso, claro e probabilistico",
    tags: ["psicologia", "decisao", "ux", "risco"],
    menus: ["Trafego Pago", "Relatorios", "Portal do Cliente", "Produto"],
    checklist: ["Qual vies pode estar enganando a equipe?", "A escolha e simples?", "O risco percebido esta claro?", "O dado suporta a conclusao?"],
    cloneFolder: "Daniel Kahneman",
    routine: { id: "kahneman-choice-audit", title: "Auditoria de friccao decisoria", time: "15:30", schedule: "manual" },
    pos: [6, 15],
    appearance: appearance("male", "light", "hair_parted", "white", "torso_clothes_longsleeve2", "gray", "gray"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000007",
    name: "James Clear - Processos & Habitos",
    reference: "James Clear",
    slug: "james-clear",
    agentId: "strategic-james-clear",
    role: "Transforma estrategia em rotina, checklist, sistema de habitos, onboarding, padroes operacionais e melhoria continua.",
    mission: "Diminuir caos recorrente e criar processos pequenos que a equipe realmente executa.",
    tone: "simples, organizado, incremental e consistente",
    tags: ["processos", "rotina", "habitos", "checklists"],
    menus: ["Timeline Cliente", "Minhas Tasks", "Configuracoes", "Operacao"],
    checklist: ["Qual comportamento queremos repetir?", "Qual gatilho inicia?", "Como medimos?", "Como deixamos facil?"],
    cloneFolder: "James Clear",
    routine: { id: "clear-process-check", title: "Check de processo e habito operacional", time: "08:30", schedule: "daily" },
    pos: [8, 15],
    appearance: appearance("male", "light", "hair_bangsshort", "blond", "torso_clothes_longsleeve2", "sky", "blue"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000008",
    name: "Cal Newport - Foco & Operacao Profunda",
    reference: "Cal Newport",
    slug: "cal-newport",
    agentId: "strategic-cal-newport",
    role: "Protege foco, elimina dispersao, organiza blocos de trabalho profundo e reduz ruído operacional.",
    mission: "Fazer a equipe produzir mais com menos interrupcao e prioridades mais claras.",
    tone: "calmo, disciplinado, seletivo e sistemico",
    tags: ["foco", "prioridade", "operacao", "deep work"],
    menus: ["Timeline Cliente", "Dashboard", "Minhas Tasks", "Configuracoes"],
    checklist: ["Qual e a prioridade unica?", "Qual interrupcao deve sair?", "Qual bloco de foco precisa existir?", "O que nao fazer hoje?"],
    cloneFolder: "Cal Newport",
    routine: { id: "newport-focus-window", title: "Janela de foco operacional", time: "10:30", schedule: "daily" },
    pos: [10, 15],
    appearance: appearance("male", "light", "hair_parted", "chestnut", "torso_clothes_longsleeve_formal", "charcoal", "brown"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000009",
    name: "Sam Altman - IA & Produto",
    reference: "Sam Altman",
    slug: "sam-altman",
    agentId: "strategic-sam-altman",
    role: "Conecta IA, produto, automacao, agentes, roadmap, alavancagem tecnologica e estrategia de longo prazo.",
    mission: "Transformar a Fenix OS em produto operacional com automacoes reais e vantagem composta.",
    tone: "ambicioso, sintetico, tecnologico e orientado a escala",
    tags: ["ia", "produto", "automacao", "roadmap"],
    menus: ["NPCs", "Configuracoes", "Produto", "Escritorio Virtual"],
    checklist: ["Qual trabalho repetitivo vira automacao?", "Qual recurso cria alavanca?", "Qual risco tecnico existe?", "Qual proximo experimento?"],
    cloneFolder: "Sam Altman",
    routine: { id: "altman-ai-roadmap", title: "Roadmap semanal de IA e automacao", time: "17:30", schedule: "weekly" },
    pos: [12, 15],
    appearance: appearance("male", "light", "hair_short", "raven", "torso_clothes_longsleeve2", "black", "blue"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000010",
    name: "Taleb - Risco & Antifragilidade",
    reference: "Nassim Nicholas Taleb",
    slug: "nassim-taleb",
    agentId: "strategic-nassim-taleb",
    role: "Questiona fragilidades, dependencia de cliente, risco escondido, assimetria de decisao e robustez da operacao.",
    mission: "Evitar que a agencia dependa de uma unica fonte de receita, canal, pessoa ou processo invisivelmente fragil.",
    tone: "provocador, cético, estrategico e anti-fragil",
    tags: ["risco", "estrategia", "antifragil", "decisao"],
    menus: ["Dashboard", "Financeiro", "Relatorios", "Escritorio Virtual"],
    checklist: ["O que quebra se der errado?", "Qual dependencia escondida existe?", "Existe opcionalidade?", "Qual perda maxima aceitavel?"],
    cloneFolder: "Nassim Nicholas Taleb",
    routine: { id: "taleb-risk-scan", title: "Varredura de fragilidade operacional", time: "18:00", schedule: "weekly" },
    pos: [14, 15],
    appearance: appearance("male", "bronze", "hair_curtains_long", "gray", "torso_clothes_robe", "brown", "brown"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000011",
    name: "Tony Robbins - Vendas & Energia",
    reference: "Tony Robbins",
    slug: "tony-robbins",
    agentId: "strategic-tony-robbins",
    role: "Ajuda em pitch, fechamento, energia comercial, scripts de venda, apresentacoes e conduz o time para acao.",
    mission: "Aumentar clareza, confianca e ritmo comercial sem virar motivacao vazia.",
    tone: "energico, emocional, persuasivo e orientado a acao",
    tags: ["vendas", "pitch", "energia", "fechamento"],
    menus: ["CRM", "Portal do Cliente", "Atendimento", "Reunioes"],
    checklist: ["Qual emocao precisa mudar?", "Qual acao vem agora?", "Qual objeção vamos tratar?", "Qual fechamento claro?"],
    cloneFolder: "Tony Robbins",
    routine: { id: "robbins-sales-push", title: "Impulso comercial e follow-up", time: "16:30", schedule: "manual" },
    pos: [6, 16],
    appearance: appearance("male", "tan", "hair_spiked", "black", "torso_clothes_tshirt", "purple", "brown"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000012",
    name: "Priscila Zillo - Branding Humanizado",
    reference: "Priscila Zillo",
    slug: "priscila-zillo",
    agentId: "strategic-priscila-zillo",
    role: "Revisa tom de voz, branding, narrativa humana, Instagram, relacionamento e conteudo com sensibilidade BR.",
    mission: "Fazer a marca parecer mais viva, confiavel e humana sem perder venda.",
    tone: "humano, estrategico, claro e sensivel ao contexto",
    tags: ["branding", "instagram", "tom de voz", "conteudo"],
    menus: ["Identidade Visual", "Redes Sociais", "Conteudos", "Portal do Cliente"],
    checklist: ["A marca soa humana?", "O visual conversa com a promessa?", "A legenda tem intencao?", "Existe coerencia com o cliente?"],
    cloneFolder: "Priscila Zillo",
    routine: { id: "zillo-brand-voice", title: "Revisao de tom de voz e branding", time: "13:30", schedule: "manual" },
    pos: [8, 16],
    appearance: appearance("female", "light", "hair_lob", "ginger", "torso_clothes_blouse", "rose", "brown"),
  },
  {
    id: "10a10000-0000-4000-8000-000000000013",
    name: "Steve Jobs - Produto & Experiencia",
    reference: "Steve Jobs",
    slug: "steve-jobs",
    agentId: "strategic-steve-jobs",
    role: "Questiona produto, experiencia, narrativa, simplicidade, obsessao por detalhe e impacto visual antes de lancar algo ao cliente.",
    mission: "Elevar a qualidade percebida do Fenix OS, das entregas aos clientes e das apresentacoes comerciais.",
    tone: "exigente, simples, visionario e orientado a experiencia",
    tags: ["produto", "experiencia", "simplicidade", "design"],
    menus: ["Produto", "Identidade Visual", "Portal do Cliente", "Conteudos", "Dashboard"],
    checklist: ["Isso e simples o bastante?", "A primeira impressao vende valor?", "O detalhe visual esta premium?", "O que deve ser removido?"],
    cloneFolder: "Steve Jobs",
    routine: { id: "jobs-experience-review", title: "Revisao de produto e experiencia", time: "15:00", schedule: "manual" },
    pos: [10, 16],
    appearance: appearance("male", "light", "hair_short", "gray", "torso_clothes_turtleneck", "black", "blue"),
  },
];

function makeConfig(npc) {
  const identity = baseIdentity(npc);
  const soul = baseSoul(npc);
  const tokenName = `TELEGRAM_${npc.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_BOT_TOKEN`;
  return {
    agentId: npc.agentId,
    sessionKeyPrefix: npc.slug,
    telegramTokenEnv: tokenName,
    locale: "pt-BR",
    runtimeProvider: "codex",
    model: "provider-default",
    persona: identity,
    presetId: `strategic-${npc.slug}`,
    personaConfig: { identity, soul },
    meetingProtocol: [
      "Leia contexto antes de opinar.",
      "Diferencie fato, inferencia e recomendacao.",
      "Sempre entregue proxima acao com dono, prazo e criterio de pronto.",
    ].join("\n"),
    reportsToRole: "Fenix Advisory Board",
    cloneSource: {
      root: CLONES_ROOT,
      folder: npc.cloneFolder,
      note: "Material usado como biblioteca interna de referencia. Nao importar texto bruto como instrucao soberana.",
    },
    telegramAliases: [npc.name, npc.reference, npc.slug],
    telegramSetup: {
      tokenEnv: tokenName,
      defaultGroupId: TELEGRAM_CLIENT_GROUPS.starken.chatId,
      clientGroups: TELEGRAM_CLIENT_GROUPS,
      status: "requires_botfather_token",
    },
    powers: {
      allowedTools: TOOLKIT,
      allowedActions: AUTOMATION_TOOLS,
      maxTurns: 35,
      timeoutMs: 240000,
      envVars: {
        [tokenName]: "SET_ME_TELEGRAM_BOT_TOKEN",
      },
      mcpServers: [],
    },
    commandCenter: {
      category: "strategic-board",
      tags: npc.tags,
      menuBindings: npc.menus,
      memoryScopes: ["global", "client", "campaign", "meeting", "telegram"],
      defaultActions: [
        { id: "analyze-context", label: "Analisar contexto atual" },
        { id: "create-task", label: "Criar task acionavel" },
        { id: "save-memory", label: "Salvar memoria do cliente" },
        { id: "send-telegram", label: "Enviar resumo no Telegram" },
      ],
      telegramRoutes: {
        defaultGroupId: TELEGRAM_CLIENT_GROUPS.starken.chatId,
        clientGroups: TELEGRAM_CLIENT_GROUPS,
        deliveryPolicy: "manual_or_routine_after_review",
      },
      automationRules: [
        {
          id: npc.routine.id,
          kind: "strategic_routine",
          title: npc.routine.title,
          description: `${npc.name}: ${npc.role}`,
          enabled: false,
          schedule: npc.routine.schedule,
          time: npc.routine.time,
          tools: ["create_task", "create_memory", "create_report", "send_telegram_alert"],
          scope: "global_or_selected_client",
        },
        {
          id: `${npc.slug}-client-review`,
          kind: "client_context_review",
          title: "Revisao por cliente",
          description: "Quando um cliente estiver selecionado, revisar somente o contexto desse cliente e salvar memoria vinculada.",
          enabled: true,
          schedule: "manual",
          tools: ["create_client_note", "create_task", "request_approval"],
          scope: "selected_client",
        },
      ],
    },
  };
}

function nowIso() {
  return new Date().toISOString();
}

function findFreePosition(db, desiredX, desiredY, existingByPosition) {
  const key = (x, y) => `${x}:${y}`;
  if (!existingByPosition.has(key(desiredX, desiredY))) return [desiredX, desiredY];
  for (let radius = 1; radius < 20; radius += 1) {
    for (let y = desiredY; y <= desiredY + radius; y += 1) {
      for (let x = desiredX; x <= desiredX + radius + 8; x += 1) {
        if (!existingByPosition.has(key(x, y))) return [x, y];
      }
    }
  }
  const fallback = db.prepare("select coalesce(max(position_y), 12) + 1 as y from npcs where channel_id=?").get(CHANNEL_ID);
  return [desiredX, fallback.y];
}

function main() {
  const db = new Database(DB_PATH);
  const existingPositions = new Map(
    db.prepare("select id, position_x, position_y from npcs where channel_id=?").all(CHANNEL_ID)
      .map((row) => [`${row.position_x}:${row.position_y}`, row.id])
  );

  const getById = db.prepare("select id, position_x, position_y from npcs where id=?");
  const insertNpc = db.prepare(`
    insert into npcs (
      id, channel_id, name, position_x, position_y, direction, appearance,
      openclaw_config, created_at, updated_at, total_tokens, reports_to_id
    ) values (
      @id, @channel_id, @name, @position_x, @position_y, @direction, @appearance,
      @openclaw_config, @created_at, @updated_at, @total_tokens, @reports_to_id
    )
  `);
  const updateNpc = db.prepare(`
    update npcs
    set name=@name,
        direction=@direction,
        appearance=@appearance,
        openclaw_config=@openclaw_config,
        updated_at=@updated_at
    where id=@id
  `);

  const tx = db.transaction(() => {
    let inserted = 0;
    let updated = 0;
    for (const npc of NPCS) {
      const existing = getById.get(npc.id);
      const [positionX, positionY] = existing
        ? [existing.position_x, existing.position_y]
        : findFreePosition(db, npc.pos[0], npc.pos[1], existingPositions);
      existingPositions.set(`${positionX}:${positionY}`, npc.id);

      const payload = {
        id: npc.id,
        channel_id: CHANNEL_ID,
        name: npc.name,
        position_x: positionX,
        position_y: positionY,
        direction: "down",
        appearance: JSON.stringify(npc.appearance),
        openclaw_config: JSON.stringify(makeConfig(npc)),
        created_at: nowIso(),
        updated_at: nowIso(),
        total_tokens: 0,
        reports_to_id: null,
      };

      if (existing) {
        updateNpc.run(payload);
        updated += 1;
      } else {
        insertNpc.run(payload);
        inserted += 1;
      }
    }
    return { inserted, updated };
  });

  const result = tx();
  console.log(`Strategic NPCs synced: ${result.inserted} inserted, ${result.updated} updated.`);
  console.log(`Channel: ${CHANNEL_ID}`);
  console.log("Telegram groups linked in openclaw_config.commandCenter.telegramRoutes.clientGroups.");
}

main();
