const O={title:"Starkën Design System/Fundamentos/Logos",parameters:{docs:{description:{component:"Todas as versões e tamanhos dos logos Starkën. Cada variante existe em 5 tamanhos padronizados. Use sempre o arquivo oficial — nunca recrie ou distorça."}},backgrounds:{default:"dark",values:[{name:"dark",value:"#020617"},{name:"surface",value:"#0f172a"},{name:"white",value:"#ffffff"},{name:"emerald",value:"#10b981"}]}}},I=[{label:"XS",height:24,desc:"Favicon, ícone de app, navbar compacta"},{label:"SM",height:36,desc:"Navbar padrão, assinaturas de email"},{label:"MD",height:48,desc:"Headers de página, cards de apresentação"},{label:"LG",height:72,desc:"Landing pages, covers, apresentações"},{label:"XL",height:120,desc:"Hero sections, splash screens, banners premium"}],t={name:"⭐ Logo Circular — Favicon Oficial",render:()=>`
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
        <h1 style="color: #10b981; font-size: 2rem; margin: 0;">Logo Branca Alternativa</h1>
        <span style="
          background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35);
          color: #10b981; font-size: 0.7rem; font-weight: 700;
          padding: 0.25rem 0.75rem; border-radius: 100px; letter-spacing: 0.08em;
        ">FAVICON OFICIAL</span>
      </div>
      <p style="color: #94a3b8; margin-bottom: 3rem; max-width: 600px;">
        Composição circular para aplicações institucionais e destaque visual. Usada como favicon do Storybook e ícone de app.
        Arquivo: <code style="color: #6ee7b7;">./logo-fenix-tecnologia-square.png</code>
      </p>

      <!-- Featured size showcase -->
      <div style="display: flex; align-items: flex-end; gap: 2.5rem; flex-wrap: wrap; margin-bottom: 3.5rem;">
        ${[{label:"XS",height:16,use:"Favicon browser tab"},{label:"SM",height:32,use:"Favicon HD / PWA"},{label:"MD",height:48,use:"Avatar / badge"},{label:"LG",height:80,use:"Card / header"},{label:"XL",height:120,use:"Cover / splash"},{label:"2XL",height:200,use:"Hero / banner"}].map(({label:r,height:e,use:a})=>`
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.875rem;">
            <div style="
              background: #0f172a;
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: ${e>=80?"20px":"14px"};
              padding: ${Math.round(e*.3)}px;
              display: flex; align-items: center; justify-content: center;
            ">
              <img
                src="./logo-fenix-tecnologia-square.png"
                alt="Starkën Tecnologia"
                width="${e}"
                height="${e}"
                style="display: block; border-radius: 50%; object-fit: cover; border: 2px solid rgba(16,185,129,0.2);"
              />
            </div>
            <div style="text-align: center;">
              <div style="
                color: #ffffff; font-size: 0.7rem; font-weight: 700;
                background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
                padding: 0.15rem 0.5rem; border-radius: 4px; display: inline-block;
                margin-bottom: 0.25rem;
              ">${r} — ${e}px</div>
              <div style="color: #64748b; font-size: 0.65rem;">${a}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Contextos de uso -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;">

        <!-- Browser tab simulado -->
        <div style="background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #334155; padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="./logo-fenix-tecnologia-square.png" width="14" height="14" style="border-radius: 50%; object-fit: cover;" />
            <span style="color: #94a3b8; font-size: 0.7rem;">Starkën Design System</span>
            <span style="color: #475569; margin-left: auto; font-size: 0.7rem;">✕</span>
          </div>
          <div style="padding: 0.875rem; text-align: center; color: #64748b; font-size: 0.75rem;">Browser tab</div>
        </div>

        <!-- Avatar circular -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 1rem;">
          <img src="./logo-fenix-tecnologia-square.png" width="48" height="48" style="border-radius: 50%; display: block; border: 2px solid rgba(16,185,129,0.3);" />
          <div>
            <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600;">Starkën Tecnologia</div>
            <div style="color: #64748b; font-size: 0.75rem;">Avatar circular — 48px</div>
          </div>
        </div>

        <!-- Notificação push simulada -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: flex-start; gap: 0.75rem;">
          <img src="./logo-fenix-tecnologia-square.png" width="40" height="40" style="border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0;" />
          <div>
            <div style="color: #ffffff; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.2rem;">Starkën Escritório</div>
            <div style="color: #94a3b8; font-size: 0.75rem;">Post publicado com sucesso ✓</div>
            <div style="color: #64748b; font-size: 0.65rem; margin-top: 0.25rem;">agora mesmo</div>
          </div>
        </div>

        <!-- Navbar -->
        <div style="background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #020617; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="./logo-fenix-tecnologia-square.png" width="28" height="28" style="border-radius: 50%; object-fit: cover; display: block;" />
            <span style="color: #ffffff; font-size: 0.8rem; font-weight: 700;">Escritório Virtual</span>
          </div>
          <div style="padding: 0.75rem 1rem; text-align: center; color: #64748b; font-size: 0.75rem;">Navbar — 28px</div>
        </div>

      </div>

      <!-- Regra de ouro -->
      <div style="
        background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(13,148,136,0.06));
        border: 1px solid rgba(16,185,129,0.2);
        border-radius: 14px;
        padding: 1.25rem 1.5rem;
        display: flex; gap: 1rem; align-items: flex-start;
      ">
        <span style="font-size: 1.5rem; flex-shrink: 0;">⭐</span>
        <div>
          <div style="color: #10b981; font-weight: 700; margin-bottom: 0.35rem;">Logo Circular = Favicon Oficial Starkën</div>
          <div style="color: #94a3b8; font-size: 0.875rem; line-height: 1.6;">
            Este ícone é o favicon oficial do Storybook e de todos os produtos Starkën.
            Use <code style="color: #6ee7b7;">logo-fenix-tecnologia-square.png</code> sempre que precisar de um ícone quadrado/circular.
            Mínimo: 16×16px (favicon) · Recomendado: 32×32px ou maior para melhor nitidez.
          </div>
        </div>
      </div>
    </div>
  `},i=(r,e,a="#020617")=>`
  <div style="margin-bottom: 3rem;">
    <h2 style="color: #10b981; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${e}</h2>
    <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem;">Arquivo: <code style="color: #6ee7b7;">${r}</code></p>
    <div style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: flex-end;">
      ${I.map(({label:o,height:n,desc:R})=>`
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <div style="
            background: ${a};
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 1.25rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: ${n*2.5}px;
          ">
            <img src="${r}" alt="Logo Starkën" height="${n}" style="display: block; max-width: ${n*5}px;" />
          </div>
          <div style="text-align: center;">
            <div style="
              color: #ffffff;
              font-size: 0.75rem;
              font-weight: 700;
              background: rgba(16,185,129,0.12);
              border: 1px solid rgba(16,185,129,0.25);
              padding: 0.15rem 0.5rem;
              border-radius: 4px;
              display: inline-block;
              margin-bottom: 0.25rem;
            ">${o} — ${n}px</div>
            <div style="color: #64748b; font-size: 0.7rem; max-width: 100px; text-align: center; line-height: 1.3;">${R}</div>
          </div>
        </div>
      `).join("")}
    </div>
  </div>
`,l={name:"⭐ Logo Principal — Colorida",render:()=>`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2.5rem; margin-bottom: 0.5rem;">Logos Starkën</h1>
      <p style="color: #94a3b8; font-size: 1rem; margin-bottom: 0.75rem; max-width: 650px;">
        Logo oficial Starkën Tecnologia em 5 tamanhos. Esta é a versão principal — use em todos os materiais, apresentações e interfaces.
      </p>
      <div style="
        display: inline-flex; align-items: center; gap: 0.4rem;
        background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
        color: #10b981; font-size: 0.7rem; font-weight: 700;
        padding: 0.25rem 0.75rem; border-radius: 100px; margin-bottom: 2.5rem;
      ">✓ LOGO OFICIAL</div>
      ${i("./logo-fenix-tecnologia.png","Starkën Tecnologia — Logo Principal")}
    </div>
  `},s={name:"Tecnologia — Colorida",render:()=>`
    <div style="padding: 2rem;">
      ${i("./logo-fenix-tecnologia.png","Starkën Tecnologia — Versão Colorida (Logo Principal)")}
    </div>
  `},d={render:()=>`
    <div style="padding: 2rem;">
      ${i("./logo-fenix-tecnologia-white.png","Starkën Tecnologia — Versão Branca (fundo escuro/colorido)")}
    </div>
  `},g={render:()=>`
    <div style="padding: 2rem;">
      ${i("./logo-fenix-tecnologia-square.png","Starkën Tecnologia — Versão Square (ícone de app, avatar)")}
    </div>
  `},m={render:()=>`
    <div style="padding: 2rem;">
      ${i("./logo-fenix-dgCD7lDT.png","Starkën — Versão Empilhada (PNG)")}
    </div>
  `},c={render:()=>`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 3rem;">Todas as Variantes</h1>

      <!-- Visão geral lado a lado -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
        ${[{src:"./logo-fenix-tecnologia.png",label:"Principal — Colorida",bg:"#020617",featured:!0},{src:"./logo-fenix-tecnologia-white.png",label:"Tecnologia — White",bg:"#0f172a"},{src:"./logo-fenix-tecnologia-square.png",label:"Circular (Favicon)",bg:"#020617"},{src:"./logo-fenix-dgCD7lDT.png",label:"Empilhada",bg:"#020617"}].map(({src:r,label:e,bg:a,featured:o})=>`
          <div style="
            background: ${a};
            border: 1px solid ${o?"rgba(16,185,129,0.35)":"rgba(255,255,255,0.08)"};
            border-radius: 16px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            position: relative;
          ">
            ${o?'<span style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); color: #10b981; font-size: 0.6rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 100px;">OFICIAL</span>':""}
            <img src="${r}" alt="${e}" height="48" style="max-width: 200px; display: block;" />
            <div style="color: ${o?"#10b981":"#94a3b8"}; font-size: 0.8rem; text-align: center; font-weight: ${o?"700":"400"};">${e}</div>
          </div>
        `).join("")}
      </div>

      <!-- Regras de uso -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem;">
        <h2 style="color: #10b981; font-size: 1.25rem; margin-bottom: 1.5rem;">✅ Regras de Uso</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <div style="color: #34d399; font-weight: 700; margin-bottom: 0.75rem;">✓ Pode</div>
            <ul style="color: #94a3b8; font-size: 0.875rem; line-height: 2; list-style: none; padding: 0; margin: 0;">
              <li>✓ Redimensionar proporcionalmente</li>
              <li>✓ Usar versão branca em fundos coloridos/escuros</li>
              <li>✓ Usar versão SVG para máxima nitidez</li>
              <li>✓ Aplicar espaçamento mínimo ao redor (= altura do logo)</li>
            </ul>
          </div>
          <div>
            <div style="color: #f87171; font-weight: 700; margin-bottom: 0.75rem;">✗ Nunca</div>
            <ul style="color: #94a3b8; font-size: 0.875rem; line-height: 2; list-style: none; padding: 0; margin: 0;">
              <li>✗ Distorcer ou esticar o logo</li>
              <li>✗ Alterar cores do logo</li>
              <li>✗ Aplicar sombras ou efeitos</li>
              <li>✗ Colocar sobre fundos com baixo contraste</li>
              <li>✗ Recriar o logo em texto puro</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Área de proteção -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08);">
        <h2 style="color: #10b981; font-size: 1.25rem; margin-bottom: 1rem;">📐 Área de Proteção</h2>
        <p style="color: #94a3b8; font-size: 0.875rem; line-height: 1.75; margin-bottom: 1.5rem;">
          Mantenha uma área livre ao redor do logo igual à altura da letra "S" do nome.
          Para o logo de 48px de altura, a área livre mínima é <strong style="color: #ffffff;">~12px</strong> em cada lado.
        </p>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
          ${I.map(({label:r,height:e})=>`
            <div style="text-align: center;">
              <code style="color: #6ee7b7; font-size: 0.7rem;">${r} (${e}px)</code>
              <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 0.25rem;">
                Área: ${Math.round(e*.25)}px
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `},p={render:()=>`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 2rem;">Logo em Diferentes Fundos</h1>
      <div style="display: grid; gap: 1rem;">
        ${[{bg:"#020617",label:"Dark (principal)",logo:"./logo-fenix-tecnologia.png",ok:!0},{bg:"#0f172a",label:"Surface (cards)",logo:"./logo-fenix-tecnologia.png",ok:!0},{bg:"#10b981",label:"Emerald (CTAs)",logo:"./logo-fenix-tecnologia-white.png",ok:!0},{bg:"#ffffff",label:"White (documentos)",logo:"./logo-fenix-tecnologia.png",ok:!0},{bg:"#1e293b",label:"Elevated (dark)",logo:"./logo-fenix-tecnologia.png",ok:!0},{bg:"#94a3b8",label:"Gray — ⚠️ baixo contraste",logo:"./logo-fenix-tecnologia.png",ok:!1}].map(({bg:r,label:e,logo:a,ok:o})=>`
          <div style="
            background: ${r};
            border-radius: 12px;
            padding: 1.5rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: ${o?"1px solid rgba(255,255,255,0.06)":"2px solid #f87171"};
          ">
            <img src="${a}" alt="Logo" height="36" style="max-width: 180px; display: block;" />
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: ${o?"#34d399":"#f87171"}; font-size: 1rem;">${o?"✓":"✗"}</span>
              <span style="color: ${o?"#94a3b8":"#f87171"}; font-size: 0.875rem;">${e}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `};var b,u,f;t.parameters={...t.parameters,docs:{...(b=t.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: '⭐ Logo Circular — Favicon Oficial',
  render: () => \`
    <div style="padding: 2rem; font-family: 'Inter', sans-serif;">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
        <h1 style="color: #10b981; font-size: 2rem; margin: 0;">Logo Branca Alternativa</h1>
        <span style="
          background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35);
          color: #10b981; font-size: 0.7rem; font-weight: 700;
          padding: 0.25rem 0.75rem; border-radius: 100px; letter-spacing: 0.08em;
        ">FAVICON OFICIAL</span>
      </div>
      <p style="color: #94a3b8; margin-bottom: 3rem; max-width: 600px;">
        Composição circular para aplicações institucionais e destaque visual. Usada como favicon do Storybook e ícone de app.
        Arquivo: <code style="color: #6ee7b7;">./logo-fenix-tecnologia-square.png</code>
      </p>

      <!-- Featured size showcase -->
      <div style="display: flex; align-items: flex-end; gap: 2.5rem; flex-wrap: wrap; margin-bottom: 3.5rem;">
        \${[{
    label: 'XS',
    height: 16,
    use: 'Favicon browser tab'
  }, {
    label: 'SM',
    height: 32,
    use: 'Favicon HD / PWA'
  }, {
    label: 'MD',
    height: 48,
    use: 'Avatar / badge'
  }, {
    label: 'LG',
    height: 80,
    use: 'Card / header'
  }, {
    label: 'XL',
    height: 120,
    use: 'Cover / splash'
  }, {
    label: '2XL',
    height: 200,
    use: 'Hero / banner'
  }].map(({
    label,
    height,
    use
  }) => \`
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.875rem;">
            <div style="
              background: #0f172a;
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: \${height >= 80 ? '20px' : '14px'};
              padding: \${Math.round(height * 0.3)}px;
              display: flex; align-items: center; justify-content: center;
            ">
              <img
                src="./logo-fenix-tecnologia-square.png"
                alt="Starkën Tecnologia"
                width="\${height}"
                height="\${height}"
                style="display: block; border-radius: 50%; object-fit: cover; border: 2px solid rgba(16,185,129,0.2);"
              />
            </div>
            <div style="text-align: center;">
              <div style="
                color: #ffffff; font-size: 0.7rem; font-weight: 700;
                background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
                padding: 0.15rem 0.5rem; border-radius: 4px; display: inline-block;
                margin-bottom: 0.25rem;
              ">\${label} — \${height}px</div>
              <div style="color: #64748b; font-size: 0.65rem;">\${use}</div>
            </div>
          </div>
        \`).join('')}
      </div>

      <!-- Contextos de uso -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;">

        <!-- Browser tab simulado -->
        <div style="background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #334155; padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="./logo-fenix-tecnologia-square.png" width="14" height="14" style="border-radius: 50%; object-fit: cover;" />
            <span style="color: #94a3b8; font-size: 0.7rem;">Starkën Design System</span>
            <span style="color: #475569; margin-left: auto; font-size: 0.7rem;">✕</span>
          </div>
          <div style="padding: 0.875rem; text-align: center; color: #64748b; font-size: 0.75rem;">Browser tab</div>
        </div>

        <!-- Avatar circular -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 1rem;">
          <img src="./logo-fenix-tecnologia-square.png" width="48" height="48" style="border-radius: 50%; display: block; border: 2px solid rgba(16,185,129,0.3);" />
          <div>
            <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600;">Starkën Tecnologia</div>
            <div style="color: #64748b; font-size: 0.75rem;">Avatar circular — 48px</div>
          </div>
        </div>

        <!-- Notificação push simulada -->
        <div style="background: #0f172a; border-radius: 12px; padding: 1rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: flex-start; gap: 0.75rem;">
          <img src="./logo-fenix-tecnologia-square.png" width="40" height="40" style="border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0;" />
          <div>
            <div style="color: #ffffff; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.2rem;">Starkën Escritório</div>
            <div style="color: #94a3b8; font-size: 0.75rem;">Post publicado com sucesso ✓</div>
            <div style="color: #64748b; font-size: 0.65rem; margin-top: 0.25rem;">agora mesmo</div>
          </div>
        </div>

        <!-- Navbar -->
        <div style="background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: #020617; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <img src="./logo-fenix-tecnologia-square.png" width="28" height="28" style="border-radius: 50%; object-fit: cover; display: block;" />
            <span style="color: #ffffff; font-size: 0.8rem; font-weight: 700;">Escritório Virtual</span>
          </div>
          <div style="padding: 0.75rem 1rem; text-align: center; color: #64748b; font-size: 0.75rem;">Navbar — 28px</div>
        </div>

      </div>

      <!-- Regra de ouro -->
      <div style="
        background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(13,148,136,0.06));
        border: 1px solid rgba(16,185,129,0.2);
        border-radius: 14px;
        padding: 1.25rem 1.5rem;
        display: flex; gap: 1rem; align-items: flex-start;
      ">
        <span style="font-size: 1.5rem; flex-shrink: 0;">⭐</span>
        <div>
          <div style="color: #10b981; font-weight: 700; margin-bottom: 0.35rem;">Logo Circular = Favicon Oficial Starkën</div>
          <div style="color: #94a3b8; font-size: 0.875rem; line-height: 1.6;">
            Este ícone é o favicon oficial do Storybook e de todos os produtos Starkën.
            Use <code style="color: #6ee7b7;">logo-fenix-tecnologia-square.png</code> sempre que precisar de um ícone quadrado/circular.
            Mínimo: 16×16px (favicon) · Recomendado: 32×32px ou maior para melhor nitidez.
          </div>
        </div>
      </div>
    </div>
  \`
}`,...(f=(u=t.parameters)==null?void 0:u.docs)==null?void 0:f.source}}};var v,x,y;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: '⭐ Logo Principal — Colorida',
  render: () => \`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2.5rem; margin-bottom: 0.5rem;">Logos Starkën</h1>
      <p style="color: #94a3b8; font-size: 1rem; margin-bottom: 0.75rem; max-width: 650px;">
        Logo oficial Starkën Tecnologia em 5 tamanhos. Esta é a versão principal — use em todos os materiais, apresentações e interfaces.
      </p>
      <div style="
        display: inline-flex; align-items: center; gap: 0.4rem;
        background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
        color: #10b981; font-size: 0.7rem; font-weight: 700;
        padding: 0.25rem 0.75rem; border-radius: 100px; margin-bottom: 2.5rem;
      ">✓ LOGO OFICIAL</div>
      \${LogoRow('./logo-fenix-tecnologia.png', 'Starkën Tecnologia — Logo Principal')}
    </div>
  \`
}`,...(y=(x=l.parameters)==null?void 0:x.docs)==null?void 0:y.source}}};var h,k,$;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: 'Tecnologia — Colorida',
  render: () => \`
    <div style="padding: 2rem;">
      \${LogoRow('./logo-fenix-tecnologia.png', 'Starkën Tecnologia — Versão Colorida (Logo Principal)')}
    </div>
  \`
}`,...($=(k=s.parameters)==null?void 0:k.docs)==null?void 0:$.source}}};var w,z,E;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => \`
    <div style="padding: 2rem;">
      \${LogoRow('./logo-fenix-tecnologia-white.png', 'Starkën Tecnologia — Versão Branca (fundo escuro/colorido)')}
    </div>
  \`
}`,...(E=(z=d.parameters)==null?void 0:z.docs)==null?void 0:E.source}}};var S,L,C;g.parameters={...g.parameters,docs:{...(S=g.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => \`
    <div style="padding: 2rem;">
      \${LogoRow('./logo-fenix-tecnologia-square.png', 'Starkën Tecnologia — Versão Square (ícone de app, avatar)')}
    </div>
  \`
}`,...(C=(L=g.parameters)==null?void 0:L.docs)==null?void 0:C.source}}};var D,T,F;m.parameters={...m.parameters,docs:{...(D=m.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => \`
    <div style="padding: 2rem;">
      \${LogoRow('./logo-fenix-dgCD7lDT.png', 'Starkën — Versão Empilhada (PNG)')}
    </div>
  \`
}`,...(F=(T=m.parameters)==null?void 0:T.docs)==null?void 0:F.source}}};var q,A,B;c.parameters={...c.parameters,docs:{...(q=c.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: () => \`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 3rem;">Todas as Variantes</h1>

      <!-- Visão geral lado a lado -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
        \${[{
    src: './logo-fenix-tecnologia.png',
    label: 'Principal — Colorida',
    bg: '#020617',
    featured: true
  }, {
    src: './logo-fenix-tecnologia-white.png',
    label: 'Tecnologia — White',
    bg: '#0f172a'
  }, {
    src: './logo-fenix-tecnologia-square.png',
    label: 'Circular (Favicon)',
    bg: '#020617'
  }, {
    src: './logo-fenix-dgCD7lDT.png',
    label: 'Empilhada',
    bg: '#020617'
  }].map(({
    src,
    label,
    bg,
    featured
  }) => \`
          <div style="
            background: \${bg};
            border: 1px solid \${featured ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'};
            border-radius: 16px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            position: relative;
          ">
            \${featured ? '<span style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); color: #10b981; font-size: 0.6rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 100px;">OFICIAL</span>' : ''}
            <img src="\${src}" alt="\${label}" height="48" style="max-width: 200px; display: block;" />
            <div style="color: \${featured ? '#10b981' : '#94a3b8'}; font-size: 0.8rem; text-align: center; font-weight: \${featured ? '700' : '400'};">\${label}</div>
          </div>
        \`).join('')}
      </div>

      <!-- Regras de uso -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem;">
        <h2 style="color: #10b981; font-size: 1.25rem; margin-bottom: 1.5rem;">✅ Regras de Uso</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <div style="color: #34d399; font-weight: 700; margin-bottom: 0.75rem;">✓ Pode</div>
            <ul style="color: #94a3b8; font-size: 0.875rem; line-height: 2; list-style: none; padding: 0; margin: 0;">
              <li>✓ Redimensionar proporcionalmente</li>
              <li>✓ Usar versão branca em fundos coloridos/escuros</li>
              <li>✓ Usar versão SVG para máxima nitidez</li>
              <li>✓ Aplicar espaçamento mínimo ao redor (= altura do logo)</li>
            </ul>
          </div>
          <div>
            <div style="color: #f87171; font-weight: 700; margin-bottom: 0.75rem;">✗ Nunca</div>
            <ul style="color: #94a3b8; font-size: 0.875rem; line-height: 2; list-style: none; padding: 0; margin: 0;">
              <li>✗ Distorcer ou esticar o logo</li>
              <li>✗ Alterar cores do logo</li>
              <li>✗ Aplicar sombras ou efeitos</li>
              <li>✗ Colocar sobre fundos com baixo contraste</li>
              <li>✗ Recriar o logo em texto puro</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Área de proteção -->
      <div style="background: #0f172a; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08);">
        <h2 style="color: #10b981; font-size: 1.25rem; margin-bottom: 1rem;">📐 Área de Proteção</h2>
        <p style="color: #94a3b8; font-size: 0.875rem; line-height: 1.75; margin-bottom: 1.5rem;">
          Mantenha uma área livre ao redor do logo igual à altura da letra "S" do nome.
          Para o logo de 48px de altura, a área livre mínima é <strong style="color: #ffffff;">~12px</strong> em cada lado.
        </p>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
          \${SIZES.map(({
    label: sizeLabel,
    height
  }) => \`
            <div style="text-align: center;">
              <code style="color: #6ee7b7; font-size: 0.7rem;">\${sizeLabel} (\${height}px)</code>
              <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 0.25rem;">
                Área: \${Math.round(height * 0.25)}px
              </div>
            </div>
          \`).join('')}
        </div>
      </div>
    </div>
  \`
}`,...(B=(A=c.parameters)==null?void 0:A.docs)==null?void 0:B.source}}};var j,P,V;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => \`
    <div style="padding: 2rem;">
      <h1 style="color: #10b981; font-size: 2rem; margin-bottom: 2rem;">Logo em Diferentes Fundos</h1>
      <div style="display: grid; gap: 1rem;">
        \${[{
    bg: '#020617',
    label: 'Dark (principal)',
    logo: './logo-fenix-tecnologia.png',
    ok: true
  }, {
    bg: '#0f172a',
    label: 'Surface (cards)',
    logo: './logo-fenix-tecnologia.png',
    ok: true
  }, {
    bg: '#10b981',
    label: 'Emerald (CTAs)',
    logo: './logo-fenix-tecnologia-white.png',
    ok: true
  }, {
    bg: '#ffffff',
    label: 'White (documentos)',
    logo: './logo-fenix-tecnologia.png',
    ok: true
  }, {
    bg: '#1e293b',
    label: 'Elevated (dark)',
    logo: './logo-fenix-tecnologia.png',
    ok: true
  }, {
    bg: '#94a3b8',
    label: 'Gray — ⚠️ baixo contraste',
    logo: './logo-fenix-tecnologia.png',
    ok: false
  }].map(({
    bg,
    label,
    logo,
    ok
  }) => \`
          <div style="
            background: \${bg};
            border-radius: 12px;
            padding: 1.5rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: \${ok ? '1px solid rgba(255,255,255,0.06)' : '2px solid #f87171'};
          ">
            <img src="\${logo}" alt="Logo" height="36" style="max-width: 180px; display: block;" />
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: \${ok ? '#34d399' : '#f87171'}; font-size: 1rem;">\${ok ? '✓' : '✗'}</span>
              <span style="color: \${ok ? '#94a3b8' : '#f87171'}; font-size: 0.875rem;">\${label}</span>
            </div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`
}`,...(V=(P=p.parameters)==null?void 0:P.docs)==null?void 0:V.source}}};const M=["LogoCircularFavicon","LogoPrincipal","LogoTecnologiaCor","LogoTecnologiaBranca","LogoTecnologiaSquare","LogoEmpilhada","TodasAsVariantes","LogoEmFundos"];export{t as LogoCircularFavicon,p as LogoEmFundos,m as LogoEmpilhada,l as LogoPrincipal,d as LogoTecnologiaBranca,s as LogoTecnologiaCor,g as LogoTecnologiaSquare,c as TodasAsVariantes,M as __namedExportsOrder,O as default};
