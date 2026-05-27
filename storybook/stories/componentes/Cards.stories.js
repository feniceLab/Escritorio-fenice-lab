export default {
  title: 'Starkën Design System/Componentes/Cards',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Sistema de cards do Starkën Design System. KPI Cards, Metric Cards, Content Cards, Status Cards e Chart Cards — todos usados no dashboard Escritório Virtual.',
      },
    },
  },
};

// ─── Shared styles ─────────────────────────────────────────────────────────
const baseCard = `
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1.5rem;
  font-family: 'Inter', sans-serif;
`;

// ─── KPI Cards (4 do dashboard) ───────────────────────────────────────────
export const KpiCards = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem;">KPI Cards</h1>
      <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem;">Cards de métricas chave — usados no topo do dashboard Executive Performance.</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">

        <!-- Clientes Fenix -->
        <div style="${baseCard}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div style="
              width: 40px; height: 40px;
              background: rgba(16,185,129,0.12);
              border-radius: 10px;
              display: flex; align-items: center; justify-content: center;
              font-size: 1.25rem;
            ">🏢</div>
            <span style="
              background: rgba(16,185,129,0.12);
              color: #10b981;
              font-size: 0.7rem;
              font-weight: 600;
              padding: 0.2rem 0.5rem;
              border-radius: 100px;
              border: 1px solid rgba(16,185,129,0.25);
            ">+4 este mês</span>
          </div>
          <div style="color: #ffffff; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-bottom: 0.25rem;">26</div>
          <div style="color: #94a3b8; font-size: 0.8rem; font-weight: 500;">Clientes Fenix</div>
          <div style="margin-top: 1rem; height: 4px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden;">
            <div style="height: 100%; width: 72%; background: linear-gradient(90deg, #10b981, #0d9488); border-radius: 100px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
            <span style="color: #64748b; font-size: 0.7rem;">Meta: 36</span>
            <span style="color: #10b981; font-size: 0.7rem; font-weight: 600;">72%</span>
          </div>
        </div>

        <!-- Clientes Alpha -->
        <div style="${baseCard}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div style="
              width: 40px; height: 40px;
              background: rgba(59,130,246,0.12);
              border-radius: 10px;
              display: flex; align-items: center; justify-content: center;
              font-size: 1.25rem;
            ">🔵</div>
            <span style="
              background: rgba(59,130,246,0.12);
              color: #60a5fa;
              font-size: 0.7rem;
              font-weight: 600;
              padding: 0.2rem 0.5rem;
              border-radius: 100px;
              border: 1px solid rgba(59,130,246,0.25);
            ">+2 este mês</span>
          </div>
          <div style="color: #ffffff; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-bottom: 0.25rem;">10</div>
          <div style="color: #94a3b8; font-size: 0.8rem; font-weight: 500;">Clientes Alpha</div>
          <div style="margin-top: 1rem; height: 4px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden;">
            <div style="height: 100%; width: 50%; background: linear-gradient(90deg, #3b82f6, #6366f1); border-radius: 100px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
            <span style="color: #64748b; font-size: 0.7rem;">Meta: 20</span>
            <span style="color: #60a5fa; font-size: 0.7rem; font-weight: 600;">50%</span>
          </div>
        </div>

        <!-- Cronogramas Pendentes -->
        <div style="${baseCard}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div style="
              width: 40px; height: 40px;
              background: rgba(245,158,11,0.12);
              border-radius: 10px;
              display: flex; align-items: center; justify-content: center;
              font-size: 1.25rem;
            ">⏳</div>
            <span style="
              background: rgba(245,158,11,0.12);
              color: #fbbf24;
              font-size: 0.7rem;
              font-weight: 600;
              padding: 0.2rem 0.5rem;
              border-radius: 100px;
              border: 1px solid rgba(245,158,11,0.25);
            ">Esta semana</span>
          </div>
          <div style="color: #ffffff; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-bottom: 0.25rem;">36</div>
          <div style="color: #94a3b8; font-size: 0.8rem; font-weight: 500;">Cronogramas Pendentes</div>
          <div style="margin-top: 1rem; height: 4px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden;">
            <div style="height: 100%; width: 85%; background: linear-gradient(90deg, #f59e0b, #ef4444); border-radius: 100px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
            <span style="color: #64748b; font-size: 0.7rem;">Prazo: Sexta-feira</span>
            <span style="color: #fbbf24; font-size: 0.7rem; font-weight: 600;">Urgente</span>
          </div>
        </div>

        <!-- Cronogramas Enviados -->
        <div style="${baseCard}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div style="
              width: 40px; height: 40px;
              background: rgba(16,185,129,0.08);
              border-radius: 10px;
              display: flex; align-items: center; justify-content: center;
              font-size: 1.25rem;
            ">✅</div>
            <span style="
              background: rgba(100,116,139,0.15);
              color: #94a3b8;
              font-size: 0.7rem;
              font-weight: 600;
              padding: 0.2rem 0.5rem;
              border-radius: 100px;
              border: 1px solid rgba(100,116,139,0.2);
            ">Abril 2026</span>
          </div>
          <div style="display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 0.25rem;">
            <span style="color: #ffffff; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1;">142</span>
            <span style="color: #64748b; font-size: 1rem; font-weight: 400;">/ 160</span>
          </div>
          <div style="color: #94a3b8; font-size: 0.8rem; font-weight: 500;">Cronogramas Enviados</div>
          <div style="margin-top: 1rem; height: 4px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden;">
            <div style="height: 100%; width: 89%; background: linear-gradient(90deg, #10b981, #0d9488); border-radius: 100px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
            <span style="color: #64748b; font-size: 0.7rem;">89% da meta</span>
            <span style="color: #10b981; font-size: 0.7rem; font-weight: 600;">+18 vs março</span>
          </div>
        </div>

      </div>
    </div>
  `,
};

// ─── Metric Cards (variantes de status) ───────────────────────────────────
export const MetricCards = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem;">Metric Cards — Variantes de Status</h1>
      <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem;">Cards de métrica com indicador de status. Use para relatórios detalhados e painéis de acompanhamento.</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">

        ${[
          { label: 'Posts Publicados', value: '47', unit: 'hoje', delta: '+12%', deltaPos: true, icon: '📤', color: '#10b981', bg: 'rgba(16,185,129,0.08)', status: 'PUBLISHED' },
          { label: 'Posts Agendados', value: '18', unit: 'pendentes', delta: '-3 vs ontem', deltaPos: false, icon: '🗓️', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', status: 'QUEUED' },
          { label: 'Posts com Falha', value: '2', unit: 'erros', delta: 'necessita ação', deltaPos: false, icon: '⚠️', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', status: 'FAILED' },
          { label: 'Taxa de Aprovação', value: '94', unit: '%', delta: '+2pp vs mês', deltaPos: true, icon: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', status: 'SCORE' },
        ].map(({ label, value, unit, delta, deltaPos, icon, color, bg, status }) => `
          <div style="${baseCard} position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: ${color};"></div>
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem;">
              <div>
                <div style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem;">${label}</div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                  <span style="color: #ffffff; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em;">${value}</span>
                  <span style="color: #64748b; font-size: 0.875rem;">${unit}</span>
                </div>
              </div>
              <div style="
                width: 44px; height: 44px;
                background: ${bg};
                border-radius: 12px;
                display: flex; align-items: center; justify-content: center;
                font-size: 1.25rem;
                border: 1px solid ${color}22;
              ">${icon}</div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="
                color: ${deltaPos ? '#34d399' : '#f87171'};
                font-size: 0.75rem;
                font-weight: 600;
                display: flex; align-items: center; gap: 0.25rem;
              ">${deltaPos ? '↑' : '↓'} ${delta}</span>
              <span style="
                color: ${color};
                font-size: 0.7rem;
                font-weight: 700;
                background: ${bg};
                padding: 0.15rem 0.5rem;
                border-radius: 4px;
                letter-spacing: 0.05em;
              ">${status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `,
};

// ─── Score Operacional Card ────────────────────────────────────────────────
export const ScoreOperacionalCard = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Score Operacional Card</h1>

      <div style="max-width: 380px;">
        <div style="${baseCard}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
            <div>
              <div style="color: #64748b; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Score Operacional</div>
              <div style="color: #ffffff; font-size: 0.875rem; font-weight: 500;">Abril 2026</div>
            </div>
            <div style="
              background: rgba(16,185,129,0.12);
              border: 1px solid rgba(16,185,129,0.25);
              color: #10b981;
              font-size: 0.75rem;
              font-weight: 700;
              padding: 0.3rem 0.75rem;
              border-radius: 100px;
            ">Excelente</div>
          </div>

          <!-- Score circle -->
          <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem;">
            <div style="position: relative; width: 96px; height: 96px; flex-shrink: 0;">
              <svg width="96" height="96" viewBox="0 0 96 96" style="transform: rotate(-90deg);">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
                <circle cx="48" cy="48" r="40" fill="none" stroke="#10b981" stroke-width="8"
                  stroke-dasharray="${Math.PI * 2 * 40}"
                  stroke-dashoffset="${Math.PI * 2 * 40 * (1 - 0.94)}"
                  stroke-linecap="round"/>
              </svg>
              <div style="
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                text-align: center;
              ">
                <div style="color: #ffffff; font-size: 1.5rem; font-weight: 800;">94</div>
                <div style="color: #64748b; font-size: 0.6rem;">/ 100</div>
              </div>
            </div>
            <div style="flex: 1;">
              ${[
                { label: 'Entregas no prazo', value: 98, color: '#10b981' },
                { label: 'Taxa de aprovação', value: 94, color: '#10b981' },
                { label: 'Posts sem falha', value: 96, color: '#3b82f6' },
                { label: 'Clientes ativos', value: 86, color: '#f59e0b' },
              ].map(({ label, value, color }) => `
                <div style="margin-bottom: 0.6rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                    <span style="color: #94a3b8; font-size: 0.7rem;">${label}</span>
                    <span style="color: ${color}; font-size: 0.7rem; font-weight: 700;">${value}%</span>
                  </div>
                  <div style="height: 3px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden;">
                    <div style="height: 100%; width: ${value}%; background: ${color}; border-radius: 100px;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="
            background: rgba(16,185,129,0.06);
            border: 1px solid rgba(16,185,129,0.15);
            border-radius: 10px;
            padding: 0.75rem 1rem;
            color: #94a3b8;
            font-size: 0.75rem;
            line-height: 1.5;
          ">
            <strong style="color: #10b981;">↑ +3 pontos</strong> vs março · Melhor resultado do trimestre
          </div>
        </div>
      </div>
    </div>
  `,
};

// ─── Próximos Posts Agendados Card ─────────────────────────────────────────
export const ProximosPostsCard = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Próximos Posts Agendados</h1>

      <div style="max-width: 520px;">
        <div style="${baseCard}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div>
              <div style="color: #ffffff; font-size: 1rem; font-weight: 700;">Próximos Agendamentos</div>
              <div style="color: #64748b; font-size: 0.75rem;">Fila de publicação</div>
            </div>
            <button style="
              background: rgba(16,185,129,0.1);
              border: 1px solid rgba(16,185,129,0.2);
              color: #10b981;
              font-size: 0.75rem;
              font-weight: 600;
              padding: 0.35rem 0.75rem;
              border-radius: 8px;
              cursor: pointer;
            ">Ver todos</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${[
              { client: 'Fenix Performance', platform: 'IG', time: '14:00', type: 'Feed', thumb: './post-1.png', status: 'QUEUED' },
              { client: 'Alpha Assessoria', platform: 'FB', time: '15:30', type: 'Carrossel', thumb: null, status: 'QUEUED' },
              { client: 'Fenix Performance', platform: 'IG+FB', time: '18:00', type: 'Stories', thumb: './post-3.png', status: 'PROCESSING' },
              { client: 'Cliente XYZ', platform: 'FB', time: '20:00', type: 'Feed', thumb: null, status: 'QUEUED' },
            ].map(({ client, platform, time, type, thumb, status }) => `
              <div style="
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 10px;
              ">
                <!-- Thumbnail ou placeholder -->
                <div style="
                  width: 40px; height: 40px;
                  border-radius: 8px;
                  background: ${thumb ? 'transparent' : '#1e293b'};
                  overflow: hidden;
                  flex-shrink: 0;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 1.25rem;
                ">
                  ${thumb ? `<img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" />` : '🖼️'}
                </div>

                <!-- Info -->
                <div style="flex: 1; min-width: 0;">
                  <div style="color: #ffffff; font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${client}</div>
                  <div style="color: #64748b; font-size: 0.7rem;">${type} · ${platform}</div>
                </div>

                <!-- Time -->
                <div style="text-align: right; flex-shrink: 0;">
                  <div style="color: #94a3b8; font-size: 0.8rem; font-weight: 600; font-family: 'Fira Code', monospace;">${time}</div>
                  <span style="
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 0.1rem 0.4rem;
                    border-radius: 4px;
                    ${status === 'PROCESSING'
                      ? 'background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2);'
                      : 'background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2);'
                    }
                  ">${status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `,
};

// ─── Content Card ──────────────────────────────────────────────────────────
export const ContentCard = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Content Cards</h1>
      <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem;">Usados no gerenciamento de conteúdo para representar tarefas e grupos.</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">

        <!-- Task Card -->
        <div style="${baseCard} cursor: pointer; transition: all 0.2s;">
          <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="
              width: 10px; height: 10px; border-radius: 50%;
              background: #3b82f6; flex-shrink: 0; margin-top: 4px;
            "></div>
            <div style="flex: 1;">
              <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">Post Feed Fenix Performance — Semana 17</div>
              <div style="color: #64748b; font-size: 0.75rem;">Criação de conteúdo · Briefing aprovado</div>
            </div>
            <div style="
              background: rgba(59,130,246,0.12);
              color: #60a5fa;
              font-size: 0.65rem;
              font-weight: 700;
              padding: 0.15rem 0.5rem;
              border-radius: 4px;
              white-space: nowrap;
            ">Em Andamento</div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="display: flex; gap: 0.25rem;">
                ${['J', 'H', 'E'].map(i => `
                  <div style="
                    width: 24px; height: 24px; border-radius: 50%;
                    background: linear-gradient(135deg, #10b981, #0d9488);
                    display: flex; align-items: center; justify-content: center;
                    color: #ffffff; font-size: 0.65rem; font-weight: 700;
                    border: 2px solid #0f172a;
                    margin-left: -6px;
                  ">${i}</div>
                `).join('')}
              </div>
              <span style="color: #64748b; font-size: 0.75rem;">3 responsáveis</span>
            </div>
            <span style="color: #64748b; font-size: 0.75rem;">📅 23/04</span>
          </div>
        </div>

        <!-- Completed Task Card -->
        <div style="${baseCard} opacity: 0.75;">
          <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="
              width: 10px; height: 10px; border-radius: 50%;
              background: #10b981; flex-shrink: 0; margin-top: 4px;
            "></div>
            <div style="flex: 1;">
              <div style="color: #94a3b8; font-size: 0.875rem; font-weight: 500; text-decoration: line-through; margin-bottom: 0.25rem;">Relatório Mensal Alpha — Março</div>
              <div style="color: #64748b; font-size: 0.75rem;">Concluído em 15/04/2026</div>
            </div>
            <div style="
              background: rgba(16,185,129,0.12);
              color: #10b981;
              font-size: 0.65rem;
              font-weight: 700;
              padding: 0.15rem 0.5rem;
              border-radius: 4px;
            ">Publicado</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="color: #64748b; font-size: 0.75rem;">✓ Concluído</span>
            <span style="color: #10b981; font-size: 0.75rem;">📤 IG + FB</span>
          </div>
        </div>

        <!-- Overdue Card -->
        <div style="${baseCard} border-color: rgba(239,68,68,0.25);">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: #ef4444; border-radius: 16px 16px 0 0;"></div>
          <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="
              width: 10px; height: 10px; border-radius: 50%;
              background: #ef4444; flex-shrink: 0; margin-top: 4px;
            "></div>
            <div style="flex: 1;">
              <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">Stories Semana 16 — ATRASADO</div>
              <div style="color: #f87171; font-size: 0.75rem;">⚠️ Venceu há 2 dias</div>
            </div>
            <div style="
              background: rgba(239,68,68,0.12);
              color: #f87171;
              font-size: 0.65rem;
              font-weight: 700;
              padding: 0.15rem 0.5rem;
              border-radius: 4px;
            ">Atrasado</div>
          </div>
          <div style="
            background: rgba(239,68,68,0.06);
            border: 1px solid rgba(239,68,68,0.15);
            border-radius: 8px;
            padding: 0.5rem 0.75rem;
            color: #f87171;
            font-size: 0.75rem;
          ">Venceu em 16/04 · Aguardando aprovação do briefing</div>
        </div>

      </div>
    </div>
  `,
};

// ─── Chart Card ────────────────────────────────────────────────────────────
export const ChartCard = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Chart Cards</h1>

      <div style="max-width: 600px;">
        <div style="${baseCard}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
            <div>
              <div style="color: #ffffff; font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">Performance de Publicações</div>
              <div style="color: #64748b; font-size: 0.75rem;">Últimos 7 dias · Posts publicados</div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${['7D', '30D', '90D'].map((p, i) => `
                <button style="
                  background: ${i === 0 ? 'rgba(16,185,129,0.15)' : 'transparent'};
                  border: 1px solid ${i === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'};
                  color: ${i === 0 ? '#10b981' : '#64748b'};
                  font-size: 0.7rem;
                  font-weight: 600;
                  padding: 0.25rem 0.6rem;
                  border-radius: 6px;
                  cursor: pointer;
                ">${p}</button>
              `).join('')}
            </div>
          </div>

          <!-- Fake chart bars -->
          <div style="display: flex; align-items: flex-end; gap: 0.5rem; height: 120px; margin-bottom: 0.75rem;">
            ${[14, 22, 18, 31, 25, 28, 47].map((val, i) => `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <div style="
                  width: 100%;
                  height: ${(val / 47) * 100}px;
                  background: ${i === 6 ? 'linear-gradient(180deg, #10b981, #0d9488)' : 'rgba(16,185,129,0.2)'};
                  border-radius: 6px 6px 0 0;
                  position: relative;
                  transition: all 0.2s;
                ">
                  ${i === 6 ? `<div style="
                    position: absolute; top: -24px; left: 50%; transform: translateX(-50%);
                    background: #10b981; color: #020617;
                    font-size: 0.65rem; font-weight: 800;
                    padding: 0.15rem 0.4rem; border-radius: 4px;
                    white-space: nowrap;
                  ">${val}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, i) => `
              <div style="flex: 1; text-align: center; color: ${i === 6 ? '#10b981' : '#64748b'}; font-size: 0.65rem; font-weight: ${i === 6 ? '700' : '400'};">${d}</div>
            `).join('')}
          </div>

          <!-- Legenda -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.06);">
            ${[
              { label: 'Total semana', value: '185', color: '#10b981' },
              { label: 'Média/dia', value: '26.4', color: '#3b82f6' },
              { label: 'Melhor dia', value: '47', color: '#f59e0b' },
            ].map(({ label, value, color }) => `
              <div style="text-align: center;">
                <div style="color: ${color}; font-size: 1.25rem; font-weight: 800;">${value}</div>
                <div style="color: #64748b; font-size: 0.7rem;">${label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `,
};

// ─── Alert Card ────────────────────────────────────────────────────────────
export const AlertCards = {
  render: () => `
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Alert Cards — Notificações e Status</h1>

      <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 560px;">

        ${[
          {
            type: 'success', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)',
            title: 'Post publicado com sucesso',
            body: 'Fenix Performance · Instagram Feed · Publicado às 14:03',
          },
          {
            type: 'warning', icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)',
            title: 'Post em fila há mais de 5 minutos',
            body: 'Alpha Assessoria · Facebook · Na fila desde 13:45 — verifique o processador',
          },
          {
            type: 'error', icon: '🚨', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)',
            title: 'Falha na publicação — ação necessária',
            body: 'Fenix Performance · IG Stories · Erro: "Media upload failed". Tente novamente.',
          },
          {
            type: 'info', icon: 'ℹ️', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)',
            title: 'Relatório mensal disponível',
            body: 'O relatório de Abril 2026 foi gerado por João e está pronto para revisão.',
          },
        ].map(({ icon, color, bg, border, title, body }) => `
          <div style="
            background: ${bg};
            border: 1px solid ${border};
            border-radius: 12px;
            padding: 1rem 1.25rem;
            display: flex;
            align-items: flex-start;
            gap: 0.875rem;
          ">
            <span style="font-size: 1.25rem; flex-shrink: 0; margin-top: 0.1rem;">${icon}</span>
            <div style="flex: 1;">
              <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.2rem;">${title}</div>
              <div style="color: #94a3b8; font-size: 0.8rem; line-height: 1.5;">${body}</div>
            </div>
            <button style="
              background: transparent;
              border: none;
              color: #64748b;
              font-size: 1rem;
              cursor: pointer;
              flex-shrink: 0;
              padding: 0;
              line-height: 1;
            ">×</button>
          </div>
        `).join('')}
      </div>
    </div>
  `,
};

// ─── Dashboard completo (composição) ──────────────────────────────────────
export const DashboardPreview = {
  render: () => `
    <div style="padding: 2rem; background: #020617; min-height: 100vh; font-family: 'Inter', sans-serif;">

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <div style="color: #10b981; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">ESCRITÓRIO VIRTUAL</div>
          <div style="color: #ffffff; font-size: 1.5rem; font-weight: 800;">Executive Performance</div>
          <div style="color: #64748b; font-size: 0.75rem;">Abril 2026 · Dados em tempo real</div>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <div style="
            background: rgba(16,185,129,0.12);
            border: 1px solid rgba(16,185,129,0.2);
            color: #10b981;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.4rem 1rem;
            border-radius: 8px;
          ">● Ao vivo</div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        ${[
          { label: 'Clientes Fenix', value: '26', delta: '+4', icon: '🏢', color: '#10b981', pct: 72 },
          { label: 'Clientes Alpha', value: '10', delta: '+2', icon: '🔵', color: '#3b82f6', pct: 50 },
          { label: 'Pendentes', value: '36', delta: 'urgente', icon: '⏳', color: '#f59e0b', pct: 85 },
          { label: 'Enviados', value: '142', delta: '+18', icon: '✅', color: '#10b981', pct: 89 },
        ].map(({ label, value, delta, icon, color, pct }) => `
          <div style="${baseCard}">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
              <span style="font-size: 1.5rem;">${icon}</span>
              <span style="color: ${color}; font-size: 0.7rem; font-weight: 700;">${delta}</span>
            </div>
            <div style="color: #ffffff; font-size: 1.875rem; font-weight: 800; letter-spacing: -0.02em;">${value}</div>
            <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.75rem;">${label}</div>
            <div style="height: 3px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 100px;"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Bottom grid -->
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 1rem;">
        <!-- Chart Card -->
        <div style="${baseCard}">
          <div style="color: #ffffff; font-weight: 700; margin-bottom: 0.5rem;">Performance de Publicações</div>
          <div style="color: #64748b; font-size: 0.75rem; margin-bottom: 1.5rem;">Posts publicados · Últimos 7 dias</div>
          <div style="display: flex; align-items: flex-end; gap: 0.5rem; height: 100px;">
            ${[14, 22, 18, 31, 25, 28, 47].map((val, i) => `
              <div style="flex: 1; height: ${(val / 47) * 100}%; background: ${i === 6 ? 'linear-gradient(180deg, #10b981, #0d9488)' : 'rgba(16,185,129,0.2)'}; border-radius: 4px 4px 0 0;"></div>
            `).join('')}
          </div>
          <div style="display: flex; margin-top: 0.5rem;">
            ${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d, i) => `<div style="flex: 1; text-align: center; color: ${i === 6 ? '#10b981' : '#64748b'}; font-size: 0.65rem;">${d}</div>`).join('')}
          </div>
        </div>

        <!-- Próximos Posts -->
        <div style="${baseCard}">
          <div style="color: #ffffff; font-weight: 700; margin-bottom: 1rem;">Próximos Posts</div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${[
              { client: 'Fenix Perf.', platform: 'IG', time: '14:00', status: 'QUEUED' },
              { client: 'Alpha Assessoria', platform: 'FB', time: '15:30', status: 'QUEUED' },
              { client: 'Fenix Perf.', platform: 'IG+FB', time: '18:00', status: 'PROCESSING' },
            ].map(({ client, platform, time, status }) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                <div>
                  <div style="color: #ffffff; font-size: 0.75rem; font-weight: 600;">${client}</div>
                  <div style="color: #64748b; font-size: 0.65rem;">${platform}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: #94a3b8; font-size: 0.75rem; font-family: monospace;">${time}</div>
                  <span style="
                    font-size: 0.6rem; font-weight: 700;
                    padding: 0.1rem 0.35rem; border-radius: 3px;
                    ${status === 'PROCESSING' ? 'background: rgba(245,158,11,0.15); color: #fbbf24;' : 'background: rgba(59,130,246,0.15); color: #60a5fa;'}
                  ">${status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `,
};
