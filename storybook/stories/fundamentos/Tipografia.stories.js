export default {
  title: 'Starkën Design System/Fundamentos/Tipografia',
  parameters: {
    docs: {
      description: {
        component: 'Sistema tipográfico completo do Starkën Design System. Fontes, escalas, pesos e uso correto em cada contexto.',
      },
    },
  },
};

// ─── Escala completa ───────────────────────────────────────────────────────
export const EscalaCompleta = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <h1 style="color: #10b981; font-size: 2.5rem; margin-bottom: 0.5rem;">Aa — Escala Tipográfica</h1>
      <p style="color: #94a3b8; font-size: 1.125rem; margin-bottom: 3rem; max-width: 700px;">
        Sistema de tamanhos progressivos. Use sempre a escala definida — nunca valores soltos em px.
      </p>

      ${[
        { token: 'text-xs',   size: '0.75rem',  px: '12px', weight: '400', usage: 'Labels, captions, micro-texto' },
        { token: 'text-sm',   size: '0.875rem', px: '14px', weight: '400', usage: 'Texto auxiliar, metadados, placeholders' },
        { token: 'text-base', size: '1rem',     px: '16px', weight: '400', usage: 'Corpo padrão, parágrafos' },
        { token: 'text-lg',   size: '1.125rem', px: '18px', weight: '500', usage: 'Subtítulos, leads' },
        { token: 'text-xl',   size: '1.25rem',  px: '20px', weight: '600', usage: 'Títulos de seção pequenos' },
        { token: 'text-2xl',  size: '1.5rem',   px: '24px', weight: '700', usage: 'Títulos de card, heading h3' },
        { token: 'text-3xl',  size: '1.875rem', px: '30px', weight: '700', usage: 'Títulos de página h2' },
        { token: 'text-4xl',  size: '2.25rem',  px: '36px', weight: '800', usage: 'Hero, heading h1' },
        { token: 'text-5xl',  size: '3rem',     px: '48px', weight: '900', usage: 'Display, headlines grandes' },
        { token: 'text-6xl',  size: '3.75rem',  px: '60px', weight: '900', usage: 'Números KPI, métricas destaque' },
      ].map(({ token, size, px, weight, usage }) => `
        <div style="
          display: grid;
          grid-template-columns: 160px 1fr 100px;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        ">
          <div>
            <code style="color: #6ee7b7; font-size: 0.75rem; background: rgba(16,185,129,0.08); padding: 0.2rem 0.5rem; border-radius: 4px;">${token}</code>
            <div style="color: #64748b; font-size: 0.75rem; margin-top: 0.25rem;">${px} · w${weight}</div>
          </div>
          <div style="color: #ffffff; font-size: ${size}; font-weight: ${weight}; line-height: 1.2; letter-spacing: ${parseFloat(size) >= 2 ? '-0.02em' : '0'};">
            Starkën Design System
          </div>
          <div style="color: #64748b; font-size: 0.75rem; line-height: 1.4;">${usage}</div>
        </div>
      `).join('')}
    </div>
  `,
};

// ─── Famílias tipográficas ─────────────────────────────────────────────────
export const FamiliasDeFonte = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 0.5rem;">Famílias de Fonte</h1>
      <p style="color: #94a3b8; margin-bottom: 3rem;">Três famílias distintas com papéis claros no sistema.</p>

      <!-- Inter: Body -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <div style="color: #10b981; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">PRINCIPAL · BODY</div>
            <div style="color: #ffffff; font-size: 1.75rem; font-weight: 700; font-family: 'Inter', sans-serif;">Inter</div>
          </div>
          <code style="color: #6ee7b7; font-size: 0.8rem; background: rgba(16,185,129,0.08); padding: 0.35rem 0.75rem; border-radius: 6px;">font-family: 'Inter', sans-serif</code>
        </div>
        <div style="font-family: 'Inter', sans-serif; color: #e2e8f0; font-size: 1.125rem; line-height: 1.75; margin-bottom: 1.5rem; max-width: 600px;">
          A Starkën nasceu para transformar o marketing digital em ciência. Cada dado, cada pixel, cada decisão guiada por inteligência — não por achismo.
        </div>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          ${['100 Thin', '300 Light', '400 Regular', '500 Medium', '600 SemiBold', '700 Bold', '800 ExtraBold', '900 Black'].map(w => {
            const [num, label] = w.split(' ');
            return `<span style="font-family: 'Inter', sans-serif; font-weight: ${num}; color: #94a3b8; font-size: 0.875rem;">${label} (${num})</span>`;
          }).join('')}
        </div>
        <div style="margin-top: 1rem; color: #64748b; font-size: 0.8rem;">Uso: corpo de texto, parágrafos, UI, botões, formulários</div>
      </div>

      <!-- Sora / Display -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <div style="color: #10b981; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">DISPLAY · HEADINGS</div>
            <div style="color: #ffffff; font-size: 1.75rem; font-weight: 700; font-family: 'Sora', 'Inter', sans-serif;">Sora</div>
          </div>
          <code style="color: #6ee7b7; font-size: 0.8rem; background: rgba(16,185,129,0.08); padding: 0.35rem 0.75rem; border-radius: 6px;">font-family: 'Sora', sans-serif</code>
        </div>
        <div style="font-family: 'Sora', 'Inter', sans-serif; color: #ffffff; font-size: 2rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -0.02em;">
          Resultados Reais.<br/>Dados Reais. Sempre.
        </div>
        <div style="color: #64748b; font-size: 0.8rem;">Uso: headlines h1-h2, hero sections, banners, títulos de relatório</div>
      </div>

      <!-- Fira Code: Mono -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <div style="color: #10b981; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">MONO · CÓDIGO</div>
            <div style="color: #ffffff; font-size: 1.75rem; font-weight: 700; font-family: 'Fira Code', monospace;">Fira Code</div>
          </div>
          <code style="color: #6ee7b7; font-size: 0.8rem; background: rgba(16,185,129,0.08); padding: 0.35rem 0.75rem; border-radius: 6px;">font-family: 'Fira Code', monospace</code>
        </div>
        <pre style="font-family: 'Fira Code', monospace; color: #6ee7b7; font-size: 0.9rem; background: #020617; padding: 1.25rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem;">
const metrics = await supabase
  .from('publish_history')
  .select('*')
  .eq('status', 'PUBLISHED')
  .gte('created_at', today);

// ✓ 47 posts published today</pre>
        <div style="color: #64748b; font-size: 0.8rem;">Uso: código, valores de variáveis CSS, tokens, IDs, timestamps</div>
      </div>
    </div>
  `,
};

// ─── Pesos e estilos ───────────────────────────────────────────────────────
export const PesosEEstilos = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 3rem;">Pesos & Estilos</h1>

      <div style="display: grid; gap: 0.5rem; max-width: 700px;">
        ${[
          { weight: 100, label: 'Thin', use: 'Decorativo apenas — nunca em corpo' },
          { weight: 300, label: 'Light', use: 'Subtextos longos, legendas de gráfico' },
          { weight: 400, label: 'Regular', use: 'Corpo de texto padrão' },
          { weight: 500, label: 'Medium', use: 'Destaques no corpo, labels de formulário' },
          { weight: 600, label: 'SemiBold', use: 'Títulos de card, navegação ativa' },
          { weight: 700, label: 'Bold', use: 'Headings h2-h3, KPIs' },
          { weight: 800, label: 'ExtraBold', use: 'Títulos de página h1, CTAs' },
          { weight: 900, label: 'Black', use: 'Display headlines, números mega' },
        ].map(({ weight, label, use }) => `
          <div style="
            display: grid;
            grid-template-columns: 80px 220px 1fr;
            align-items: center;
            gap: 1.5rem;
            padding: 1rem 1.25rem;
            background: #0f172a;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.06);
          ">
            <code style="color: #6ee7b7; font-size: 0.75rem;">${weight}</code>
            <span style="color: #ffffff; font-size: 1.25rem; font-weight: ${weight}; font-family: 'Inter', sans-serif;">${label} — Inter</span>
            <span style="color: #64748b; font-size: 0.8rem;">${use}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `,
};

// ─── Hierarquia headings ───────────────────────────────────────────────────
export const HierarquiaHeadings = {
  render: () => `
    <div style="padding: 2rem; max-width: 800px;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 3rem;">Hierarquia de Headings</h1>

      <div style="background: #0f172a; border-radius: 16px; padding: 2.5rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2rem;">EXEMPLO REAL — Relatório de Performance</div>

        <div style="color: #ffffff; font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 0.5rem;">
          Relatório Mensal · Abril 2026
        </div>
        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 2.5rem;">h1 · text-4xl · ExtraBold · letter-spacing: -0.02em</div>

        <div style="color: #ffffff; font-size: 1.875rem; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; margin-bottom: 0.5rem;">
          Performance de Publicações
        </div>
        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 2.5rem;">h2 · text-3xl · Bold · letter-spacing: -0.01em</div>

        <div style="color: #ffffff; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
          Posts por Plataforma
        </div>
        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 2.5rem;">h3 · text-2xl · Bold</div>

        <div style="color: #ffffff; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
          Instagram Feed
        </div>
        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 2.5rem;">h4 · text-xl · SemiBold</div>

        <div style="color: #e2e8f0; font-size: 1rem; font-weight: 400; line-height: 1.75; margin-bottom: 0.5rem; max-width: 500px;">
          No mês de abril foram publicados 142 posts com taxa de aprovação de 94%. A média de agendamentos por cliente foi de 18 publicações.
        </div>
        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 2.5rem;">p · text-base · Regular · line-height: 1.75</div>

        <div style="color: #94a3b8; font-size: 0.875rem; font-weight: 400; line-height: 1.6; margin-bottom: 0.5rem;">
          Dados coletados via Supabase publish_history · Gerado em 18/04/2026
        </div>
        <div style="color: #64748b; font-size: 0.75rem;">small · text-sm · Regular · color: secondary</div>
      </div>

      <!-- Espaçamento entre headings -->
      <div style="margin-top: 2rem; background: #0f172a; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #10b981; font-size: 1rem; font-weight: 600; margin-bottom: 1.25rem;">📐 Espaçamento Padrão</div>
        <div style="display: grid; gap: 0.75rem;">
          ${[
            { el: 'h1 → subtítulo', space: '8px (0.5rem)' },
            { el: 'h1 → primeiro parágrafo', space: '24px (1.5rem)' },
            { el: 'h2 → conteúdo', space: '20px (1.25rem)' },
            { el: 'h3 → conteúdo', space: '16px (1rem)' },
            { el: 'Entre parágrafos', space: '16px (1rem)' },
            { el: 'Seção → próxima seção', space: '48px (3rem)' },
          ].map(({ el, space }) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #020617; border-radius: 8px;">
              <span style="color: #e2e8f0; font-size: 0.875rem;">${el}</span>
              <code style="color: #6ee7b7; font-size: 0.8rem;">${space}</code>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `,
};

// ─── Cores de texto ────────────────────────────────────────────────────────
export const CoresDeTexto = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 3rem;">Cores de Texto</h1>

      <div style="display: grid; gap: 1rem; max-width: 700px;">
        ${[
          { name: 'Primary',   color: '#ffffff', hex: '#ffffff',  desc: 'Headings, labels importantes, texto de destaque' },
          { name: 'Secondary', color: '#94a3b8', hex: '#94a3b8',  desc: 'Corpo de texto, descrições, parágrafos' },
          { name: 'Muted',     color: '#64748b', hex: '#64748b',  desc: 'Metadados, timestamps, texto de suporte' },
          { name: 'Disabled',  color: '#475569', hex: '#475569',  desc: 'Texto de campo desabilitado' },
          { name: 'Emerald',   color: '#10b981', hex: '#10b981',  desc: 'Links, código inline, valores positivos' },
          { name: 'Success',   color: '#34d399', hex: '#34d399',  desc: 'Confirmações, status PUBLISHED' },
          { name: 'Warning',   color: '#fbbf24', hex: '#fbbf24',  desc: 'Avisos, status QUEUED/PROCESSING' },
          { name: 'Error',     color: '#f87171', hex: '#f87171',  desc: 'Erros, status FAILED' },
        ].map(({ name, color, hex, desc }) => `
          <div style="
            display: grid;
            grid-template-columns: 48px 120px 1fr;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            background: #0f172a;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.06);
          ">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; border: 2px solid rgba(255,255,255,0.15);"></div>
            <div>
              <div style="color: #ffffff; font-weight: 600; font-size: 0.875rem;">${name}</div>
              <code style="color: #6ee7b7; font-size: 0.75rem;">${hex}</code>
            </div>
            <div style="color: ${color}; font-size: 0.875rem;">${desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `,
};
