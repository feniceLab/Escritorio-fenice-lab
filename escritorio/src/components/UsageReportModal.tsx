"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { 
  X, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search
} from "lucide-react";

interface UsageNpc {
  id: string;
  name: string;
  appearance: any;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  lastInteraction: string | null;
}

interface UsageLog {
  id: string;
  npcId: string;
  npcName: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: string;
  contextKind: string;
  createdAt: string;
}

interface UsageReport {
  npcs: UsageNpc[];
  recentLogs: UsageLog[];
  summary: {
    totalChannelCost: number;
    totalChannelTokens: number;
  };
}

interface UsageReportModalProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UsageReportModal({ channelId, isOpen, onClose }: UsageReportModalProps) {
  const t = useT();
  const [data, setData] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedNpcId);
    }
  }, [isOpen, channelId, selectedNpcId]);

  const fetchReport = async (npcId?: string | null) => {
    setLoading(true);
    try {
      const url = npcId 
        ? `/api/channels/${channelId}/usage-report?npcId=${npcId}` 
        : `/api/channels/${channelId}/usage-report`;
      
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch usage report:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedNpc = selectedNpcId ? data?.npcs.find(n => n.id === selectedNpcId) : null;

  if (!isOpen) return null;

  const filteredNpcs = data?.npcs.filter(npc => 
    npc.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#0b0e14] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Breadcrumbs */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span className={selectedNpcId ? "cursor-pointer hover:text-white transition-colors" : ""} onClick={() => setSelectedNpcId(null)}>
                  Analytics
                </span>
                {selectedNpcId && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-indigo-400">{selectedNpc?.name || "Detalhes do Agente"}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {selectedNpcId ? `${t("usage.title")}: ${selectedNpc?.name}` : t("usage.title")}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {selectedNpcId && (
               <button 
                 onClick={() => setSelectedNpcId(null)}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold transition-all border border-white/5"
               >
                 <ChevronLeft className="w-4 h-4" /> {t("usage.backToDashboard")}
               </button>
             )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Only show when no NPC is selected */}
        {!selectedNpcId && (
          <div className="flex gap-1 px-6 pt-4">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "overview" 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t("usage.overview")}
            </button>
            <button 
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "logs" 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t("usage.recentActivity")}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {loading && !data ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <Activity className="w-10 h-10 animate-pulse text-indigo-500/50" />
            </div>
          ) : data ? (
            selectedNpcId ? (
              /* NPC DETAIL VIEW */
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    title={t("usage.cost")} 
                    value={`$${(selectedNpc?.totalCost || 0).toFixed(4)}`} 
                    subtitle="Acumulado deste agente"
                    icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                    color="emerald"
                  />
                  <StatCard 
                    title={t("usage.totalTokens")} 
                    value={(selectedNpc?.totalTokens || 0).toLocaleString()} 
                    subtitle={`P: ${selectedNpc?.promptTokens.toLocaleString()} | C: ${selectedNpc?.completionTokens.toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5 text-indigo-400" />}
                    color="indigo"
                  />
                  <StatCard 
                    title={t("usage.lastActivity")} 
                    value={selectedNpc?.lastInteraction ? new Date(selectedNpc.lastInteraction).toLocaleTimeString() : "--"} 
                    subtitle={selectedNpc?.lastInteraction ? new Date(selectedNpc.lastInteraction).toLocaleDateString() : "Sem registro"}
                    icon={<Clock className="w-5 h-5 text-amber-400" />}
                    color="amber"
                  />
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01]">
                    <h3 className="font-bold text-white flex items-center gap-2">
                       <Activity className="w-4 h-4 text-indigo-400" /> {t("usage.interactions")}
                    </h3>
                  </div>
                  <LogsTable logs={data.recentLogs} t={t} />
                </div>
              </div>
            ) : (
              /* GLOBAL VIEW */
              activeTab === "overview" ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                      title={t("usage.totalCost")} 
                      value={`$${(data.summary.totalChannelCost || 0).toFixed(4)}`} 
                      subtitle="Baseado em $0.002 / 1k tokens"
                      icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                      color="emerald"
                    />
                    <StatCard 
                      title={t("usage.totalTokens")} 
                      value={(data.summary.totalChannelTokens || 0).toLocaleString()} 
                      subtitle="Consumo de todos os NPCs"
                      icon={<TrendingUp className="w-5 h-5 text-indigo-400" />}
                      color="indigo"
                    />
                    <StatCard 
                      title={t("usage.mcpList")} 
                      value={data.npcs.length.toString()} 
                      subtitle="Agentes ativos no canal"
                      icon={<Users className="w-5 h-5 text-violet-400" />}
                      color="violet"
                    />
                  </div>

                  {/* Search and Filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text"
                      placeholder={t("usage.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>

                  {/* Agents List (MCP List) */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                      <h3 className="font-bold text-white tracking-tight italic uppercase">{t("usage.mcpList")}</h3>
                      <button onClick={() => fetchReport()} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest transition-colors">{t("usage.syncData")}</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] bg-white/[0.02]">
                            <th className="px-6 py-4">{t("usage.agent")}</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">{t("usage.tokens")}</th>
                            <th className="px-6 py-4">{t("usage.cost")}</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredNpcs.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-600 text-sm italic">Nenhum dado encontrado para "{searchQuery}"</td></tr>
                          ) : filteredNpcs.map(npc => (
                            <tr 
                              key={npc.id} 
                              onClick={() => setSelectedNpcId(npc.id)}
                              className="hover:bg-indigo-500/5 transition-all group cursor-pointer"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-black text-indigo-300 group-hover:border-indigo-500/50 transition-all">
                                    {npc.name[0]}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight text-sm">{npc.name}</div>
                                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">{npc.id.slice(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                  Ativo
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col gap-1.5">
                                   <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                                     <span>Consumo</span>
                                     <span>{((npc.promptTokens + npc.completionTokens) / 1000).toFixed(1)}k</span>
                                   </div>
                                   <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-500 group-hover:bg-indigo-400 transition-all shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                                        style={{ width: `${Math.min(100, ((npc.promptTokens + npc.completionTokens) / 5000) * 100)}%` }} 
                                      />
                                   </div>
                                   <div className="text-[10px] text-gray-600 tabular-nums">P: {npc.promptTokens.toLocaleString()} | C: {npc.completionTokens.toLocaleString()}</div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="text-base text-emerald-400 font-black font-mono tracking-tighter">${npc.totalCost.toFixed(4)}</div>
                                <div className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mt-0.5">Estimated USD</div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 group-hover:text-indigo-400 transition-all border border-transparent group-hover:border-white/10">
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                    <LogsTable logs={data.recentLogs} t={t} />
                  </div>
                </div>
              )
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
              <BarChart3 className="w-16 h-16 opacity-10" />
              <p>{t("usage.noData")}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[10px] text-gray-600 font-mono tracking-tighter uppercase">
            <span>DESKRPG ANALYTICS v1.2</span>
            <span className="w-1 h-1 rounded-full bg-gray-800" />
            <span>EST. 1 TOKEN ≈ 4 CHARS</span>
            <span className="w-1 h-1 rounded-full bg-gray-800" />
            <span className="text-indigo-600 font-bold">MODE: REALTIME MONITORING</span>
           </div>
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
           >
            {t("common.close")}
           </button>
        </div>
      </div>
    </div>
  );
}

function LogsTable({ logs, t }: { logs: UsageLog[], t: any }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] bg-white/[0.02]">
            <th className="px-6 py-4">{t("usage.time")}</th>
            <th className="px-6 py-4">{t("usage.agent")}</th>
            <th className="px-6 py-4">{t("usage.context")}</th>
            <th className="px-6 py-4 text-right">{t("usage.tokens")}</th>
            <th className="px-6 py-4 text-right">{t("usage.investment")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-mono">
          {logs.length === 0 ? (
             <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-600 text-sm italic">{t("usage.noLogs")}</td></tr>
          ) : logs.map(log => (
            <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
              <td className="px-6 py-4 text-[10px] text-gray-500 tabular-nums">
                {new Date(log.createdAt).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm text-white font-bold tracking-tight">
                {log.npcName}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                  log.contextKind === 'meeting' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 
                  log.contextKind === 'task' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {log.contextKind}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-sm text-white tabular-nums font-bold">
                {(log.promptTokens + log.completionTokens).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right text-sm text-emerald-400 font-bold tabular-nums">
                ${parseFloat(log.estimatedCost || "0").toFixed(5)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, trend, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };

  return (
    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_-5px_currentColor] ${colors[color] || ""}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-xs text-gray-500 font-black uppercase tracking-[0.1em]">{title}</p>
        <h4 className="text-3xl font-black text-white mt-1 tabular-nums tracking-tighter group-hover:text-indigo-300 transition-colors">{value}</h4>
        <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1 font-medium">
          <Calendar className="w-3 h-3" />
          {subtitle}
        </p>
      </div>
    </div>
  );
}
