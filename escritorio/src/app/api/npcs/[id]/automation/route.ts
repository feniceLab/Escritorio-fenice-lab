import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, npcs, jsonForDb } from "@/db";
import { parseDbObject } from "@/lib/db-json";
import { verifyNpcOwnership } from "@/lib/npc-route-access";

type AutomationRule = {
  id: string;
  kind: string;
  title: string;
  description: string;
  enabled: boolean;
  schedule: "manual" | "daily" | "event";
  time?: string;
  trigger?: string;
};

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: "morning-briefing",
    kind: "briefing",
    title: "Briefing matinal",
    description: "Entrega um resumo de contexto, agenda e prioridades para começar o dia.",
    enabled: false,
    schedule: "daily",
    time: "09:00",
  },
  {
    id: "night-recap",
    kind: "recap",
    title: "Recapitulação da noite",
    description: "Resume o que aconteceu no dia e registra próximos passos importantes.",
    enabled: false,
    schedule: "daily",
    time: "18:30",
  },
  {
    id: "heartbeat",
    kind: "heartbeat",
    title: "Sistema de batimento",
    description: "Cutuca o usuário quando houver mudança relevante em tarefa, memória ou biblioteca.",
    enabled: false,
    schedule: "event",
    trigger: "task-change",
  },
  {
    id: "smart-recommendations",
    kind: "recommendations",
    title: "Recomendações inteligentes",
    description: "Sugere próximos passos com base em histórico, biblioteca e pendências.",
    enabled: false,
    schedule: "manual",
  },
  {
    id: "memory-consolidation",
    kind: "memory",
    title: "Consolidação de memória",
    description: "Marca sessões para resumir fatos importantes e fortalecer memória de longo prazo.",
    enabled: false,
    schedule: "daily",
    time: "20:00",
  },
];

function normalizeRules(value: unknown): AutomationRule[] {
  if (!Array.isArray(value)) return DEFAULT_RULES;
  return value
    .map((rule) => {
      if (!rule || typeof rule !== "object") return null;
      const candidate = rule as Record<string, unknown>;
      return {
        id: typeof candidate.id === "string" ? candidate.id : crypto.randomUUID(),
        kind: typeof candidate.kind === "string" ? candidate.kind : "custom",
        title: typeof candidate.title === "string" ? candidate.title : "Automação",
        description: typeof candidate.description === "string" ? candidate.description : "",
        enabled: Boolean(candidate.enabled),
        schedule: candidate.schedule === "daily" || candidate.schedule === "event" ? candidate.schedule : "manual",
        ...(typeof candidate.time === "string" ? { time: candidate.time } : {}),
        ...(typeof candidate.trigger === "string" ? { trigger: candidate.trigger } : {}),
      } satisfies AutomationRule;
    })
    .filter((rule): rule is AutomationRule => Boolean(rule));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  const config = parseDbObject(access.npc.openclawConfig) || {};
  const commandCenter = config.commandCenter && typeof config.commandCenter === "object"
    ? config.commandCenter as Record<string, unknown>
    : {};

  return NextResponse.json({
    rules: normalizeRules(commandCenter.automationRules),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const rules = normalizeRules(body.rules);
    const currentConfig = parseDbObject(access.npc.openclawConfig) || {};
    const currentCommandCenter = currentConfig.commandCenter && typeof currentConfig.commandCenter === "object"
      ? currentConfig.commandCenter as Record<string, unknown>
      : {};

    const nextConfig = {
      ...currentConfig,
      commandCenter: {
        ...currentCommandCenter,
        automationRules: rules,
      },
    };

    const [updated] = await db.update(npcs)
      .set({ openclawConfig: jsonForDb(nextConfig) })
      .where(eq(npcs.id, id))
      .returning({ openclawConfig: npcs.openclawConfig });

    return NextResponse.json({
      rules,
      openclawConfig: updated?.openclawConfig ?? null,
    });
  } catch (error) {
    console.error("Failed to update NPC automation config:", error);
    return NextResponse.json({ errorCode: "failed_to_update_npc_automation", error: "Failed to update NPC automation config" }, { status: 500 });
  }
}
