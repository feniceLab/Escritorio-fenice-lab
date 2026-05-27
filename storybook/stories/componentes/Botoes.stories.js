export default {
  title: 'Starkën Design System/Componentes/Botões',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente de botão com múltiplas variantes, tamanhos e estados. Inclui efeitos hover, estados desabilitados e suporte completo a acessibilidade.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
      description: 'Variante visual do botão',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Tamanho do botão',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Define se o botão está desabilitado',
      table: {
        defaultValue: { summary: false },
      },
    },
    label: {
      control: 'text',
      description: 'Texto exibido no botão',
    },
  },
};

const createButton = (args) => {
  const variantClass = args.variant ? `starken-btn-${args.variant}` : '';
  const sizeClass = args.size && args.size !== 'md' ? `starken-btn-${args.size}` : '';

  return `
    <button
      class="starken-btn ${variantClass} ${sizeClass}"
      ${args.disabled ? 'disabled' : ''}
    >
      ${args.label}
    </button>
  `;
};

export const Primary = {
  args: {
    variant: 'primary',
    size: 'md',
    label: 'Começar Agora',
    disabled: false,
  },
  render: createButton,
};

export const Secondary = {
  args: {
    variant: 'secondary',
    size: 'md',
    label: 'Saiba Mais',
    disabled: false,
  },
  render: createButton,
};

export const Ghost = {
  args: {
    variant: 'ghost',
    size: 'md',
    label: 'Cancelar',
    disabled: false,
  },
  render: createButton,
};

export const Small = {
  args: {
    variant: 'primary',
    size: 'sm',
    label: 'Pequeno',
    disabled: false,
  },
  render: createButton,
};

export const Large = {
  args: {
    variant: 'primary',
    size: 'lg',
    label: 'Grande',
    disabled: false,
  },
  render: createButton,
};

export const Disabled = {
  args: {
    variant: 'primary',
    size: 'md',
    label: 'Desabilitado',
    disabled: true,
  },
  render: createButton,
};

export const AllVariants = {
  render: () => `
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
  `,
};
