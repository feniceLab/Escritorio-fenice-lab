// src/app/admin/clients/[clientId]/settings/page.tsx
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officeClients, officeTelegramBots } from "@/db/schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import MetaConfigForm from "@/components/admin/MetaConfigForm";

export default async function ClientSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { clientId } = await params;
  const { tab = "meta" } = await searchParams;

  const [client] = await db
    .select()
    .from(officeClients)
    .where(eq(officeClients.id, clientId))
    .limit(1);

  if (!client) notFound();

  const telegramBots = await db
    .select()
    .from(officeTelegramBots)
    .where(eq(officeTelegramBots.isActive, true));

  const tabs = [
    { key: "meta", label: "Meta API" },
    { key: "telegram", label: "Telegram" },
    { key: "geral", label: "Geral" },
  ];

  return (
    <div className="theme-web min-h-screen bg-bg px-8 py-8 text-text">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center gap-4">
          <Link
            href={`/content/${clientId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-raised"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-text-muted" />
              <h1 className="text-2xl font-bold">Configurações — {client.name}</h1>
            </div>
            <p className="text-sm text-text-muted">Gerencie as integrações do cliente</p>
          </div>
        </header>

        <div className="mb-6 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/clients/${clientId}/settings?tab=${t.key}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-text"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          {tab === "meta" && (
            <MetaConfigForm clientId={clientId} userId="system" />
          )}

          {tab === "telegram" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Bots Telegram disponíveis</h3>
              {telegramBots.length === 0 ? (
                <p className="text-sm text-text-muted">Nenhum bot ativo encontrado.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {telegramBots.map((bot) => (
                    <li key={bot.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{bot.displayName}</p>
                        <p className="text-xs text-text-muted">{bot.slug}</p>
                        {bot.purpose && (
                          <p className="text-xs text-text-muted">{bot.purpose}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${
                          bot.clientId === clientId
                            ? "bg-primary/20 text-primary"
                            : "bg-surface-raised text-text-muted"
                        }`}
                      >
                        {bot.clientId === clientId ? "Associado" : "Disponível"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "geral" && (
            <GeneralTab client={client} />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ client }: { client: typeof officeClients.$inferSelect }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Informações gerais</h3>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Nome</label>
          <p className="text-sm">{client.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
          <span className="inline-block rounded-full bg-surface-raised px-2 py-0.5 text-xs">
            {client.status}
          </span>
        </div>
        {client.summary && (
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Resumo</label>
            <p className="text-sm">{client.summary}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Criado em</label>
          <p className="text-sm text-text-muted">
            {new Date(client.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-4">
        Para editar os dados básicos, use a API PATCH /api/admin/clients/{"{clientId}"}.
      </p>
    </div>
  );
}
