"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, CheckCircle2, Clock3, Calendar, Camera, Share2 } from "lucide-react";

export default function ClientPortalPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#090b10] flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-violet-600 rounded-lg mb-4" />
          <p className="text-sm text-slate-400">Carregando portal exclusivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0d1118] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center font-bold text-lg">B</div>
          <div>
            <h1 className="text-lg font-bold">Bella Massa</h1>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">Portal do Cliente</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-semibold">Fenix Lab</span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ativo
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="Alcance Instagram" value="12.540" trend="+15%" icon={<Camera className="h-5 w-5 text-pink-500" />} />
          <MetricCard title="Engajamento" value="4.8%" trend="+2.1%" icon={<Camera className="h-5 w-5 text-pink-500" />} />
          <MetricCard title="Alcance Facebook" value="5.210" trend="+2%" icon={<Share2 className="h-5 w-5 text-blue-500" />} />
          <MetricCard title="Cliques no Perfil" value="842" trend="+8%" icon={<LayoutDashboard className="h-5 w-5 text-violet-500" />} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
          {/* Left Column: Approvals & Calendar */}
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Aprovações Pendentes
              </h2>
              <div className="space-y-3">
                <ApprovalCard title="Post: Noite da Pizza (Promocional)" date="15 de Maio" type="Feed / Carrossel" />
                <ApprovalCard title="Reel: Processo da Massa Artesanal" date="18 de Maio" type="Reels" />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Calendário de Publicações
              </h2>
              <div className="bg-[#0d1118] border border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-7 gap-2">
                   {["S", "T", "Q", "Q", "S", "S", "D"].map(d => (
                     <div key={d} className="text-center text-[10px] text-slate-600 font-bold py-2">{d}</div>
                   ))}
                   {Array.from({ length: 31 }).map((_, i) => (
                     <div key={i} className="aspect-square border border-slate-800/50 rounded-lg bg-slate-900/50 flex items-center justify-center text-xs relative group cursor-pointer hover:border-violet-500 transition">
                       {i + 1}
                       {(i === 12 || i === 15 || i === 18) && <div className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-violet-500" />}
                     </div>
                   ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Timeline */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Clock3 className="h-4 w-4" /> Sua Evolução
            </h2>
            <div className="bg-[#0d1118] border border-slate-800 rounded-xl p-6 relative">
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-800" />
              <div className="space-y-8 relative">
                <TimelineItem title="Início da Gestão" date="Jan 2026" text="Definição de objetivos e setup inicial." status="done" />
                <TimelineItem title="Nova Identidade" date="Fev 2026" text="Lançamento das artes com novo design system." status="done" />
                <TimelineItem title="Expansão Delivery" date="Mar 2026" text="Foco em tráfego pago para iFood e WhatsApp." status="active" />
                <TimelineItem title="Fidelização" date="Abr 2026" text="Estratégia de CRM e cupom para recorrentes." status="pending" />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-600 text-xs border-t border-slate-900 mt-12">
        &copy; 2026 Fenix Lab. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: any) {
  return (
    <div className="bg-[#0d1118] border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-emerald-500 font-medium">{trend}</span>
      </div>
    </div>
  );
}

function ApprovalCard({ title, date, type }: any) {
  return (
    <div className="bg-[#0d1118] border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-slate-600 transition">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{type} • {date}</p>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-500 rounded-lg transition">Ver & Aprovar</button>
      </div>
    </div>
  );
}

function TimelineItem({ title, date, text, status }: any) {
  return (
    <div className="pl-10 relative">
      <div className={`absolute left-[-21px] top-1 h-3 w-3 rounded-full border-2 border-[#0d1118] ${
        status === "done" ? "bg-emerald-500" : status === "active" ? "bg-violet-500 animate-pulse" : "bg-slate-700"
      }`} />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{date}</span>
      <h3 className="text-sm font-bold mt-1">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}
