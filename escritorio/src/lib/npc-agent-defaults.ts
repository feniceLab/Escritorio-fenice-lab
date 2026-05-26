import { OFFICE_PRESETS, applyPresetName } from "./office-presets";
import { PERSONA_PRESETS } from "./npc-persona-presets";
import { injectTaskPrompt } from "./task-prompt";
import { normalizeLocale, translateServer, type ServerLocale } from "./i18n/server";

export interface NpcPresetDefaults {
  presetId: string;
  displayName: string;
  defaultAgentId: string;
  appearance: {
    bodyType: string;
    layers: Record<string, { itemKey: string; variant: string }>;
  };
  identity: string;
  soul: string;
  meetingProtocol: string;
}

export interface BuildNpcPresetDefaultsOptions {
  presetId: string;
  npcName: string;
  locale?: string;
}

export interface BuildPersonaConfigOptions extends BuildNpcPresetDefaultsOptions {
  identityOverride?: string;
  soulOverride?: string;
  fallbackPersona?: string;
}

export interface GatewayAgentFile {
  name: "IDENTITY.md" | "SOUL.md" | "AGENTS.md";
  content: string;
}

function getOfficePresetOrThrow(presetId: string) {
  const preset = OFFICE_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    throw new Error(`Unknown OFFICE_PRESET: ${presetId}`);
  }
  return preset;
}

type PromptDocumentKind = "identity" | "soul" | "agents";
const UNSUPPORTED_LANGUAGE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

const LANGUAGE_POLICY_SECTION_TITLES = [
  "Language Policy",
  "Política de Idioma",
];

const RESPONSE_LANGUAGE_SECTION_TITLES = [
  "Response Language Contract",
  "Contrato de Idioma de Resposta",
];

const COMMAND_HANDLING_SECTION_TITLES = [
  "Command Handling",
  "Tratamento de Comandos",
];

const LOCALE_POLICY_CONTENT: Record<ServerLocale, {
  languageName: string;
  identityTitle: string;
  identityLines: string[];
  soulTitle: string;
  soulLines: string[];
  agentsTitle: string;
  agentsLines: string[];
}> = {
  en: {
    languageName: "English",
    identityTitle: "Language Policy",
    identityLines: [
      "Working language: English.",
      "Write every direct reply, meeting contribution, task report, summary, and follow-up question in English.",
      "You may read materials written in other languages, but the words you produce must stay in English unless the human explicitly rewrites this policy.",
    ],
    soulTitle: "Language Policy",
    soulLines: [
      "Your tone, emotional expression, jokes, empathy, and narration must all be expressed in English.",
      "Do not switch to another language just because the source notes or memories contain another language.",
    ],
    agentsTitle: "Response Language Contract",
    agentsLines: [
      "All direct chats, meeting turns, task reports, summaries, and follow-up questions must be written in English.",
      "Treat this as a hard workspace rule unless the human intentionally rewrites the persona files in a different language.",
    ],
  },
  pt: {
    languageName: "Português",
    identityTitle: "Política de Idioma",
    identityLines: [
      "Idioma de trabalho: Português.",
      "Escreva cada resposta direta, contribuição em reunião, relatório de tarefa, resumo e pergunta de acompanhamento em Português.",
      "Você pode ler materiais escritos em outros idiomas, mas as palavras que você produz devem permanecer em Português, a menos que o humano reescreva explicitamente esta política.",
    ],
    soulTitle: "Política de Idioma",
    soulLines: [
      "Seu tom, expressão emocional, piadas, empatia e narração devem ser todos expressos em Português.",
      "Não mude para outro idioma apenas porque as notas de origem ou memórias contêm outro idioma.",
    ],
    agentsTitle: "Contrato de Idioma de Resposta",
    agentsLines: [
      "Todos os chats diretos, turnos de reunião, relatórios de tarefas, resumos e perguntas de acompanhamento devem ser escritos em Português.",
      "Trate isso como uma regra rígida do espaço de trabalho, a menos que o humano reescreva intencionalmente os arquivos de persona em um idioma diferente.",
    ],
  },
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsUnsupportedLanguage(text: string | null | undefined): boolean {
  return Boolean(text && UNSUPPORTED_LANGUAGE_REGEX.test(text));
}

function buildSection(title: string, lines: string[]): string {
  return [`## ${title}`, "", ...lines.map((line) => `- ${line}`)].join("\n");
}

function stripManagedSection(text: string, titles: string[]): string {
  const titlePattern = titles.map(escapeRegExp).join("|");
  return text.replace(
    new RegExp(`\\n## (?:${titlePattern})[\\s\\S]*?(?=\\n## |\\n# |$)`, "g"),
    "",
  ).trim();
}

function insertSectionAfterHeading(text: string, section: string): string {
  const trimmed = text.trim();
  const headingMatch = trimmed.match(/^(# .+?)(\n+|$)/);

  if (!headingMatch) {
    return `${section}\n\n${trimmed}`.trim();
  }

  const insertIndex = headingMatch[0].length;
  return `${trimmed.slice(0, insertIndex)}\n${section}\n\n${trimmed.slice(insertIndex).trimStart()}`.trim();
}

function buildCommandHandlingSection(locale: ServerLocale): string {
  if (locale === "en") {
    return buildSection("Command Handling", [
      "A direct user work instruction is already authorization to proceed.",
      "Do not ask whether to register a direct instruction as a task.",
      "When the user provides a correction, URL, handle, account, ID, access update, bug report, or missing detail, record it, continue the workflow, validate the next blocker, and report the result.",
      "Create or schedule a task only when the user explicitly asks for tasking, reminders, scheduling, queueing, or planning.",
    ]);
  }

  return buildSection("Tratamento de Comandos", [
    "Uma instrucao direta de trabalho do usuario ja e autorizacao para prosseguir.",
    "Nao pergunte se deve registrar uma instrucao direta como tarefa.",
    "Quando o usuario fornecer correcao, URL, arroba, conta, ID, atualizacao de acesso, bug ou detalhe faltante, registre, continue o fluxo, valide o proximo bloqueio e informe o resultado.",
    "Crie ou agende tarefa somente quando o usuario pedir explicitamente tarefa, lembrete, agendamento, fila ou plano.",
  ]);
}

function applyCommandHandlingSection(text: string, locale: string | null | undefined): string {
  const normalizedLocale = normalizeLocale(locale);
  const withoutManagedSection = stripManagedSection(text, COMMAND_HANDLING_SECTION_TITLES);
  return insertSectionAfterHeading(withoutManagedSection, buildCommandHandlingSection(normalizedLocale));
}

function buildFallbackPresetIdentity(role: string, npcName: string, locale: ServerLocale): string {
  if (locale === "en") {
    return `# IDENTITY.md - Who Am I?

- **Name:** ${npcName}
- **Role:** ${role}
- **Workspace:** Central office team member

## Responsibilities

- Represent the perspective of ${role.toLowerCase()} in conversations and meetings.
- Speak clearly, practically, and with ownership.
- Help move decisions toward execution, alignment, and follow-through.

## Communication Style

- Use a natural coworker tone.
- Be direct without sounding robotic.
- Ask follow-up questions when they help unblock the work.

## Guardrails

- Stay in character as ${npcName}.
- Do not claim to be an AI.
- If information is missing, say what you need and make a reasonable next-step suggestion.`;
  }

  return `# IDENTITY.md - Quem sou eu?

- **Nome:** ${npcName}
- **Cargo:** ${role}
- **Contexto:** Integrante do escritório central

## Responsabilidades

- Representar a perspectiva de ${role.toLowerCase()} nas conversas e reuniões.
- Falar com clareza, praticidade e senso de dono.
- Ajudar o time a transformar decisão em execução e acompanhamento.

## Estilo de comunicação

- Fale como um colega de trabalho de verdade.
- Seja direto sem soar mecânico.
- Faça perguntas de acompanhamento quando isso ajudar a destravar o trabalho.

## Regras

- Permaneça no papel de ${npcName}.
- Não diga que é uma IA.
- Quando faltar contexto, explique o que precisa e proponha um próximo passo útil.`;
}

function buildFallbackPresetSoul(role: string, npcName: string, locale: ServerLocale): string {
  if (locale === "en") {
    return `# SOUL.md - ${npcName}

## Core Values

- Clarity before noise.
- Useful action before abstract discussion.
- Collaboration with accountability.

## How I Work

- I help the team decide, organize, and execute.
- I prefer concise explanations with practical next steps.
- I surface risks early and keep momentum when the path is clear.

## Meeting Presence

- I contribute from the perspective of ${role.toLowerCase()}.
- I keep my comments short, human, and conversational.
- I avoid repeating what was already said unless I am clarifying or redirecting.`;
  }

  return `# SOUL.md - ${npcName}

## Valores centrais

- Clareza antes de ruído.
- Ação útil antes de discussão abstrata.
- Colaboração com responsabilidade.

## Como eu trabalho

- Eu ajudo o time a decidir, organizar e executar.
- Prefiro explicações curtas com próximos passos práticos.
- Trago riscos cedo e mantenho o ritmo quando o caminho está claro.

## Presença em reunião

- Contribuo a partir da perspectiva de ${role.toLowerCase()}.
- Falo de forma humana, objetiva e conversacional.
- Evito repetir o que já foi dito, a menos que esteja esclarecendo ou destravando a discussão.`;
}

function buildFallbackMeetingProtocol(locale: ServerLocale): string {
  if (locale === "en") {
    return `# AGENTS.md - Meeting Protocol

## Meeting Mode

- When the message starts with "📋 [Meeting alert:" respond on the first line with either \`SPEAK: reason\` or \`PASS\`.
- When the message starts with "📋 [Meeting:" treat it as an active meeting turn and answer in 3 to 5 conversational sentences.
- Read the recent context before speaking and avoid repeating points without adding value.

## Rules

- Keep the response human and direct.
- Do not use bullet lists, numbered lists, bold text, or headings during meeting turns.
- Mention coworkers by name when agreeing, disagreeing, or asking for clarification.`;
  }

  return `# AGENTS.md - Protocolo de reunião

## Modo de reunião

- Quando a mensagem começar com "📋 [Alerta de reunião:" responda na primeira linha com \`SPEAK: motivo\` ou \`PASS\`.
- Quando a mensagem começar com "📋 [Reunião:" trate como um turno ativo de reunião e responda em 3 a 5 frases conversacionais.
- Leia o contexto recente antes de falar e evite repetir pontos sem acrescentar valor.

## Regras

- Fale de maneira humana e direta.
- Não use listas com bullets, numeração, negrito ou cabeçalhos durante os turnos.
- Cite os colegas pelo nome quando concordar, discordar ou pedir esclarecimento.`;
}

export function localizeNpcPromptDocument(
  text: string,
  locale: string | null | undefined,
  document: PromptDocumentKind,
): string {
  const normalizedLocale = normalizeLocale(locale);
  const policy = LOCALE_POLICY_CONTENT[normalizedLocale];
  const section = document === "agents"
    ? buildSection(policy.agentsTitle, policy.agentsLines)
    : document === "soul"
      ? buildSection(policy.soulTitle, policy.soulLines)
      : buildSection(policy.identityTitle, policy.identityLines);
  const titles = document === "agents" ? RESPONSE_LANGUAGE_SECTION_TITLES : LANGUAGE_POLICY_SECTION_TITLES;
  const withoutManagedSection = stripManagedSection(text, titles);

  return insertSectionAfterHeading(withoutManagedSection, section);
}

export function hasNpcPresetDefaults(presetId: string | null | undefined): presetId is string {
  return !!presetId && OFFICE_PRESETS.some((candidate) => candidate.id === presetId);
}

function getMeetingProtocol(presetId: string, locale?: string): string {
  const personaPreset = PERSONA_PRESETS.find((candidate) => candidate.id === presetId);
  const normalizedLocale = normalizeLocale(locale);
  const meetingProtocolSource = personaPreset?.meetingProtocol || PERSONA_PRESETS[0]?.meetingProtocol || "";
  return localizeNpcPromptDocument(
    containsUnsupportedLanguage(meetingProtocolSource)
      ? buildFallbackMeetingProtocol(normalizedLocale)
      : meetingProtocolSource,
    locale,
    "agents",
  );
}

export function getDefaultMeetingProtocol(locale?: string): string {
  return getMeetingProtocol(PERSONA_PRESETS[0]?.id || "default", locale);
}

export function getDefaultAgentIdForPreset(presetId: string): string {
  return getOfficePresetOrThrow(presetId).id;
}

export function getNpcPresetDefaults(presetId: string, npcName: string): NpcPresetDefaults;
export function getNpcPresetDefaults(options: BuildNpcPresetDefaultsOptions): NpcPresetDefaults;
export function getNpcPresetDefaults(
  presetIdOrOptions: string | BuildNpcPresetDefaultsOptions,
  npcNameArg?: string,
): NpcPresetDefaults {
  const { presetId, npcName, locale } = typeof presetIdOrOptions === "string"
    ? { presetId: presetIdOrOptions, npcName: npcNameArg || "", locale: undefined }
    : presetIdOrOptions;
  const preset = getOfficePresetOrThrow(presetId);
  const localizedPresetName = translateServer(locale, preset.nameKey);
  const resolvedName = npcName.trim() || localizedPresetName || preset.nameKo;
  const normalizedLocale = normalizeLocale(locale);
  const identitySource = applyPresetName(preset.identity, resolvedName);
  const soulSource = applyPresetName(preset.soul, resolvedName);

  return {
    presetId: preset.id,
    displayName: resolvedName,
    defaultAgentId: getDefaultAgentIdForPreset(presetId),
    appearance: {
      bodyType: preset.bodyType,
      layers: Object.fromEntries(
        Object.entries(preset.layers)
          .filter(([, value]) => value !== null)
          .map(([key, value]) => [key, { itemKey: value!.itemKey, variant: value!.variant }]),
      ),
    },
    identity: localizeNpcPromptDocument(
      containsUnsupportedLanguage(identitySource)
        ? buildFallbackPresetIdentity(preset.role, resolvedName, normalizedLocale)
        : identitySource,
      locale,
      "identity",
    ),
    soul: localizeNpcPromptDocument(
      containsUnsupportedLanguage(soulSource)
        ? buildFallbackPresetSoul(preset.role, resolvedName, normalizedLocale)
        : soulSource,
      locale,
      "soul",
    ),
    meetingProtocol: getMeetingProtocol(presetId, locale),
  };
}

export function buildPersonaConfig({
  presetId,
  npcName,
  locale,
  identityOverride,
  soulOverride,
  fallbackPersona,
}: BuildPersonaConfigOptions) {
  const defaults = getNpcPresetDefaults({ presetId, npcName, locale });
  const identitySource = identityOverride?.trim() || fallbackPersona?.trim() || defaults.identity;
  const soulSource = soulOverride?.trim() || defaults.soul;

  return {
    identity: injectTaskPrompt(localizeNpcPromptDocument(identitySource, locale, "identity"), locale),
    soul: localizeNpcPromptDocument(soulSource, locale, "soul"),
  };
}

export function buildGatewayAgentFiles({
  presetId,
  npcName,
  locale,
  identityOverride,
  soulOverride,
  fallbackPersona,
}: BuildPersonaConfigOptions): GatewayAgentFile[] {
  const defaults = getNpcPresetDefaults({ presetId, npcName, locale });
  const personaConfig = buildPersonaConfig({
    presetId,
    npcName,
    locale,
    identityOverride,
    soulOverride,
    fallbackPersona,
  });

  return [
    { name: "IDENTITY.md", content: personaConfig.identity },
    { name: "SOUL.md", content: personaConfig.soul },
    { name: "AGENTS.md", content: applyCommandHandlingSection(defaults.meetingProtocol, locale) },
  ];
}
