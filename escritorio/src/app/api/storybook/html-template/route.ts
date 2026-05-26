import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/storybook/html-template?type=X
 *
 * Retorna HTML pronto para uso baseado em templates do Design System Starkën.
 * NPCs consomem este endpoint via WebFetch para gerar artefatos consistentes
 * (relatórios, emails, propostas) sem reinventar estilos.
 *
 * Query params:
 *   type: "relatorio-mensal" | "email-onboarding" | "proposta-comercial"
 *         | "dashboard-cliente" | "alerta-monitoramento" | "ata-reuniao"
 *   cliente: nome do cliente (opcional, interpolado no template)
 *   periodo: período (opcional, ex: "Abril 2026")
 *   titulo: título customizado (opcional)
 */

const TEMPLATES: Record<string, (params: URLSearchParams) => string> = {
  "relatorio-mensal": (p) => {
    const cliente = p.get("cliente") || "Cliente";
    const periodo = p.get("periodo") || new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const titulo = p.get("titulo") || `Relatório de Performance — ${periodo}`;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  :root {
    --brand-primary: #10b981;
    --brand-secondary: #0ea5e9;
    --neutral-900: #020617;
    --neutral-800: #0f172a;
    --neutral-600: #475569;
    --neutral-400: #94a3b8;
    --neutral-100: #f1f5f9;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--neutral-900); color: white; margin: 0; padding: 2rem; }
  .header { border-bottom: 2px solid var(--brand-primary); padding-bottom: 1.5rem; margin-bottom: 2rem; }
  .header h1 { color: var(--brand-primary); font-size: 2.5rem; margin: 0 0 0.5rem; }
  .header .sub { color: var(--neutral-400); font-size: 1rem; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
  .kpi-card { background: var(--neutral-800); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.25rem; }
  .kpi-card .label { color: var(--neutral-400); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .kpi-card .value { color: white; font-size: 2rem; font-weight: 700; }
  .kpi-card .delta { font-size: 0.875rem; margin-top: 0.25rem; }
  .kpi-card .delta.up { color: var(--success); }
  .kpi-card .delta.down { color: var(--danger); }
  .section { background: var(--neutral-800); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .section h2 { color: var(--brand-primary); font-size: 1.5rem; margin: 0 0 1rem; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; color: var(--neutral-400); font-size: 0.75rem; text-transform: uppercase; padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
  td { padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; }
  .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
  .badge.success { background: rgba(16,185,129,0.2); color: var(--success); }
  .badge.warning { background: rgba(245,158,11,0.2); color: var(--warning); }
  .badge.danger { background: rgba(239,68,68,0.2); color: var(--danger); }
  .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); color: var(--neutral-400); font-size: 0.875rem; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <h1>${titulo}</h1>
    <div class="sub">Cliente: <strong>${cliente}</strong> &middot; Gerado por NPC em ${new Date().toLocaleString("pt-BR")}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="label">Posts Publicados</div><div class="value">—</div><div class="delta up">↑ --%</div></div>
    <div class="kpi-card"><div class="label">Alcance</div><div class="value">—</div><div class="delta up">↑ --%</div></div>
    <div class="kpi-card"><div class="label">Engajamento</div><div class="value">—</div><div class="delta up">↑ --%</div></div>
    <div class="kpi-card"><div class="label">Investimento</div><div class="value">R$ —</div><div class="delta down">↓ --%</div></div>
  </div>

  <div class="section">
    <h2>Destaques do Período</h2>
    <p>[Preencher com os principais acontecimentos do mês]</p>
  </div>

  <div class="section">
    <h2>Detalhamento</h2>
    <table>
      <thead><tr><th>Data</th><th>Post</th><th>Plataforma</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>--/--/----</td><td>Exemplo</td><td>Instagram</td><td><span class="badge success">Publicado</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    Starkën Performance &middot; Relatório gerado automaticamente pelo Escritório Virtual
  </div>
</body>
</html>`;
  },

  "email-onboarding": (p) => {
    const cliente = p.get("cliente") || "Cliente";
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Bem-vindo(a)!</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:2rem 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#10b981;padding:2rem;text-align:center;">
          <h1 style="color:#020617;font-size:2rem;margin:0;">Bem-vindo(a) à Starkën!</h1>
        </td></tr>
        <tr><td style="padding:2rem;color:#f1f5f9;">
          <p style="font-size:1rem;line-height:1.6;">Olá, <strong>${cliente}</strong>!</p>
          <p style="font-size:1rem;line-height:1.6;">É um prazer ter você conosco. Nossa equipe está pronta para elevar sua presença digital ao próximo nível.</p>
          <a href="#" style="display:inline-block;background:#10b981;color:#020617;padding:0.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;margin-top:1rem;">Começar agora →</a>
        </td></tr>
        <tr><td style="background:#020617;padding:1.5rem;text-align:center;color:#94a3b8;font-size:0.75rem;">
          Fenix Lab &middot; ferramentas.fenixlab@gmail.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  },

  "proposta-comercial": (p) => {
    const cliente = p.get("cliente") || "Cliente";
    const titulo = p.get("titulo") || "Proposta Comercial";
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>${titulo}</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #020617; color: white; margin: 0; padding: 3rem; }
  h1 { color: #10b981; font-size: 3rem; margin-bottom: 0.5rem; }
  .sub { color: #94a3b8; margin-bottom: 3rem; }
  .block { background: #0f172a; border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; border-left: 4px solid #10b981; }
  .block h2 { color: #10b981; margin-top: 0; }
  .price { font-size: 3rem; color: #10b981; font-weight: 700; }
</style></head>
<body>
  <h1>${titulo}</h1>
  <div class="sub">Para: <strong>${cliente}</strong> &middot; Válida até ${new Date(Date.now()+30*86400000).toLocaleDateString("pt-BR")}</div>
  <div class="block"><h2>Escopo</h2><p>[Preencher]</p></div>
  <div class="block"><h2>Entregáveis</h2><ul><li>[Item]</li></ul></div>
  <div class="block"><h2>Investimento</h2><div class="price">R$ —</div></div>
</body></html>`;
  },

  "alerta-monitoramento": (p) => {
    const severity = (p.get("severity") || "warning").toLowerCase();
    const titulo = p.get("titulo") || "Alerta de Monitoramento";
    const mensagem = p.get("mensagem") || "Evento detectado.";
    const cor = severity === "danger" ? "#ef4444" : severity === "success" ? "#10b981" : "#f59e0b";
    return `<div style="background:#0f172a;border-left:4px solid ${cor};border-radius:8px;padding:1rem 1.5rem;color:white;font-family:-apple-system,sans-serif;max-width:600px;">
  <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
    <span style="background:${cor};width:10px;height:10px;border-radius:50%;"></span>
    <strong style="color:${cor};text-transform:uppercase;font-size:0.75rem;letter-spacing:0.05em;">${severity}</strong>
  </div>
  <h3 style="margin:0 0 0.5rem;font-size:1.125rem;">${titulo}</h3>
  <p style="margin:0;color:#94a3b8;font-size:0.875rem;">${mensagem}</p>
  <div style="margin-top:0.75rem;font-size:0.75rem;color:#64748b;">${new Date().toLocaleString("pt-BR")}</div>
</div>`;
  },
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "";

  if (!type) {
    return NextResponse.json({
      available: Object.keys(TEMPLATES),
      usage: "?type=<template-name>&cliente=...&periodo=...&titulo=...",
      description:
        "Retorna HTML pronto do Design System Starkën. NPCs devem consumir via WebFetch e salvar o resultado na biblioteca via /api/internal/npc-output.",
    });
  }

  const template = TEMPLATES[type];
  if (!template) {
    return NextResponse.json(
      { errorCode: "unknown_template", error: `Template '${type}' não existe.`, available: Object.keys(TEMPLATES) },
      { status: 404 },
    );
  }

  const html = template(req.nextUrl.searchParams);

  // Se ?format=json → retorna dentro de um JSON (mais fácil pros NPCs lerem)
  if (req.nextUrl.searchParams.get("format") === "json") {
    return NextResponse.json({ type, html, length: html.length });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
