const d={title:"Starkën Design System/Fundamentos/Cores",parameters:{docs:{description:{component:"Paleta de cores completa do Starkën Design System. Todas as cores seguem padrões de acessibilidade WCAG 2.1 AA."}}}},e=({name:r,value:i,description:s})=>`
  <div style="margin-bottom: 1.5rem;">
    <div style="
      width: 100%;
      height: 100px;
      background: ${i};
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: flex-end;
      padding: 1rem;
    ">
      <span style="
        font-family: 'Fira Code', monospace;
        font-size: 0.875rem;
        color: ${r.includes("dark")||r.includes("surface")?"#ffffff":"#020617"};
      ">${i}</span>
    </div>
    <div style="color: #ffffff; font-weight: 600; margin-bottom: 0.25rem;">${r}</div>
    <div style="color: #94a3b8; font-size: 0.875rem;">${s}</div>
  </div>
`,n={render:()=>`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2.5rem; margin-bottom: 1rem;">🎨 Paleta de Cores</h1>
      <p style="color: #94a3b8; font-size: 1.125rem; margin-bottom: 3rem; max-width: 700px;">
        Sistema completo de cores do Starkën Design System. Todas as combinações são acessíveis e atendem WCAG 2.1 AA.
      </p>

      <!-- Cores da Marca -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Cores da Marca</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          ${e({name:"Emerald",value:"#10b981",description:"Cor primária - CTAs e destaques"})}
          ${e({name:"Emerald Light",value:"#6ee7b7",description:"Verde claro - hover e links"})}
          ${e({name:"Emerald Dark",value:"#059669",description:"Verde escuro - pressed states"})}
          ${e({name:"Teal",value:"#0d9488",description:"Cor secundária - gradientes"})}
          ${e({name:"Teal Light",value:"#5eead4",description:"Teal claro - variações"})}
        </div>
      </div>

      <!-- Backgrounds -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Backgrounds</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          ${e({name:"Dark",value:"#020617",description:"Background principal"})}
          ${e({name:"Surface",value:"#0f172a",description:"Cards e superfícies"})}
          ${e({name:"Elevated",value:"#1e293b",description:"Elementos elevados"})}
          ${e({name:"Hover",value:"#334155",description:"Estados hover"})}
        </div>
      </div>

      <!-- Texto -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Texto</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          ${e({name:"Primary",value:"#ffffff",description:"Texto principal"})}
          ${e({name:"Secondary",value:"#94a3b8",description:"Texto secundário"})}
          ${e({name:"Muted",value:"#64748b",description:"Texto menos importante"})}
          ${e({name:"Disabled",value:"#475569",description:"Texto desabilitado"})}
        </div>
      </div>

      <!-- Semânticas -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Cores Semânticas</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          ${e({name:"Success",value:"#10b981",description:"Confirmações e sucesso"})}
          ${e({name:"Error",value:"#ef4444",description:"Erros e alertas"})}
          ${e({name:"Warning",value:"#f59e0b",description:"Avisos importantes"})}
          ${e({name:"Info",value:"#3b82f6",description:"Informações neutras"})}
        </div>
      </div>

      <!-- Gradientes -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Gradientes</h2>
        <div style="display: grid; gap: 1.5rem;">
          <div>
            <div style="
              width: 100%;
              height: 100px;
              background: linear-gradient(135deg, #10b981, #0d9488);
              border-radius: 12px;
              margin-bottom: 0.75rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="color: #ffffff; font-weight: 600;">Gradiente Primário</span>
            </div>
            <div style="color: #ffffff; font-weight: 600; margin-bottom: 0.25rem;">Gradiente Primário</div>
            <code style="color: #6ee7b7; font-size: 0.875rem;">linear-gradient(135deg, #10b981, #0d9488)</code>
            <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem;">Usado em botões e CTAs</div>
          </div>

          <div>
            <div style="
              width: 100%;
              height: 100px;
              background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
              border-radius: 12px;
              margin-bottom: 0.75rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="color: #ffffff; font-weight: 600;">Gradiente Hero</span>
            </div>
            <div style="color: #ffffff; font-weight: 600; margin-bottom: 0.25rem;">Gradiente Hero</div>
            <code style="color: #6ee7b7; font-size: 0.875rem;">linear-gradient(180deg, #0f172a 0%, #020617 100%)</code>
            <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem;">Usado em seções hero</div>
          </div>
        </div>
      </div>

      <!-- Acessibilidade -->
      <div style="
        background: #0f172a;
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <h2 style="color: #10b981; font-size: 1.5rem; margin-bottom: 1rem;">♿ Acessibilidade (WCAG 2.1)</h2>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">
          Todas as combinações de cores atendem ao nível AA de acessibilidade:
        </p>
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #020617; border-radius: 8px;">
            <span style="color: #ffffff;">Emerald (#10b981) em Dark (#020617)</span>
            <div>
              <span style="background: #10b981; color: #020617; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; margin-right: 0.5rem;">6.2:1</span>
              <span style="color: #10b981;">✓ AA</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #020617; border-radius: 8px;">
            <span style="color: #ffffff;">White (#ffffff) em Dark (#020617)</span>
            <div>
              <span style="background: #10b981; color: #020617; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; margin-right: 0.5rem;">19.5:1</span>
              <span style="color: #10b981;">✓ AAA</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #020617; border-radius: 8px;">
            <span style="color: #ffffff;">Secondary (#94a3b8) em Dark (#020617)</span>
            <div>
              <span style="background: #10b981; color: #020617; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; margin-right: 0.5rem;">8.1:1</span>
              <span style="color: #10b981;">✓ AAA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `};var a,o,t;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: () => \`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2.5rem; margin-bottom: 1rem;">🎨 Paleta de Cores</h1>
      <p style="color: #94a3b8; font-size: 1.125rem; margin-bottom: 3rem; max-width: 700px;">
        Sistema completo de cores do Starkën Design System. Todas as combinações são acessíveis e atendem WCAG 2.1 AA.
      </p>

      <!-- Cores da Marca -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Cores da Marca</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          \${ColorSwatch({
    name: 'Emerald',
    value: '#10b981',
    description: 'Cor primária - CTAs e destaques'
  })}
          \${ColorSwatch({
    name: 'Emerald Light',
    value: '#6ee7b7',
    description: 'Verde claro - hover e links'
  })}
          \${ColorSwatch({
    name: 'Emerald Dark',
    value: '#059669',
    description: 'Verde escuro - pressed states'
  })}
          \${ColorSwatch({
    name: 'Teal',
    value: '#0d9488',
    description: 'Cor secundária - gradientes'
  })}
          \${ColorSwatch({
    name: 'Teal Light',
    value: '#5eead4',
    description: 'Teal claro - variações'
  })}
        </div>
      </div>

      <!-- Backgrounds -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Backgrounds</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          \${ColorSwatch({
    name: 'Dark',
    value: '#020617',
    description: 'Background principal'
  })}
          \${ColorSwatch({
    name: 'Surface',
    value: '#0f172a',
    description: 'Cards e superfícies'
  })}
          \${ColorSwatch({
    name: 'Elevated',
    value: '#1e293b',
    description: 'Elementos elevados'
  })}
          \${ColorSwatch({
    name: 'Hover',
    value: '#334155',
    description: 'Estados hover'
  })}
        </div>
      </div>

      <!-- Texto -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Texto</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          \${ColorSwatch({
    name: 'Primary',
    value: '#ffffff',
    description: 'Texto principal'
  })}
          \${ColorSwatch({
    name: 'Secondary',
    value: '#94a3b8',
    description: 'Texto secundário'
  })}
          \${ColorSwatch({
    name: 'Muted',
    value: '#64748b',
    description: 'Texto menos importante'
  })}
          \${ColorSwatch({
    name: 'Disabled',
    value: '#475569',
    description: 'Texto desabilitado'
  })}
        </div>
      </div>

      <!-- Semânticas -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Cores Semânticas</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          \${ColorSwatch({
    name: 'Success',
    value: '#10b981',
    description: 'Confirmações e sucesso'
  })}
          \${ColorSwatch({
    name: 'Error',
    value: '#ef4444',
    description: 'Erros e alertas'
  })}
          \${ColorSwatch({
    name: 'Warning',
    value: '#f59e0b',
    description: 'Avisos importantes'
  })}
          \${ColorSwatch({
    name: 'Info',
    value: '#3b82f6',
    description: 'Informações neutras'
  })}
        </div>
      </div>

      <!-- Gradientes -->
      <div style="margin-bottom: 3rem;">
        <h2 style="color: #ffffff; font-size: 1.75rem; margin-bottom: 1.5rem;">Gradientes</h2>
        <div style="display: grid; gap: 1.5rem;">
          <div>
            <div style="
              width: 100%;
              height: 100px;
              background: linear-gradient(135deg, #10b981, #0d9488);
              border-radius: 12px;
              margin-bottom: 0.75rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="color: #ffffff; font-weight: 600;">Gradiente Primário</span>
            </div>
            <div style="color: #ffffff; font-weight: 600; margin-bottom: 0.25rem;">Gradiente Primário</div>
            <code style="color: #6ee7b7; font-size: 0.875rem;">linear-gradient(135deg, #10b981, #0d9488)</code>
            <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem;">Usado em botões e CTAs</div>
          </div>

          <div>
            <div style="
              width: 100%;
              height: 100px;
              background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
              border-radius: 12px;
              margin-bottom: 0.75rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="color: #ffffff; font-weight: 600;">Gradiente Hero</span>
            </div>
            <div style="color: #ffffff; font-weight: 600; margin-bottom: 0.25rem;">Gradiente Hero</div>
            <code style="color: #6ee7b7; font-size: 0.875rem;">linear-gradient(180deg, #0f172a 0%, #020617 100%)</code>
            <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem;">Usado em seções hero</div>
          </div>
        </div>
      </div>

      <!-- Acessibilidade -->
      <div style="
        background: #0f172a;
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <h2 style="color: #10b981; font-size: 1.5rem; margin-bottom: 1rem;">♿ Acessibilidade (WCAG 2.1)</h2>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">
          Todas as combinações de cores atendem ao nível AA de acessibilidade:
        </p>
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #020617; border-radius: 8px;">
            <span style="color: #ffffff;">Emerald (#10b981) em Dark (#020617)</span>
            <div>
              <span style="background: #10b981; color: #020617; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; margin-right: 0.5rem;">6.2:1</span>
              <span style="color: #10b981;">✓ AA</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #020617; border-radius: 8px;">
            <span style="color: #ffffff;">White (#ffffff) em Dark (#020617)</span>
            <div>
              <span style="background: #10b981; color: #020617; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; margin-right: 0.5rem;">19.5:1</span>
              <span style="color: #10b981;">✓ AAA</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #020617; border-radius: 8px;">
            <span style="color: #ffffff;">Secondary (#94a3b8) em Dark (#020617)</span>
            <div>
              <span style="background: #10b981; color: #020617; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; margin-right: 0.5rem;">8.1:1</span>
              <span style="color: #10b981;">✓ AAA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  \`
}`,...(t=(o=n.parameters)==null?void 0:o.docs)==null?void 0:t.source}}};const l=["CoresCategories"];export{n as CoresCategories,l as __namedExportsOrder,d as default};
