export default {
  title: 'Starkën Design System/Padrões/Tabelas',
  parameters: {
    docs: {
      description: {
        component: 'Padrões de tabela usados no Escritório Virtual. Histórico de publicações, filas, relatórios de performance.',
      },
    },
  },
};

export const TabelaPublicacoes = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem;">Tabela de Publicações</h1>
      <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem;">Baseada em publish_history — usada no histórico e relatórios.</p>

      <div style="background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
        <!-- Toolbar -->
        <div style="
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        ">
          <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600;">
            Histórico de Publicações
            <span style="color: #64748b; font-weight: 400; margin-left: 0.5rem;">142 registros</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.75rem; padding: 0.35rem 0.75rem; border-radius: 7px; cursor: pointer;">Exportar CSV</button>
            <button style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #10b981; font-size: 0.75rem; padding: 0.35rem 0.75rem; border-radius: 7px; cursor: pointer;">+ Novo Post</button>
          </div>
        </div>

        <!-- Table -->
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; min-width: 700px;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <th style="width: 32px; padding: 0.75rem 1rem;">
                  <div style="width: 16px; height: 16px; border-radius: 4px; border: 2px solid rgba(255,255,255,0.15);"></div>
                </th>
                ${['Cliente', 'Plataforma', 'Tipo', 'Data/Hora', 'Status', 'Ações'].map((h, i) => `
                  <th style="
                    color: #64748b; font-size: 0.7rem; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    padding: 0.75rem 1rem; text-align: left;
                    cursor: ${i < 5 ? 'pointer' : 'default'};
                  ">${h}${i < 5 ? ' ↕' : ''}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${[
                { client: 'Fenix Performance', platform: 'IG',    type: 'Feed',      date: '18/04 14:03', status: 'PUBLISHED',  statusColor: '#10b981', selected: false },
                { client: 'Fenix Performance', platform: 'FB',    type: 'Carrossel', date: '18/04 14:03', status: 'PUBLISHED',  statusColor: '#10b981', selected: false },
                { client: 'Alpha Assessoria',    platform: 'IG+FB', type: 'Stories',   date: '18/04 15:30', status: 'QUEUED',     statusColor: '#3b82f6', selected: true  },
                { client: 'Alpha Assessoria',    platform: 'IG',    type: 'Reels',     date: '18/04 18:00', status: 'PROCESSING', statusColor: '#f59e0b', selected: false },
                { client: 'Fenix Performance', platform: 'FB',    type: 'Feed',      date: '17/04 09:00', status: 'FAILED',     statusColor: '#ef4444', selected: false },
              ].map(({ client, platform, type, date, status, statusColor, selected }) => `
                <tr style="
                  border-bottom: 1px solid rgba(255,255,255,0.04);
                  background: ${selected ? 'rgba(16,185,129,0.04)' : 'transparent'};
                  transition: background 0.15s;
                ">
                  <td style="padding: 0.875rem 1rem;">
                    <div style="
                      width: 16px; height: 16px; border-radius: 4px; cursor: pointer;
                      ${selected
                        ? 'background: #10b981; border: 2px solid #10b981; display: flex; align-items: center; justify-content: center;'
                        : 'border: 2px solid rgba(255,255,255,0.15);'
                      }
                    ">${selected ? '<span style="color: #020617; font-size: 0.6rem; font-weight: 900;">✓</span>' : ''}</div>
                  </td>
                  <td style="padding: 0.875rem 1rem; color: #ffffff; font-size: 0.875rem; font-weight: 500;">${client}</td>
                  <td style="padding: 0.875rem 1rem;">
                    <span style="color: #94a3b8; font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: 4px;">${platform}</span>
                  </td>
                  <td style="padding: 0.875rem 1rem; color: #94a3b8; font-size: 0.8rem;">${type}</td>
                  <td style="padding: 0.875rem 1rem; color: #64748b; font-size: 0.8rem; font-family: 'Fira Code', monospace;">${date}</td>
                  <td style="padding: 0.875rem 1rem;">
                    <span style="
                      display: inline-flex; align-items: center; gap: 0.35rem;
                      background: ${statusColor}18; border: 1px solid ${statusColor}40;
                      color: ${statusColor}; font-size: 0.7rem; font-weight: 700;
                      padding: 0.2rem 0.6rem; border-radius: 100px;
                    ">
                      <span style="width: 5px; height: 5px; border-radius: 50%; background: ${statusColor};"></span>
                      ${status}
                    </span>
                  </td>
                  <td style="padding: 0.875rem 1rem;">
                    <div style="display: flex; gap: 0.5rem;">
                      <button style="background: transparent; border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; cursor: pointer;">👁</button>
                      <button style="background: transparent; border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; cursor: pointer;">✏️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div style="
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        ">
          <span style="color: #64748b; font-size: 0.75rem;">Mostrando 1–5 de 142</span>
          <div style="display: flex; gap: 0.35rem;">
            ${['←', '1', '2', '3', '...', '29', '→'].map((p, i) => `
              <button style="
                min-width: 30px; height: 30px;
                background: ${p === '1' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)'};
                border: 1px solid ${p === '1' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'};
                color: ${p === '1' ? '#10b981' : '#94a3b8'};
                font-size: 0.75rem; font-weight: ${p === '1' ? 700 : 400};
                border-radius: 6px; cursor: pointer; padding: 0 0.4rem;
              ">${p}</button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `,
};

export const TabelaVazia = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif; max-width: 700px;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Empty State — Tabela Vazia</h1>

      <div style="background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
        <div style="padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600;">Histórico de Publicações</div>
        </div>
        <div style="padding: 4rem 2rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
          <div style="color: #ffffff; font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">Nenhuma publicação encontrada</div>
          <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; max-width: 300px; margin-left: auto; margin-right: auto;">
            Não há publicações no período selecionado. Ajuste os filtros ou agende o primeiro post.
          </div>
          <button style="
            background: linear-gradient(135deg, #10b981, #0d9488);
            color: #ffffff; font-size: 0.875rem; font-weight: 700;
            padding: 0.625rem 1.5rem; border: none; border-radius: 10px; cursor: pointer;
          ">+ Agendar Publicação</button>
        </div>
      </div>
    </div>
  `,
};
