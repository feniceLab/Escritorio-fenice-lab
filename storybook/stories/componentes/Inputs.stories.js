export default {
  title: 'Starkën Design System/Componentes/Inputs & Formulários',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Campos de formulário, selects, checkboxes, toggles e outros controles de entrada de dados. Base visual do Escritório Virtual.',
      },
    },
  },
};

const baseInput = `
  width: 100%;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 0.625rem 0.875rem;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
`;

export const CamposDeTexto = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif; max-width: 560px;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2.5rem;">Campos de Texto</h1>

      <div style="display: flex; flex-direction: column; gap: 1.5rem;">

        <!-- Default -->
        <div>
          <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Nome do cliente <span style="color: #ef4444;">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Fenix Performance"
            style="${baseInput}"
          />
          <div style="color: #64748b; font-size: 0.75rem; margin-top: 0.375rem;">Default — esperando input</div>
        </div>

        <!-- Focused (simulado com borda verde) -->
        <div>
          <label style="display: block; color: #10b981; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Agendamento <span style="color: #ef4444;">*</span>
          </label>
          <input
            type="text"
            value="18/04/2026 14:00"
            style="${baseInput} border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12);"
          />
          <div style="color: #10b981; font-size: 0.75rem; margin-top: 0.375rem;">Focused — ativo com input</div>
        </div>

        <!-- Filled -->
        <div>
          <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Plataforma
          </label>
          <input
            type="text"
            value="Instagram + Facebook"
            style="${baseInput} border-color: rgba(255,255,255,0.2);"
          />
          <div style="color: #64748b; font-size: 0.75rem; margin-top: 0.375rem;">Filled — dado preenchido</div>
        </div>

        <!-- Error -->
        <div>
          <label style="display: block; color: #f87171; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Token de acesso <span style="color: #ef4444;">*</span>
          </label>
          <input
            type="text"
            value="EAAInvalid..."
            style="${baseInput} border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1);"
          />
          <div style="color: #f87171; font-size: 0.75rem; margin-top: 0.375rem; display: flex; align-items: center; gap: 0.35rem;">
            ⚠️ Token inválido — verifique as permissões da conta
          </div>
        </div>

        <!-- Success -->
        <div>
          <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            E-mail
          </label>
          <input
            type="email"
            value="joao@starken.com"
            style="${baseInput} border-color: #10b981; padding-right: 2.5rem;"
          />
          <div style="color: #10b981; font-size: 0.75rem; margin-top: 0.375rem; display: flex; align-items: center; gap: 0.35rem;">
            ✓ E-mail válido e verificado
          </div>
        </div>

        <!-- Disabled -->
        <div>
          <label style="display: block; color: #475569; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            ID da conta (somente leitura)
          </label>
          <input
            type="text"
            value="usr_01HXYZ123456"
            disabled
            style="${baseInput} border-color: rgba(255,255,255,0.06); color: #475569; background: rgba(255,255,255,0.02); cursor: not-allowed;"
          />
          <div style="color: #475569; font-size: 0.75rem; margin-top: 0.375rem;">Disabled — somente leitura</div>
        </div>

        <!-- Textarea -->
        <div>
          <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Copy do post
          </label>
          <textarea
            style="${baseInput} height: 100px; resize: vertical; line-height: 1.6;"
            placeholder="Escreva o copy da publicação..."
          ></textarea>
          <div style="display: flex; justify-content: space-between; margin-top: 0.375rem;">
            <span style="color: #64748b; font-size: 0.75rem;">Máximo: 2200 caracteres (Instagram)</span>
            <span style="color: #64748b; font-size: 0.75rem;">0 / 2200</span>
          </div>
        </div>

      </div>
    </div>
  `,
};

export const SelectsEDropdowns = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif; max-width: 560px;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2.5rem;">Selects & Dropdowns</h1>

      <div style="display: flex; flex-direction: column; gap: 1.5rem;">

        <!-- Select padrão -->
        <div>
          <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Plataforma
          </label>
          <div style="position: relative;">
            <select style="
              ${baseInput}
              appearance: none;
              cursor: pointer;
              padding-right: 2.5rem;
            ">
              <option value="">Selecione uma plataforma</option>
              <option value="ig" selected>Instagram</option>
              <option value="fb">Facebook</option>
              <option value="both">Instagram + Facebook</option>
            </select>
            <div style="position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none;">▼</div>
          </div>
        </div>

        <!-- Select de status -->
        <div>
          <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Status da tarefa
          </label>
          <div style="position: relative;">
            <select style="${baseInput} appearance: none; cursor: pointer; padding-right: 2.5rem; border-color: rgba(59,130,246,0.4);">
              <option>A Fazer</option>
              <option selected>Em Andamento</option>
              <option>Em Revisão</option>
              <option>Aprovado</option>
              <option>Agendado</option>
              <option>Publicado</option>
            </select>
            <div style="
              position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%);
              width: 8px; height: 8px; border-radius: 50%;
              background: #3b82f6;
              pointer-events: none;
            "></div>
          </div>
        </div>

        <!-- Multi-select visual (custom) -->
        <div>
          <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Responsáveis
          </label>
          <div style="
            ${baseInput}
            padding: 0.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
            min-height: 44px;
          ">
            ${['Juan', 'Henrique'].map(name => `
              <span style="
                display: inline-flex; align-items: center; gap: 0.35rem;
                background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
                color: #10b981; font-size: 0.75rem; font-weight: 600;
                padding: 0.2rem 0.5rem 0.2rem 0.35rem; border-radius: 6px;
              ">
                <span style="width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #0d9488); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.6rem; font-weight: 700;">${name[0]}</span>
                ${name}
                <span style="cursor: pointer; opacity: 0.7; font-size: 0.875rem;">×</span>
              </span>
            `).join('')}
            <input style="border: none; background: transparent; color: #94a3b8; font-size: 0.875rem; outline: none; flex: 1; min-width: 80px;" placeholder="Adicionar..." />
          </div>
        </div>

      </div>
    </div>
  `,
};

export const CheckboxesEToggles = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif; max-width: 560px;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2.5rem;">Checkboxes, Radios & Toggles</h1>

      <div style="display: flex; flex-direction: column; gap: 2.5rem;">

        <!-- Checkboxes -->
        <div>
          <div style="color: #ffffff; font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Checkboxes</div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${[
              { label: 'Publicar no Instagram', checked: true },
              { label: 'Publicar no Facebook', checked: true },
              { label: 'Salvar no histórico', checked: false },
              { label: 'Enviar notificação ao cliente', checked: false, disabled: true },
            ].map(({ label, checked, disabled }) => `
              <label style="display: flex; align-items: center; gap: 0.75rem; cursor: ${disabled ? 'not-allowed' : 'pointer'}; opacity: ${disabled ? 0.4 : 1};">
                <div style="
                  width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
                  ${checked
                    ? 'background: #10b981; border: 2px solid #10b981; display: flex; align-items: center; justify-content: center;'
                    : 'background: transparent; border: 2px solid rgba(255,255,255,0.2);'
                  }
                ">${checked ? '<span style="color: #020617; font-size: 0.7rem; font-weight: 900; line-height: 1;">✓</span>' : ''}</div>
                <span style="color: ${disabled ? '#475569' : checked ? '#ffffff' : '#94a3b8'}; font-size: 0.875rem;">${label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Radios -->
        <div>
          <div style="color: #ffffff; font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Radio Buttons</div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${[
              { label: 'Publicar agora', desc: 'Publica imediatamente', selected: false },
              { label: 'Agendar publicação', desc: 'Escolha data e horário', selected: true },
              { label: 'Salvar como rascunho', desc: 'Não publica ainda', selected: false },
            ].map(({ label, desc, selected }) => `
              <label style="
                display: flex; align-items: flex-start; gap: 0.875rem;
                padding: 0.875rem 1rem;
                background: ${selected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)'};
                border: 1px solid ${selected ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'};
                border-radius: 10px; cursor: pointer;
              ">
                <div style="
                  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
                  ${selected
                    ? 'border: 5px solid #10b981; background: #020617;'
                    : 'border: 2px solid rgba(255,255,255,0.2); background: transparent;'
                  }
                "></div>
                <div>
                  <div style="color: #ffffff; font-size: 0.875rem; font-weight: 500;">${label}</div>
                  <div style="color: #64748b; font-size: 0.75rem;">${desc}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Toggles -->
        <div>
          <div style="color: #ffffff; font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Toggles</div>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${[
              { label: 'Notificações ativas', desc: 'Receber alertas de publicação', on: true },
              { label: 'Modo escuro', desc: 'Interface em tema escuro', on: true },
              { label: 'Auto-publicar', desc: 'Publicar automaticamente na fila', on: false },
              { label: 'Modo manutenção', desc: 'Pausar todas as publicações', on: false, danger: true },
            ].map(({ label, desc, on, danger }) => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                <div>
                  <div style="color: #ffffff; font-size: 0.875rem; font-weight: 500;">${label}</div>
                  <div style="color: #64748b; font-size: 0.75rem;">${desc}</div>
                </div>
                <div style="
                  width: 44px; height: 24px; border-radius: 100px; flex-shrink: 0;
                  background: ${on ? (danger ? '#ef4444' : '#10b981') : 'rgba(255,255,255,0.1)'};
                  position: relative; cursor: pointer; transition: all 0.2s;
                ">
                  <div style="
                    width: 18px; height: 18px; border-radius: 50%;
                    background: #ffffff;
                    position: absolute; top: 3px;
                    left: ${on ? '23px' : '3px'};
                    transition: left 0.2s;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  "></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `,
};

export const FormCompleto = {
  render: () => `
    <div style="padding: 2rem; font-family: 'Inter', sans-serif; max-width: 600px;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem;">Formulário Completo</h1>
      <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem;">Exemplo real: formulário de agendamento de post.</p>

      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #ffffff; font-size: 1rem; font-weight: 700; margin-bottom: 1.5rem;">Novo Agendamento</div>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <!-- Cliente -->
          <div>
            <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">Cliente *</label>
            <div style="position: relative;">
              <select style="${baseInput} appearance: none; padding-right: 2.5rem; cursor: pointer;">
                <option>Fenix Performance</option>
                <option>Alpha Assessoria</option>
              </select>
              <div style="position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; font-size: 0.75rem;">▼</div>
            </div>
          </div>

          <!-- Plataforma -->
          <div>
            <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">Plataforma *</label>
            <div style="display: flex; gap: 0.75rem;">
              ${[
                { icon: '📸', label: 'Instagram', active: true, color: '#e1306c' },
                { icon: '📘', label: 'Facebook', active: true, color: '#1877f2' },
                { icon: '🎵', label: 'TikTok', active: false, color: '#010101' },
              ].map(({ icon, label, active, color }) => `
                <label style="
                  flex: 1; padding: 0.75rem;
                  background: ${active ? color + '18' : 'rgba(255,255,255,0.03)'};
                  border: 1px solid ${active ? color + '50' : 'rgba(255,255,255,0.06)'};
                  border-radius: 10px; cursor: pointer; text-align: center;
                ">
                  <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">${icon}</div>
                  <div style="color: ${active ? '#ffffff' : '#64748b'}; font-size: 0.75rem; font-weight: ${active ? 600 : 400};">${label}</div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Tipo + Data+Hora (grid) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">Tipo</label>
              <div style="position: relative;">
                <select style="${baseInput} appearance: none; padding-right: 2.5rem; cursor: pointer;">
                  <option>Feed</option>
                  <option>Stories</option>
                  <option>Reels</option>
                  <option>Carrossel</option>
                </select>
                <div style="position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; font-size: 0.75rem;">▼</div>
              </div>
            </div>
            <div>
              <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">Data & Hora *</label>
              <input type="text" value="18/04/2026 14:00" style="${baseInput} border-color: rgba(16,185,129,0.4);" />
            </div>
          </div>

          <!-- Copy -->
          <div>
            <label style="display: block; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">Copy do Post</label>
            <textarea style="${baseInput} height: 80px; resize: vertical; line-height: 1.6;" placeholder="Escreva o copy aqui...">Transforme seus resultados com a Starkën! ✨ #MarketingDigital #Resultados</textarea>
            <div style="display: flex; justify-content: flex-end; margin-top: 0.25rem; color: #64748b; font-size: 0.75rem;">87 / 2200</div>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 0.75rem; padding-top: 0.5rem;">
            <button style="
              flex: 1;
              background: linear-gradient(135deg, #10b981, #0d9488);
              color: #ffffff; font-weight: 700; font-size: 0.875rem;
              padding: 0.75rem 1.5rem; border: none; border-radius: 10px; cursor: pointer;
            ">📅 Agendar Publicação</button>
            <button style="
              background: transparent;
              color: #94a3b8; font-weight: 500; font-size: 0.875rem;
              padding: 0.75rem 1.25rem;
              border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer;
            ">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
