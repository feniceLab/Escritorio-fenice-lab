"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SettingsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [form, setForm] = useState({ accessToken: "", fbPageId: "", igUserId: "", notifChatIds: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${clientId}/meta-config`, { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } })
      .then(r => r.json())
      .then(data => {
        if (data) setForm({ accessToken: data.accessToken || "", fbPageId: data.fbPageId || "", igUserId: data.igUserId || "", notifChatIds: (data.notifChatIds || []).join(", ") });
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const save = async () => {
    setSaving(true);
    const r = await fetch(`/api/clients/${clientId}/meta-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMsg(r.ok ? "Salvo com sucesso!" : "Erro ao salvar");
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="p-8 text-gray-400">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Configuração Meta</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Access Token</label>
          <input type="password" value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
            placeholder="EAAxxxxxxxx..."
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Facebook Page ID</label>
          <input type="text" value={form.fbPageId} onChange={e => setForm(f => ({ ...f, fbPageId: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Instagram User ID</label>
          <input type="text" value={form.igUserId} onChange={e => setForm(f => ({ ...f, igUserId: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Chat IDs para notificações (separados por vírgula)</label>
          <input type="text" value={form.notifChatIds} onChange={e => setForm(f => ({ ...f, notifChatIds: e.target.value }))}
            placeholder="-1001234567890, -1009876543210"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        {msg && <p className={`text-sm ${msg.includes("Erro") ? "text-red-400" : "text-green-400"}`}>{msg}</p>}
        <button onClick={save} disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded font-medium">
          {saving ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}
