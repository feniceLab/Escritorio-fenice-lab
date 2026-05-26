"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, X, Users, ChefHat, Utensils, Store, Briefcase } from "lucide-react";

interface NewClientWizardProps {
  parentChannelId: string;
  groupId: string | null;
  characterId: string;
  onClose: () => void;
}

const BUSINESS_TYPES = [
  { id: "restaurant", label: "Restaurante", icon: ChefHat, squads: ["restaurant-marketing", "hr", "brand-scraper", "designer", "api-configurator"] },
  { id: "pizzaria", label: "Pizzaria", icon: Utensils, squads: ["restaurant-marketing", "hr", "brand-scraper", "designer", "api-configurator"] },
  { id: "cafe", label: "Cafeteria", icon: Store, squads: ["restaurant-marketing", "hr", "brand-scraper", "designer", "api-configurator"] },
  { id: "generic", label: "Outro Negócio", icon: Briefcase, squads: ["meta-ads", "google-ads", "hr", "brand-scraper", "designer", "api-configurator", "finance"] },
];

const SQUAD_OPTIONS = [
  { id: "meta-ads", label: "Meta Ads", desc: "Facebook e Instagram Ads" },
  { id: "google-ads", label: "Google Ads", desc: "Google Search e Display" },
  { id: "landing-page", label: "Landing Page", desc: "Criação de páginas" },
  { id: "restaurant-marketing", label: "Social Media", desc: "Instagram, Facebook, WhatsApp" },
  { id: "hr", label: "RH", desc: "Recrutamento e gestão" },
  { id: "brand-scraper", label: "Brand Intelligence", desc: "Analisa Instagram e preenche a biblioteca" },
  { id: "designer", label: "Designer", desc: "Identidade visual, Brand Book e Design System" },
  { id: "api-configurator", label: "Configurador de APIs", desc: "Coleta e configura chaves de API" },
  { id: "finance", label: "Squad Financeiro", desc: "Contas a pagar, cobranças e notificações" },
];

export default function NewClientWizard({ parentChannelId, groupId, characterId, onClose }: NewClientWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clientName, setClientName] = useState("");
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultMapTemplateId, setDefaultMapTemplateId] = useState<string>("default");

  // Fetch available map templates on mount
  useEffect(() => {
    fetch("/api/map-templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.templates && data.templates.length > 0) {
          setDefaultMapTemplateId(data.templates[0].id);
        }
      })
      .catch(() => {
        console.warn("Failed to fetch map templates, falling back to 'default'");
      });
  }, []);

  // Auto-select squads based on business type
  const selectBusinessType = (typeId: string) => {
    setBusinessType(typeId);
    const biz = BUSINESS_TYPES.find((b) => b.id === typeId);
    if (biz) setSelectedSquads(biz.squads);
    setStep(2);
  };

  const toggleSquad = (squadId: string) => {
    setSelectedSquads((prev) =>
      prev.includes(squadId) ? prev.filter((s) => s !== squadId) : [...prev, squadId],
    );
  };

  const handleCreate = useCallback(async () => {
    if (!clientName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      // 1. Create the client channel
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName.trim(),
          channelType: "client",
          clientName: clientName.trim(),
          businessType,
          selectedSquads,
          parentChannelId,
          groupId,
          mapTemplateId: defaultMapTemplateId,
          gatewayConfig: { provider: "claude-code" },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Falha ao criar sala do cliente");
        setCreating(false);
        return;
      }

      const data = await res.json();
      const newChannelId = data.channel?.id;

      if (!newChannelId) {
        setError("Canal criado mas sem ID retornado");
        setCreating(false);
        return;
      }

      // 2. Auto-create NPCs for each selected squad
      const allPresets = selectedSquads.flatMap(s => getPresetsForSquad(s));
      const failedNpcNames: string[] = [];
      
      for (const preset of allPresets) {
        try {
          const agentRes = await fetch("/api/npcs/create-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId: newChannelId,
              agentId: preset.id,
              presetId: preset.id,
              npcName: preset.name,
              locale: "pt",
              runtimeProvider: "claude-code",
            }),
          });

          if (!agentRes.ok) {
            const agentData = await agentRes.json().catch(() => ({}));
            console.warn(`Failed to prepare agent ${preset.name}:`, agentData);
          }

          const npcRes = await fetch("/api/npcs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId: newChannelId,
              name: preset.name,
              presetId: preset.id,
              positionX: preset.x,
              positionY: preset.y,
              direction: "down",
              agentAction: "create",
              agentId: preset.id,
              locale: "pt",
              runtimeProvider: "claude-code",
            }),
          });

          if (!npcRes.ok) {
            const npcData = await npcRes.json().catch(() => ({}));
            failedNpcNames.push(`${preset.name}: ${npcData.error || npcData.errorCode || "falha desconhecida"}`);
          }
        } catch (err) {
          console.error(`Failed to create NPC ${preset.name}:`, err);
          failedNpcNames.push(`${preset.name}: erro de rede`);
        }
      }

      if (failedNpcNames.length > 0) {
        setError(`Sala criada, mas alguns NPCs falharam: ${failedNpcNames.join("; ")}`);
        setCreating(false);
        return;
      }

      // 3. Navigate to the new room
      router.push(`/game?channelId=${newChannelId}&characterId=${characterId}`);
      onClose();
    } catch {
      setError("Erro de rede");
      setCreating(false);
    }
  }, [businessType, clientName, parentChannelId, groupId, selectedSquads, characterId, router, onClose, defaultMapTemplateId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Novo Cliente
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Step 1: Business type */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-sm text-gray-300 mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Restaurante Roma"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                autoFocus
              />

              <label className="block text-sm text-gray-300 mt-4 mb-2">Tipo de Negócio</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map((biz) => {
                  const Icon = biz.icon;
                  return (
                    <button
                      key={biz.id}
                      onClick={() => clientName.trim() && selectBusinessType(biz.id)}
                      disabled={!clientName.trim()}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                        !clientName.trim()
                          ? "border-gray-800 text-gray-600 cursor-not-allowed"
                          : "border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span className="text-sm font-medium">{biz.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Squads */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Squads para <strong className="text-white">{clientName}</strong>:
              </p>
              <div className="space-y-2">
                {SQUAD_OPTIONS.map((squad) => (
                  <label
                    key={squad.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSquads.includes(squad.id)
                        ? "border-indigo-500 bg-indigo-900/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSquads.includes(squad.id)}
                      onChange={() => toggleSquad(squad.id)}
                      className="rounded border-gray-600 bg-gray-800 text-indigo-500 w-4 h-4"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">{squad.label}</p>
                      <p className="text-xs text-gray-500">{squad.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedSquads.length === 0}
                  className="flex-1 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-lg font-medium"
                >
                  Revisar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white font-medium">{clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-gray-400">
                    {selectedSquads.length} squad{selectedSquads.length !== 1 ? "s" : ""} —{" "}
                    {selectedSquads.reduce((acc, s) => acc + getPresetsForSquad(s).length, 0)} NPCs serão criados
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 ml-6">
                  {selectedSquads.map((s) => {
                    const squad = SQUAD_OPTIONS.find((sq) => sq.id === s);
                    return (
                      <p key={s}>
                        {squad?.label}: {getPresetsForSquad(s).map((p) => p.name).join(", ")}
                      </p>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={creating}
                  className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-2 text-sm text-white bg-green-600 hover:bg-green-500 disabled:bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {creating ? "Criando..." : "Criar Sala do Cliente"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preset mapping helpers
// ---------------------------------------------------------------------------

interface PresetEntry {
  id: string;
  name: string;
  x: number;
  y: number;
}

function getPresetsForSquad(squadId: string): PresetEntry[] {
  const mapping: Record<string, PresetEntry[]> = {
    "meta-ads": [
      { id: "meta-ads-strategist", name: "Estrategista Meta Ads", x: 3, y: 3 },
      { id: "meta-ads-creative", name: "Criativo Meta Ads", x: 5, y: 3 },
      { id: "meta-ads-analyst", name: "Analista Meta Ads", x: 7, y: 3 },
    ],
    "google-ads": [
      { id: "google-ads-specialist", name: "Especialista Google Ads", x: 3, y: 5 },
      { id: "google-ads-copywriter", name: "Copywriter Google Ads", x: 5, y: 5 },
      { id: "google-ads-analyst", name: "Analista Google Ads", x: 7, y: 5 },
    ],
    "landing-page": [
      { id: "landing-page-copywriter", name: "Copywriter LP", x: 3, y: 7 },
      { id: "landing-page-designer", name: "Designer LP", x: 5, y: 7 },
      { id: "landing-page-developer", name: "Developer LP", x: 7, y: 7 },
    ],
    "restaurant-marketing": [
      { id: "restaurant-social-manager", name: "Social Media", x: 3, y: 9 },
      { id: "restaurant-content-creator", name: "Criador de Conteúdo", x: 5, y: 9 },
      { id: "restaurant-whatsapp-crm", name: "WhatsApp / CRM", x: 7, y: 9 },
      { id: "restaurant-paid-traffic", name: "Trafego Pago", x: 9, y: 9 },
    ],
    "hr": [
      { id: "hr-recruiter", name: "Recrutador", x: 3, y: 11 },
      { id: "hr-people-ops", name: "People Ops", x: 5, y: 11 },
      { id: "hr-trainer", name: "Treinamento", x: 7, y: 11 },
    ],
    "brand-scraper": [
      { id: "brand-scraper", name: "Brand Intelligence", x: 3, y: 13 },
    ],
    "designer": [
      { id: "designer", name: "Designer / Branding", x: 5, y: 13 },
    ],
    "api-configurator": [
      { id: "api-configurator", name: "Configurador de APIs", x: 5, y: 13 },
    ],
    "finance": [
      { id: "fin-payables-specialist", name: "Especialista em Pagamentos", x: 3, y: 15 },
      { id: "fin-active-collection", name: "Especialista em Recuperação", x: 5, y: 15 },
      { id: "fin-billing-notifier", name: "Notificador de Faturas", x: 7, y: 15 },
      { id: "fin-manager", name: "Diretor Financeiro", x: 9, y: 15 },
    ],
  };
  return mapping[squadId] || [];
}
