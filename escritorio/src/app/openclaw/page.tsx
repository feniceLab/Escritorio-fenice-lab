"use client";

import React from "react";
import { Terminal, Shield, Cpu, Activity } from "lucide-react";

export default function OpenClawPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">OpenClaw Control Center</h1>
          <p className="text-gray-400">Gerenciamento centralizado de agentes e automações inteligentes.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-500 text-sm font-medium">Sistema Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <Activity className="w-8 h-8 text-amber-500 mb-4" />
          <div className="text-2xl font-bold text-white">19</div>
          <div className="text-sm text-gray-500">Agentes Ativos</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <Cpu className="w-8 h-8 text-blue-500 mb-4" />
          <div className="text-2xl font-bold text-white">GPT-4o</div>
          <div className="text-sm text-gray-500">Modelo Padrão</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <Terminal className="w-8 h-8 text-purple-500 mb-4" />
          <div className="text-2xl font-bold text-white">124</div>
          <div className="text-sm text-gray-500">Tarefas em Execução</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <Shield className="w-8 h-8 text-red-500 mb-4" />
          <div className="text-2xl font-bold text-white">Secure</div>
          <div className="text-sm text-gray-500">Protocolo de Segurança</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
          <h2 className="font-semibold text-white">Console do Sistema</h2>
          <button className="text-xs text-gray-500 hover:text-white transition-colors">Limpar Logs</button>
        </div>
        <div className="p-6 font-mono text-sm text-amber-400/80 space-y-2 bg-black/40 min-h-[300px]">
          <div>[SYSTEM] OpenClaw Kernel v2.4.0 iniciado...</div>
          <div>[INFO] Conectado ao cluster Meta Ads API via Token EAARu...</div>
          <div>[INFO] Nina-QA: Monitorando 4 canais de publicação.</div>
          <div>[INFO] Gaia-Produto: Sincronizando backlog com Notion.</div>
          <div className="animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
}
