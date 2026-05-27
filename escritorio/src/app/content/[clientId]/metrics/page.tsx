"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function MetricsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/metrics?days=${days}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [clientId, days]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Métricas</h1>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white">
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      {loading && <p className="text-gray-400">Carregando métricas...</p>}

      {!loading && data && (
        <div className="space-y-6">
          {data.fbMetrics?.data && (
            <div>
              <h2 className="text-lg font-semibold text-blue-400 mb-3">Facebook</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.fbMetrics.data.map((m: any) => (
                  <div key={m.name} className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-400 uppercase">{m.name.replace("page_", "")}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {m.values?.reduce((a: number, v: any) => a + (v.value || 0), 0).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!data.fbMetrics && <p className="text-yellow-500 text-sm">Meta não configurado para este cliente. Configure em <a href={`/content/${clientId}/settings`} className="underline">Configurações</a>.</p>}

          <div>
            <h2 className="text-lg font-semibold text-purple-400 mb-3">Histórico de publicações</h2>
            {data.history?.length === 0 && <p className="text-gray-400 text-sm">Nenhuma publicação encontrada.</p>}
            <div className="space-y-2">
              {data.history?.map((h: any) => (
                <div key={h.id} className="bg-gray-800 rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{h.platform}</p>
                    <p className="text-gray-400 text-xs">{new Date(h.publishedAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${h.status === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
