const U={title:"Starkën Design System/Componentes/Botões",tags:["autodocs"],parameters:{docs:{description:{component:"Componente de botão com múltiplas variantes, tamanhos e estados. Inclui efeitos hover, estados desabilitados e suporte completo a acessibilidade."}}},argTypes:{variant:{control:{type:"select"},options:["primary","secondary","ghost"],description:"Variante visual do botão",table:{defaultValue:{summary:"primary"}}},size:{control:{type:"select"},options:["sm","md","lg"],description:"Tamanho do botão",table:{defaultValue:{summary:"md"}}},disabled:{control:"boolean",description:"Define se o botão está desabilitado",table:{defaultValue:{summary:!1}}},label:{control:"text",description:"Texto exibido no botão"}}},a=t=>{const G=t.variant?`starken-btn-${t.variant}`:"",P=t.size&&t.size!=="md"?`starken-btn-${t.size}`:"";return`
    <button
      class="starken-btn ${G} ${P}"
      ${t.disabled?"disabled":""}
    >
      ${t.label}
    </button>
  `},e={args:{variant:"primary",size:"md",label:"Começar Agora",disabled:!1},render:a},r={args:{variant:"secondary",size:"md",label:"Saiba Mais",disabled:!1},render:a},n={args:{variant:"ghost",size:"md",label:"Cancelar",disabled:!1},render:a},s={args:{variant:"primary",size:"sm",label:"Pequeno",disabled:!1},render:a},o={args:{variant:"primary",size:"lg",label:"Grande",disabled:!1},render:a},i={args:{variant:"primary",size:"md",label:"Desabilitado",disabled:!0},render:a},l={render:()=>`
    <div style="display: flex; flex-direction: column; gap: 2rem; padding: 2rem;">
      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Variantes</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary">Primary</button>
          <button class="starken-btn starken-btn-secondary">Secondary</button>
          <button class="starken-btn starken-btn-ghost">Ghost</button>
        </div>
      </div>

      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Tamanhos</h3>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary starken-btn-sm">Pequeno</button>
          <button class="starken-btn starken-btn-primary">Médio (padrão)</button>
          <button class="starken-btn starken-btn-primary starken-btn-lg">Grande</button>
        </div>
      </div>

      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Estados</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary">Normal</button>
          <button class="starken-btn starken-btn-primary" disabled>Desabilitado</button>
        </div>
      </div>

      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Combinações</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary starken-btn-lg">Primary Large</button>
          <button class="starken-btn starken-btn-secondary starken-btn-sm">Secondary Small</button>
          <button class="starken-btn starken-btn-ghost">Ghost Normal</button>
        </div>
      </div>

      <div style="background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <h3 style="color: #10b981; margin-bottom: 1rem;">💡 Quando usar cada variante</h3>
        <div style="color: #94a3b8; line-height: 1.75;">
          <p style="margin-bottom: 0.75rem;">
            <strong style="color: #ffffff;">Primary:</strong> Ação principal da página ou seção. Use apenas 1 por contexto.
          </p>
          <p style="margin-bottom: 0.75rem;">
            <strong style="color: #ffffff;">Secondary:</strong> Ações secundárias ou alternativas. Use para "Saiba mais", "Cancelar", etc.
          </p>
          <p>
            <strong style="color: #ffffff;">Ghost:</strong> Ações terciárias ou de baixa importância. Use para links de navegação.
          </p>
        </div>
      </div>

      <div style="background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <h3 style="color: #10b981; margin-bottom: 1rem;">📝 Código de Exemplo</h3>
        <pre style="background: #020617; padding: 1.5rem; border-radius: 8px; overflow-x: auto; margin: 0;">
<code style="color: #6ee7b7; font-size: 0.875rem; font-family: monospace;">&lt;!-- Botão Primário --&gt;
&lt;button class="starken-btn starken-btn-primary"&gt;
  Começar Agora
&lt;/button&gt;

&lt;!-- Botão Secundário --&gt;
&lt;button class="starken-btn starken-btn-secondary"&gt;
  Saiba Mais
&lt;/button&gt;

&lt;!-- Botão Grande --&gt;
&lt;button class="starken-btn starken-btn-primary starken-btn-lg"&gt;
  Botão Grande
&lt;/button&gt;

&lt;!-- Botão Desabilitado --&gt;
&lt;button class="starken-btn starken-btn-primary" disabled&gt;
  Desabilitado
&lt;/button&gt;</code>
        </pre>
      </div>

      <div style="background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <h3 style="color: #10b981; margin-bottom: 1rem;">♿ Acessibilidade</h3>
        <ul style="color: #94a3b8; line-height: 1.75; margin: 0; padding-left: 1.5rem;">
          <li>Sempre use texto descritivo no botão</li>
          <li>Use <code style="color: #6ee7b7;">disabled</code> ao invés de classes para estado desabilitado</li>
          <li>Contraste atende WCAG 2.1 AA em todas as variantes</li>
          <li>Estados hover e focus claramente visíveis</li>
          <li>Tamanho mínimo de toque: 44x44px (acessível para mobile)</li>
        </ul>
      </div>
    </div>
  `};var d,b,m;e.parameters={...e.parameters,docs:{...(d=e.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    size: 'md',
    label: 'Começar Agora',
    disabled: false
  },
  render: createButton
}`,...(m=(b=e.parameters)==null?void 0:b.docs)==null?void 0:m.source}}};var c,p,u;r.parameters={...r.parameters,docs:{...(c=r.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    size: 'md',
    label: 'Saiba Mais',
    disabled: false
  },
  render: createButton
}`,...(u=(p=r.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var g,f,y;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    size: 'md',
    label: 'Cancelar',
    disabled: false
  },
  render: createButton
}`,...(y=(f=n.parameters)==null?void 0:f.docs)==null?void 0:y.source}}};var v,x,k;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    size: 'sm',
    label: 'Pequeno',
    disabled: false
  },
  render: createButton
}`,...(k=(x=s.parameters)==null?void 0:x.docs)==null?void 0:k.source}}};var h,E,S;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    size: 'lg',
    label: 'Grande',
    disabled: false
  },
  render: createButton
}`,...(S=(E=o.parameters)==null?void 0:E.docs)==null?void 0:S.source}}};var D,C,A;i.parameters={...i.parameters,docs:{...(D=i.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    size: 'md',
    label: 'Desabilitado',
    disabled: true
  },
  render: createButton
}`,...(A=(C=i.parameters)==null?void 0:C.docs)==null?void 0:A.source}}};var z,B,w;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => \`
    <div style="display: flex; flex-direction: column; gap: 2rem; padding: 2rem;">
      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Variantes</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary">Primary</button>
          <button class="starken-btn starken-btn-secondary">Secondary</button>
          <button class="starken-btn starken-btn-ghost">Ghost</button>
        </div>
      </div>

      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Tamanhos</h3>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary starken-btn-sm">Pequeno</button>
          <button class="starken-btn starken-btn-primary">Médio (padrão)</button>
          <button class="starken-btn starken-btn-primary starken-btn-lg">Grande</button>
        </div>
      </div>

      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Estados</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary">Normal</button>
          <button class="starken-btn starken-btn-primary" disabled>Desabilitado</button>
        </div>
      </div>

      <div>
        <h3 style="color: #ffffff; margin-bottom: 1rem;">Combinações</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="starken-btn starken-btn-primary starken-btn-lg">Primary Large</button>
          <button class="starken-btn starken-btn-secondary starken-btn-sm">Secondary Small</button>
          <button class="starken-btn starken-btn-ghost">Ghost Normal</button>
        </div>
      </div>

      <div style="background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <h3 style="color: #10b981; margin-bottom: 1rem;">💡 Quando usar cada variante</h3>
        <div style="color: #94a3b8; line-height: 1.75;">
          <p style="margin-bottom: 0.75rem;">
            <strong style="color: #ffffff;">Primary:</strong> Ação principal da página ou seção. Use apenas 1 por contexto.
          </p>
          <p style="margin-bottom: 0.75rem;">
            <strong style="color: #ffffff;">Secondary:</strong> Ações secundárias ou alternativas. Use para "Saiba mais", "Cancelar", etc.
          </p>
          <p>
            <strong style="color: #ffffff;">Ghost:</strong> Ações terciárias ou de baixa importância. Use para links de navegação.
          </p>
        </div>
      </div>

      <div style="background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <h3 style="color: #10b981; margin-bottom: 1rem;">📝 Código de Exemplo</h3>
        <pre style="background: #020617; padding: 1.5rem; border-radius: 8px; overflow-x: auto; margin: 0;">
<code style="color: #6ee7b7; font-size: 0.875rem; font-family: monospace;">&lt;!-- Botão Primário --&gt;
&lt;button class="starken-btn starken-btn-primary"&gt;
  Começar Agora
&lt;/button&gt;

&lt;!-- Botão Secundário --&gt;
&lt;button class="starken-btn starken-btn-secondary"&gt;
  Saiba Mais
&lt;/button&gt;

&lt;!-- Botão Grande --&gt;
&lt;button class="starken-btn starken-btn-primary starken-btn-lg"&gt;
  Botão Grande
&lt;/button&gt;

&lt;!-- Botão Desabilitado --&gt;
&lt;button class="starken-btn starken-btn-primary" disabled&gt;
  Desabilitado
&lt;/button&gt;</code>
        </pre>
      </div>

      <div style="background: #0f172a; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <h3 style="color: #10b981; margin-bottom: 1rem;">♿ Acessibilidade</h3>
        <ul style="color: #94a3b8; line-height: 1.75; margin: 0; padding-left: 1.5rem;">
          <li>Sempre use texto descritivo no botão</li>
          <li>Use <code style="color: #6ee7b7;">disabled</code> ao invés de classes para estado desabilitado</li>
          <li>Contraste atende WCAG 2.1 AA em todas as variantes</li>
          <li>Estados hover e focus claramente visíveis</li>
          <li>Tamanho mínimo de toque: 44x44px (acessível para mobile)</li>
        </ul>
      </div>
    </div>
  \`
}`,...(w=(B=l.parameters)==null?void 0:B.docs)==null?void 0:w.source}}};const V=["Primary","Secondary","Ghost","Small","Large","Disabled","AllVariants"];export{l as AllVariants,i as Disabled,n as Ghost,o as Large,e as Primary,r as Secondary,s as Small,V as __namedExportsOrder,U as default};
