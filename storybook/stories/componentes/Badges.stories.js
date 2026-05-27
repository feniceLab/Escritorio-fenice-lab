export default {
  title: 'Starkën Design System/Componentes/Badges & Tags',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Badges, tags e indicadores de status. Usados para representar estados de publicação, prioridade, tipo de conteúdo e mais.',
      },
    },
  },
};

// ─── Status Badges (publish_queue) ────────────────────────────────────────
export const StatusBadges = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem;">Status Badges</h1>
      <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 2.5rem;">
        Usados nas tabelas de <code style="color: #6ee7b7;">publish_queue</code> e <code style="color: #6ee7b7;">publish_history</code>.
      </p>

      <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 3rem;">
        ${[
          { label: 'PUBLISHED',  bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  color: '#10b981', dot: '#10b981' },
          { label: 'QUEUED',     bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  color: '#60a5fa', dot: '#3b82f6' },
          { label: 'PROCESSING', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24', dot: '#f59e0b' },
          { label: 'FAILED',     bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   color: '#f87171', dot: '#ef4444' },
          { label: 'SCHEDULED',  bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', color: '#a78bfa', dot: '#8b5cf6' },
          { label: 'CANCELLED',  bg: 'rgba(100,116,139,0.12)',border: 'rgba(100,116,139,0.3)',color: '#94a3b8', dot: '#64748b' },
          { label: 'DRAFT',      bg: 'rgba(100,116,139,0.08)',border: 'rgba(100,116,139,0.2)',color: '#94a3b8', dot: '#475569' },
        ].map(({ label, bg, border, color, dot }) => `
          <span style="
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: ${bg};
            border: 1px solid ${border};
            color: ${color};
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.35rem 0.75rem;
            border-radius: 100px;
            letter-spacing: 0.04em;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${dot}; flex-shrink: 0;"></span>
            ${label}
          </span>
        `).join('')}
      </div>

      <!-- Tamanhos -->
      <h2 style="color: #ffffff; font-size: 1rem; font-weight: 600; margin-bottom: 1.25rem;">Tamanhos</h2>
      <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem;">
        ${[
          { size: 'XS', fs: '0.65rem', py: '0.1rem 0.4rem' },
          { size: 'SM', fs: '0.75rem', py: '0.25rem 0.6rem' },
          { size: 'MD', fs: '0.8rem',  py: '0.35rem 0.85rem' },
          { size: 'LG', fs: '0.875rem', py: '0.5rem 1rem' },
        ].map(({ size, fs, py }) => `
          <span style="
            display: inline-flex; align-items: center; gap: 0.4rem;
            background: rgba(16,185,129,0.12);
            border: 1px solid rgba(16,185,129,0.3);
            color: #10b981;
            font-size: ${fs};
            font-weight: 700;
            padding: ${py};
            border-radius: 100px;
          ">
            <span style="width: 5px; height: 5px; border-radius: 50%; background: #10b981;"></span>
            ${size} — PUBLISHED
          </span>
        `).join('')}
      </div>

      <!-- Tags de conteúdo -->
      <h2 style="color: #ffffff; font-size: 1rem; font-weight: 600; margin-bottom: 1.25rem;">Tags de Conteúdo</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 3rem;">
        ${['Feed', 'Stories', 'Reels', 'Carrossel', 'IG', 'FB', 'IG+FB', 'Design', 'Copy', 'Vídeo', 'Briefing', 'Premium'].map((tag, i) => {
          const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
          const c = colors[i % colors.length];
          return `
            <span style="
              background: ${c}18;
              border: 1px solid ${c}40;
              color: ${c};
              font-size: 0.7rem;
              font-weight: 600;
              padding: 0.2rem 0.6rem;
              border-radius: 6px;
            ">${tag}</span>
          `;
        }).join('')}
      </div>

      <!-- Priority badges -->
      <h2 style="color: #ffffff; font-size: 1rem; font-weight: 600; margin-bottom: 1.25rem;">Prioridade</h2>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        ${[
          { label: 'Urgente',  color: '#ef4444', emoji: '🔴' },
          { label: 'Alta',     color: '#f59e0b', emoji: '🟠' },
          { label: 'Média',    color: '#3b82f6', emoji: '🔵' },
          { label: 'Baixa',    color: '#64748b', emoji: '⚪' },
        ].map(({ label, color, emoji }) => `
          <span style="
            display: inline-flex; align-items: center; gap: 0.4rem;
            background: ${color}15;
            border: 1px solid ${color}35;
            color: ${color};
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.3rem 0.75rem;
            border-radius: 8px;
          ">${emoji} ${label}</span>
        `).join('')}
      </div>
    </div>
  `,
};

// ─── Badges em contexto (tabela) ──────────────────────────────────────────
export const BadgesEmTabela = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Badges em Contexto — Tabela</h1>

      <div style="background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              ${['Cliente', 'Plataforma', 'Tipo', 'Horário', 'Status', 'Prioridade'].map(h => `
                <th style="color: #64748b; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.75rem 1rem; text-align: left;">${h}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${[
              { client: 'Fenix Performance', platform: 'IG',    type: 'Feed',     time: '14:00', status: 'PUBLISHED',  statusColor: '#10b981', prio: 'Alta', prioColor: '#f59e0b' },
              { client: 'Alpha Assessoria',    platform: 'FB',    type: 'Carrossel',time: '15:30', status: 'QUEUED',     statusColor: '#3b82f6', prio: 'Média', prioColor: '#3b82f6' },
              { client: 'Fenix Performance', platform: 'IG+FB', type: 'Stories',  time: '18:00', status: 'PROCESSING', statusColor: '#f59e0b', prio: 'Urgente', prioColor: '#ef4444' },
              { client: 'Cliente XYZ',         platform: 'FB',    type: 'Feed',     time: '20:00', status: 'FAILED',     statusColor: '#ef4444', prio: 'Alta', prioColor: '#f59e0b' },
              { client: 'Alpha Assessoria',    platform: 'IG',    type: 'Reels',    time: '22:00', status: 'SCHEDULED',  statusColor: '#8b5cf6', prio: 'Baixa', prioColor: '#64748b' },
            ].map(({ client, platform, type, time, status, statusColor, prio, prioColor }, i) => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); ${i % 2 === 0 ? '' : 'background: rgba(255,255,255,0.02);'}">
                <td style="padding: 0.875rem 1rem; color: #ffffff; font-size: 0.875rem; font-weight: 500;">${client}</td>
                <td style="padding: 0.875rem 1rem;">
                  <span style="color: #94a3b8; font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: 4px;">${platform}</span>
                </td>
                <td style="padding: 0.875rem 1rem; color: #94a3b8; font-size: 0.8rem;">${type}</td>
                <td style="padding: 0.875rem 1rem; color: #94a3b8; font-size: 0.8rem; font-family: 'Fira Code', monospace;">${time}</td>
                <td style="padding: 0.875rem 1rem;">
                  <span style="
                    display: inline-flex; align-items: center; gap: 0.35rem;
                    background: ${statusColor}18; border: 1px solid ${statusColor}40;
                    color: ${statusColor}; font-size: 0.7rem; font-weight: 700;
                    padding: 0.2rem 0.6rem; border-radius: 100px; letter-spacing: 0.03em;
                  ">
                    <span style="width: 5px; height: 5px; border-radius: 50%; background: ${statusColor};"></span>
                    ${status}
                  </span>
                </td>
                <td style="padding: 0.875rem 1rem;">
                  <span style="
                    background: ${prioColor}15; border: 1px solid ${prioColor}30;
                    color: ${prioColor}; font-size: 0.7rem; font-weight: 600;
                    padding: 0.2rem 0.5rem; border-radius: 6px;
                  ">${prio}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `,
};
