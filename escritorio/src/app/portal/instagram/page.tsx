"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Link2,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";

type OfficeClient = {
  id: string;
  channelId?: string | null;
  name: string;
  status?: string | null;
  summary?: string | null;
  clientLogo?: string | null;
  openTasks?: number;
  overdueTasks?: number;
  agents?: number;
  unreadNotifications?: number;
  profile?: Record<string, unknown>;
};

type TimelineEvent = {
  title: string;
  date: string;
  text: string;
  status: "done" | "active" | "pending";
};

const FALLBACK_CLIENTS: OfficeClient[] = [
  {
    id: "demo-bella-massa",
    name: "Bella Massa",
    status: "demo",
    summary: "Perfil de demonstracao para montar e aprovar a presenca do Instagram.",
    openTasks: 4,
    overdueTasks: 0,
    agents: 3,
  },
];

const galleryItems = [
  { title: "Logo principal", type: "Identidade", tone: "from-pink-500 to-orange-400" },
  { title: "Capa Destaque Menu", type: "Destaques", tone: "from-fuchsia-500 to-violet-500" },
  { title: "Carrossel boas-vindas", type: "Feed", tone: "from-amber-400 to-rose-500" },
  { title: "Reels bastidores", type: "Reels", tone: "from-sky-400 to-cyan-300" },
  { title: "Prova social", type: "Feed", tone: "from-emerald-400 to-teal-500" },
  { title: "Oferta semanal", type: "Campanha", tone: "from-indigo-500 to-blue-400" },
];

const postGrid = [
  "bg-[linear-gradient(135deg,#f97316,#ec4899)]",
  "bg-[linear-gradient(135deg,#111827,#6366f1)]",
  "bg-[linear-gradient(135deg,#facc15,#ef4444)]",
  "bg-[linear-gradient(135deg,#06b6d4,#10b981)]",
  "bg-[linear-gradient(135deg,#f8fafc,#94a3b8)]",
  "bg-[linear-gradient(135deg,#7c3aed,#db2777)]",
  "bg-[linear-gradient(135deg,#0f172a,#334155)]",
  "bg-[linear-gradient(135deg,#fb7185,#fdba74)]",
  "bg-[linear-gradient(135deg,#22c55e,#84cc16)]",
];

function buildTimeline(clientName: string): TimelineEvent[] {
  return [
    {
      title: "Cliente selecionado",
      date: "Hoje",
      text: `${clientName} pronto para receber conexao Meta, identidade visual e primeiros rascunhos.`,
      status: "active",
    },
    {
      title: "Galeria visual",
      date: "Proximo passo",
      text: "Adicionar logo, capas de destaque, imagens de feed, carrosseis e referencias aprovaveis.",
      status: "pending",
    },
    {
      title: "Conexao Meta",
      date: "Planejado",
      text: "Vincular Pagina do Facebook, Instagram profissional, permissoes e primeira sincronizacao.",
      status: "pending",
    },
    {
      title: "Relatorio 360",
      date: "Semanal/Mensal",
      text: "Salvar snapshots, evolucao de seguidores, alcance, publicacoes e prints da grade.",
      status: "pending",
    },
  ];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IG";
}

export default function InstagramPortalPage() {
  const [clients, setClients] = useState<OfficeClient[]>(FALLBACK_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState(FALLBACK_CLIENTS[0].id);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const response = await fetch("/api/office/clients", { cache: "no-store" });
        if (!response.ok) throw new Error("failed_to_load_clients");
        const data = (await response.json()) as { clients?: OfficeClient[] };
        const nextClients = Array.isArray(data.clients) && data.clients.length > 0 ? data.clients : FALLBACK_CLIENTS;
        if (!cancelled) {
          setClients(nextClients);
          setSelectedClientId((current) => nextClients.some((client) => client.id === current) ? current : nextClients[0].id);
        }
      } catch {
        if (!cancelled) setClients(FALLBACK_CLIENTS);
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    }

    loadClients();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? FALLBACK_CLIENTS[0];
  const timeline = useMemo(() => buildTimeline(selectedClient.name), [selectedClient.name]);
  const handle = selectedClient.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "cliente";

  return (
    <div className="h-screen overflow-y-auto bg-[#090b10] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0d1118]/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Instagram 360</h1>
              <p className="text-xs text-slate-400">Espelho, galeria, aprovacoes, metricas e linha do tempo do cliente.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedClient.id}
              onChange={(event) => setSelectedClientId(event.target.value)}
              className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-pink-500"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 transition hover:border-pink-500 hover:text-white">
              <RefreshCw className="h-4 w-4" />
              {loadingClients ? "Carregando" : "Sincronizar"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 p-5 xl:grid-cols-[320px_1fr_360px]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-800 bg-[#0d1118] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Conexao Meta</h2>
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-200">Pendente</span>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <StatusLine icon={<ShieldCheck className="h-4 w-4" />} label="Token seguro" value="Nao conectado" />
              <StatusLine icon={<Link2 className="h-4 w-4" />} label="Pagina vinculada" value="Aguardando" />
              <StatusLine icon={<Activity className="h-4 w-4" />} label="Ultima sync" value="Modo prototipo" />
            </div>
            <button className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-pink-600 px-3 text-sm font-semibold text-white transition hover:bg-pink-500">
              <Link2 className="h-4 w-4" />
              Preparar conexao
            </button>
          </section>

          <section className="rounded-lg border border-slate-800 bg-[#0d1118] p-4">
            <h2 className="mb-4 text-sm font-semibold text-white">Metricas do Cliente</h2>
            <div className="grid grid-cols-2 gap-3">
              <Metric title="Seguidores" value="12,4k" trend="+4,2%" />
              <Metric title="Alcance" value="48k" trend="+11%" />
              <Metric title="Engaj." value="5,8%" trend="+1,6%" />
              <Metric title="Posts" value="28" trend="mes" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Estes cards ja estao preparados para receber dados reais da Meta quando o token for conectado.
            </p>
          </section>

          <section className="rounded-lg border border-slate-800 bg-[#0d1118] p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Fila de Aprovacao</h2>
            <div className="space-y-3">
              <Approval title="Carrossel de apresentacao" type="Feed" />
              <Approval title="Capa dos destaques" type="Destaques" />
              <Approval title="Reels institucional" type="Reels" />
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <div className="rounded-lg border border-slate-800 bg-[#0d1118] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Espelho do Instagram</h2>
                <p className="mt-1 text-sm text-slate-500">Preview editavel para apresentacao, aprovacao e futura sincronizacao.</p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">@{handle}</span>
            </div>

            <div className="rounded-[28px] border border-slate-700 bg-slate-950 p-3 shadow-2xl shadow-black/30">
              <div className="rounded-[22px] bg-black p-4">
                <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-sm font-semibold text-white">{handle}</span>
                  <Camera className="h-5 w-5 text-slate-400" />
                </div>

                <div className="flex gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 p-[3px]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-lg font-bold text-white">
                      {selectedClient.clientLogo ? (
                        <img src={selectedClient.clientLogo} alt={selectedClient.name} className="h-full w-full rounded-full object-cover" />
                      ) : initials(selectedClient.name)}
                    </div>
                  </div>
                  <div className="grid flex-1 grid-cols-3 gap-2 text-center">
                    <ProfileCount label="posts" value="28" />
                    <ProfileCount label="seguidores" value="12,4k" />
                    <ProfileCount label="seguindo" value="384" />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white">{selectedClient.name}</h3>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-300">
                    Perfil em construcao pela Fenix Lab. Identidade visual, conteudo, calendario e metricas reunidos para aprovacao 360.
                  </p>
                </div>

                <div className="mt-4 flex gap-3 overflow-hidden">
                  {["Logo", "Menu", "Bastidores", "Reviews", "Ofertas"].map((item) => (
                    <div key={item} className="w-16 shrink-0 text-center">
                      <div className="mx-auto h-14 w-14 rounded-full border border-slate-700 bg-slate-900 p-1">
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-slate-600 to-slate-900" />
                      </div>
                      <p className="mt-1 truncate text-[10px] text-slate-400">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-1">
                  {postGrid.map((className, index) => (
                    <div key={index} className={`aspect-square ${className} relative overflow-hidden`}>
                      <div className="absolute inset-x-0 bottom-0 bg-black/25 px-2 py-1 text-[10px] text-white">
                        {index % 3 === 0 ? "Reels" : index % 2 === 0 ? "Carrossel" : "Post"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0d1118] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Galeria Visual</h2>
                <p className="mt-1 text-sm text-slate-500">Banco manual para montar o perfil antes ou depois da conexao Meta.</p>
              </div>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 hover:border-pink-500">
                <Upload className="h-4 w-4" />
                Adicionar
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {galleryItems.map((item) => (
                <div key={item.title} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <div className={`mb-3 aspect-[4/3] rounded-md bg-gradient-to-br ${item.tone}`} />
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.type}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-800 bg-[#0d1118] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-pink-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Timeline 360</h2>
            </div>
            <div className="relative space-y-6 pl-5">
              <div className="absolute bottom-2 left-[5px] top-2 w-px bg-slate-800" />
              {timeline.map((item) => (
                <TimelineItem key={`${item.title}-${item.date}`} item={item} />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-[#0d1118] p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Proximos Dados</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <DataPlan icon={<CalendarClock className="h-4 w-4" />} text="Snapshots semanais da grade e metricas." />
              <DataPlan icon={<ImagePlus className="h-4 w-4" />} text="Assets vinculados a biblioteca do cliente." />
              <DataPlan icon={<CheckCircle2 className="h-4 w-4" />} text="Aprovacao antes de publicar qualquer conteudo real." />
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function StatusLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
      <span className="flex items-center gap-2 text-slate-400">{icon}{label}</span>
      <span className="text-xs text-slate-300">{value}</span>
    </div>
  );
}

function Metric({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-lg font-semibold text-white">{value}</span>
        <span className="text-xs text-emerald-400">{trend}</span>
      </div>
    </div>
  );
}

function Approval({ title, type }: { title: string; type: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{type} - aguardando revisao</p>
    </div>
  );
}

function ProfileCount({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function TimelineItem({ item }: { item: TimelineEvent }) {
  return (
    <div className="relative">
      <div className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-[#0d1118] ${
        item.status === "done" ? "bg-emerald-500" : item.status === "active" ? "bg-pink-500" : "bg-slate-700"
      }`} />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.date}</p>
      <h3 className="mt-1 text-sm font-semibold text-white">{item.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.text}</p>
    </div>
  );
}

function DataPlan({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-slate-800 bg-slate-950 p-3">
      <span className="mt-0.5 text-pink-300">{icon}</span>
      <span className="text-sm leading-relaxed text-slate-300">{text}</span>
    </div>
  );
}
