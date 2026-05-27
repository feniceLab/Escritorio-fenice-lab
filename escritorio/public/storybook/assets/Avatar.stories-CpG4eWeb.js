const g={title:"Starkën Design System/Componentes/Avatar & Favicon",tags:["autodocs"],parameters:{docs:{description:{component:"Avatares circulares usando o logo oficial Starkën. Também documenta o uso como favicon em abas, PWAs e atalhos."}}}},e="./logo-fenix-tecnologia-square.png",o={name:"⭐ Favicon & Avatar Circular",render:()=>`
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
        <h1 style="color: #10b981; font-size: 1.75rem; margin: 0;">Favicon & Avatar Starkën</h1>
        <span style="
          background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35);
          color: #10b981; font-size: 0.65rem; font-weight: 700;
          padding: 0.2rem 0.6rem; border-radius: 100px; letter-spacing: 0.06em;
        ">FAVICON OFICIAL</span>
      </div>
      <p style="color: #94a3b8; margin-bottom: 2.5rem; max-width: 600px;">
        Versão redonda do logo Starkën. Usada como <strong style="color: #ffffff;">favicon oficial do Storybook</strong>,
        avatar de perfil, ícone de app e em qualquer contexto que precise de um símbolo circular.
      </p>

      <!-- Escala de tamanhos -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.5rem;">Escala de tamanhos</div>
        <div style="display: flex; align-items: flex-end; gap: 2rem; flex-wrap: wrap;">
          ${[{label:"XS",size:16,use:"Favicon tab"},{label:"SM",size:24,use:"Inline icon"},{label:"MD",size:32,use:"Navbar"},{label:"LG",size:48,use:"Card avatar"},{label:"XL",size:64,use:"Profile"},{label:"2XL",size:96,use:"Hero"},{label:"3XL",size:144,use:"Splash"}].map(({label:r,size:i,use:c})=>`
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.6rem;">
              <img
                src="${e}"
                alt="Favicon Starkën ${r}"
                width="${i}"
                height="${i}"
                style="border-radius: 50%; object-fit: cover; display: block; border: 2px solid rgba(16,185,129,0.25);"
              />
              <div style="text-align: center;">
                <code style="color: #6ee7b7; font-size: 0.65rem;">${i}px</code>
                <div style="color: #64748b; font-size: 0.65rem; margin-top: 0.1rem;">${c}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Casos de uso -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 2rem;">

        <!-- Browser tab -->
        <div style="background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #334155; padding: 0.6rem 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="${e}" width="14" height="14" style="border-radius: 50%; object-fit: cover;" />
            <span style="color: #94a3b8; font-size: 0.75rem;">Starkën Design System</span>
            <span style="color: #475569; margin-left: auto; font-size: 0.7rem;">✕</span>
          </div>
          <div style="padding: 1rem; text-align: center; color: #64748b; font-size: 0.75rem;">Aba do navegador (16px)</div>
        </div>

        <!-- Avatar usuário -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 0.875rem;">
          <img src="${e}" width="48" height="48" style="border-radius: 50%; object-fit: cover; border: 2px solid rgba(16,185,129,0.3);" />
          <div>
            <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600;">Starkën Tecnologia</div>
            <div style="color: #64748b; font-size: 0.75rem;">Perfil · 48px</div>
          </div>
        </div>

        <!-- Stack de avatares -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08);">
          <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.75rem;">Stack de responsáveis</div>
          <div style="display: flex;">
            ${[0,1,2].map(r=>`
              <img src="${e}" width="36" height="36" style="border-radius: 50%; object-fit: cover; border: 3px solid #0f172a; margin-left: ${r>0?"-10px":"0"};" />
            `).join("")}
            <div style="
              width: 36px; height: 36px; border-radius: 50%;
              background: rgba(16,185,129,0.15); border: 3px solid #0f172a;
              display: flex; align-items: center; justify-content: center;
              color: #10b981; font-size: 0.7rem; font-weight: 700;
              margin-left: -10px;
            ">+4</div>
          </div>
        </div>

        <!-- Notificação push -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: flex-start; gap: 0.75rem;">
          <img src="${e}" width="40" height="40" style="border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
          <div>
            <div style="color: #ffffff; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.15rem;">Starkën Escritório</div>
            <div style="color: #94a3b8; font-size: 0.75rem;">Post publicado com sucesso ✓</div>
            <div style="color: #64748b; font-size: 0.65rem; margin-top: 0.25rem;">agora mesmo</div>
          </div>
        </div>

        <!-- Navbar compacta -->
        <div style="background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #020617; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="${e}" width="28" height="28" style="border-radius: 50%; object-fit: cover;" />
            <span style="color: #ffffff; font-size: 0.8rem; font-weight: 700;">Escritório Virtual</span>
          </div>
          <div style="padding: 0.75rem 1rem; text-align: center; color: #64748b; font-size: 0.7rem;">Navbar — 28px</div>
        </div>

        <!-- PWA icon -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
          <img src="${e}" width="72" height="72" style="border-radius: 22%; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />
          <div style="color: #ffffff; font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem;">Starkën</div>
          <div style="color: #64748b; font-size: 0.65rem;">PWA icon · 72px</div>
        </div>
      </div>

      <!-- Código -->
      <div style="background: #0f172a; border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #10b981; font-size: 0.875rem; font-weight: 700; margin-bottom: 1rem;">📝 Como usar</div>
        <pre style="background: #020617; padding: 1rem; border-radius: 8px; margin: 0; overflow-x: auto;"><code style="color: #6ee7b7; font-size: 0.8rem; font-family: 'Fira Code', monospace;">&lt;!-- Avatar circular --&gt;
&lt;img
  src="/logo-fenix-tecnologia-square.png"
  alt="Starkën"
  width="48" height="48"
  style="border-radius: 50%; object-fit: cover;"
/&gt;

&lt;!-- Favicon no &lt;head&gt; --&gt;
&lt;link rel="icon" type="image/png"
      href="/logo-fenix-tecnologia-square.png" /&gt;</code></pre>
      </div>
    </div>
  `},a={render:()=>`
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Avatar com Status</h1>

      <div style="display: flex; gap: 2.5rem; flex-wrap: wrap; align-items: center;">
        ${[{status:"online",color:"#10b981",label:"Online"},{status:"busy",color:"#f59e0b",label:"Ocupado"},{status:"offline",color:"#64748b",label:"Offline"},{status:"dnd",color:"#ef4444",label:"Não Perturbar"}].map(({color:r,label:i})=>`
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
            <div style="position: relative;">
              <img src="${e}" width="64" height="64" style="border-radius: 50%; object-fit: cover; border: 2px solid rgba(16,185,129,0.25);" />
              <span style="
                position: absolute; bottom: 0; right: 0;
                width: 18px; height: 18px; border-radius: 50%;
                background: ${r}; border: 3px solid #020617;
              "></span>
            </div>
            <span style="color: #94a3b8; font-size: 0.75rem;">${i}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `};var t,n,s;o.parameters={...o.parameters,docs:{...(t=o.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: '⭐ Favicon & Avatar Circular',
  render: () => \`
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
        <h1 style="color: #10b981; font-size: 1.75rem; margin: 0;">Favicon & Avatar Starkën</h1>
        <span style="
          background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35);
          color: #10b981; font-size: 0.65rem; font-weight: 700;
          padding: 0.2rem 0.6rem; border-radius: 100px; letter-spacing: 0.06em;
        ">FAVICON OFICIAL</span>
      </div>
      <p style="color: #94a3b8; margin-bottom: 2.5rem; max-width: 600px;">
        Versão redonda do logo Starkën. Usada como <strong style="color: #ffffff;">favicon oficial do Storybook</strong>,
        avatar de perfil, ícone de app e em qualquer contexto que precise de um símbolo circular.
      </p>

      <!-- Escala de tamanhos -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.5rem;">Escala de tamanhos</div>
        <div style="display: flex; align-items: flex-end; gap: 2rem; flex-wrap: wrap;">
          \${[{
    label: 'XS',
    size: 16,
    use: 'Favicon tab'
  }, {
    label: 'SM',
    size: 24,
    use: 'Inline icon'
  }, {
    label: 'MD',
    size: 32,
    use: 'Navbar'
  }, {
    label: 'LG',
    size: 48,
    use: 'Card avatar'
  }, {
    label: 'XL',
    size: 64,
    use: 'Profile'
  }, {
    label: '2XL',
    size: 96,
    use: 'Hero'
  }, {
    label: '3XL',
    size: 144,
    use: 'Splash'
  }].map(({
    label,
    size,
    use
  }) => \`
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.6rem;">
              <img
                src="\${FAVICON_SRC}"
                alt="Favicon Starkën \${label}"
                width="\${size}"
                height="\${size}"
                style="border-radius: 50%; object-fit: cover; display: block; border: 2px solid rgba(16,185,129,0.25);"
              />
              <div style="text-align: center;">
                <code style="color: #6ee7b7; font-size: 0.65rem;">\${size}px</code>
                <div style="color: #64748b; font-size: 0.65rem; margin-top: 0.1rem;">\${use}</div>
              </div>
            </div>
          \`).join('')}
        </div>
      </div>

      <!-- Casos de uso -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 2rem;">

        <!-- Browser tab -->
        <div style="background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #334155; padding: 0.6rem 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="\${FAVICON_SRC}" width="14" height="14" style="border-radius: 50%; object-fit: cover;" />
            <span style="color: #94a3b8; font-size: 0.75rem;">Starkën Design System</span>
            <span style="color: #475569; margin-left: auto; font-size: 0.7rem;">✕</span>
          </div>
          <div style="padding: 1rem; text-align: center; color: #64748b; font-size: 0.75rem;">Aba do navegador (16px)</div>
        </div>

        <!-- Avatar usuário -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 0.875rem;">
          <img src="\${FAVICON_SRC}" width="48" height="48" style="border-radius: 50%; object-fit: cover; border: 2px solid rgba(16,185,129,0.3);" />
          <div>
            <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600;">Starkën Tecnologia</div>
            <div style="color: #64748b; font-size: 0.75rem;">Perfil · 48px</div>
          </div>
        </div>

        <!-- Stack de avatares -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08);">
          <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.75rem;">Stack de responsáveis</div>
          <div style="display: flex;">
            \${[0, 1, 2].map(i => \`
              <img src="\${FAVICON_SRC}" width="36" height="36" style="border-radius: 50%; object-fit: cover; border: 3px solid #0f172a; margin-left: \${i > 0 ? '-10px' : '0'};" />
            \`).join('')}
            <div style="
              width: 36px; height: 36px; border-radius: 50%;
              background: rgba(16,185,129,0.15); border: 3px solid #0f172a;
              display: flex; align-items: center; justify-content: center;
              color: #10b981; font-size: 0.7rem; font-weight: 700;
              margin-left: -10px;
            ">+4</div>
          </div>
        </div>

        <!-- Notificação push -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: flex-start; gap: 0.75rem;">
          <img src="\${FAVICON_SRC}" width="40" height="40" style="border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
          <div>
            <div style="color: #ffffff; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.15rem;">Starkën Escritório</div>
            <div style="color: #94a3b8; font-size: 0.75rem;">Post publicado com sucesso ✓</div>
            <div style="color: #64748b; font-size: 0.65rem; margin-top: 0.25rem;">agora mesmo</div>
          </div>
        </div>

        <!-- Navbar compacta -->
        <div style="background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #020617; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="\${FAVICON_SRC}" width="28" height="28" style="border-radius: 50%; object-fit: cover;" />
            <span style="color: #ffffff; font-size: 0.8rem; font-weight: 700;">Escritório Virtual</span>
          </div>
          <div style="padding: 0.75rem 1rem; text-align: center; color: #64748b; font-size: 0.7rem;">Navbar — 28px</div>
        </div>

        <!-- PWA icon -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
          <img src="\${FAVICON_SRC}" width="72" height="72" style="border-radius: 22%; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />
          <div style="color: #ffffff; font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem;">Starkën</div>
          <div style="color: #64748b; font-size: 0.65rem;">PWA icon · 72px</div>
        </div>
      </div>

      <!-- Código -->
      <div style="background: #0f172a; border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #10b981; font-size: 0.875rem; font-weight: 700; margin-bottom: 1rem;">📝 Como usar</div>
        <pre style="background: #020617; padding: 1rem; border-radius: 8px; margin: 0; overflow-x: auto;"><code style="color: #6ee7b7; font-size: 0.8rem; font-family: 'Fira Code', monospace;">&lt;!-- Avatar circular --&gt;
&lt;img
  src="/logo-fenix-tecnologia-square.png"
  alt="Starkën"
  width="48" height="48"
  style="border-radius: 50%; object-fit: cover;"
/&gt;

&lt;!-- Favicon no &lt;head&gt; --&gt;
&lt;link rel="icon" type="image/png"
      href="/logo-fenix-tecnologia-square.png" /&gt;</code></pre>
      </div>
    </div>
  \`
}`,...(s=(n=o.parameters)==null?void 0:n.docs)==null?void 0:s.source}}};var d,l,m;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => \`
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <h1 style="color: #10b981; font-size: 1.5rem; margin-bottom: 2rem;">Avatar com Status</h1>

      <div style="display: flex; gap: 2.5rem; flex-wrap: wrap; align-items: center;">
        \${[{
    status: 'online',
    color: '#10b981',
    label: 'Online'
  }, {
    status: 'busy',
    color: '#f59e0b',
    label: 'Ocupado'
  }, {
    status: 'offline',
    color: '#64748b',
    label: 'Offline'
  }, {
    status: 'dnd',
    color: '#ef4444',
    label: 'Não Perturbar'
  }].map(({
    color,
    label
  }) => \`
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
            <div style="position: relative;">
              <img src="\${FAVICON_SRC}" width="64" height="64" style="border-radius: 50%; object-fit: cover; border: 2px solid rgba(16,185,129,0.25);" />
              <span style="
                position: absolute; bottom: 0; right: 0;
                width: 18px; height: 18px; border-radius: 50%;
                background: \${color}; border: 3px solid #020617;
              "></span>
            </div>
            <span style="color: #94a3b8; font-size: 0.75rem;">\${label}</span>
          </div>
        \`).join('')}
      </div>
    </div>
  \`
}`,...(m=(l=a.parameters)==null?void 0:l.docs)==null?void 0:m.source}}};const b=["Tamanhos","ComStatus"];export{a as ComStatus,o as Tamanhos,b as __namedExportsOrder,g as default};
