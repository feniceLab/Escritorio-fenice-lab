# 📚 Starkën Design System - Storybook

> Documentação interativa completa do Starkën Design System

![Starkën Design System](../assets/logo-starken.svg)

---

## 🎯 Sobre

Este é o **Storybook oficial** do Starkën Design System, contendo documentação interativa, exemplos de código e playground para todos os componentes, tokens e padrões do sistema.

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd storybook
npm install
```

### 2. Executar Storybook

```bash
npm run storybook
```

O Storybook estará disponível em: **http://localhost:6006**

### 3. Build para Produção

```bash
npm run build-storybook
```

Os arquivos serão gerados em `./storybook-static`

### 4. Servir Build Local

```bash
npm run serve-storybook
```

## 📁 Estrutura

```
storybook/
├── .storybook/              # Configurações do Storybook
│   ├── main.js              # Config principal
│   ├── preview.js           # Config de preview
│   └── manager.js           # Customização da UI
│
├── stories/                 # Stories organizadas por categoria
│   ├── introducao/          # Introdução e guias
│   │   ├── Introducao.mdx
│   │   └── ComoUsar.mdx
│   │
│   ├── fundamentos/         # Fundamentos do design
│   │   ├── Cores.stories.js
│   │   ├── Tipografia.stories.js
│   │   └── Espacamento.stories.js
│   │
│   ├── componentes/         # Componentes reutilizáveis
│   │   ├── Botoes.stories.js
│   │   ├── Cards.stories.js
│   │   ├── Formularios.stories.js
│   │   └── ...
│   │
│   └── padroes/             # Padrões e guidelines
│       ├── Acessibilidade.mdx
│       ├── Escrita.mdx
│       └── BestPractices.mdx
│
├── public/                  # Assets públicos
│   └── logo-starken.svg
│
├── package.json
└── README.md               # Este arquivo
```

## 📚 Navegação no Storybook

### 🏠 Introdução
- **Bem-vindo** - Visão geral do design system
- **Como Usar** - Guia de instalação e uso
- **Instalação** - Setup detalhado

### 🎨 Fundamentos
- **Cores** - Paleta completa com acessibilidade
- **Tipografia** - Hierarquia e estilos de texto
- **Espaçamento** - Sistema de espaçamento
- **Elevação** - Sombras e profundidade
- **Grid & Layout** - Sistema de grid responsivo

### 🧩 Componentes
- **Botões** - Todas as variantes e tamanhos
- **Cards** - Cards com diferentes layouts
- **Formulários** - Inputs, textareas, selects
- **Navegação** - Headers, navs, breadcrumbs
- **Feedback** - Alerts, toasts, modals
- **Dados** - Tables, listas, badges

### 📖 Padrões
- **Acessibilidade** - Guidelines WCAG 2.1
- **Escrita** - Tom de voz e copywriting
- **Best Practices** - Melhores práticas de uso

## 🎨 Customização

### Tema Dark

O Storybook está configurado com tema dark personalizado que reflete a identidade visual da Starkën:

```js
// .storybook/manager.js
const theme = create({
  base: 'dark',
  brandTitle: 'Starkën Design System',
  colorPrimary: '#10b981',
  colorSecondary: '#0d9488',
  // ...
});
```

### Backgrounds

Backgrounds pré-configurados:
- **dark** (#020617) - Padrão
- **surface** (#0f172a) - Superfícies
- **light** (#ffffff) - Modo claro

## 🔧 Addons Configurados

- **@storybook/addon-essentials** - Controles, ações, viewport
- **@storybook/addon-a11y** - Verificação de acessibilidade
- **@storybook/addon-interactions** - Testes de interação
- **@storybook/addon-links** - Navegação entre stories
- **@storybook/addon-viewport** - Testes responsivos

## 📖 Escrevendo Stories

### Exemplo: Novo Componente

```javascript
// stories/componentes/MeuComponente.stories.js

export default {
  title: 'Starkën Design System/Componentes/Meu Componente',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Descrição do componente',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
      description: 'Variante do componente',
    },
  },
};

export const Primary = {
  args: {
    variant: 'primary',
  },
  render: (args) => `
    <div class="meu-componente meu-componente-${args.variant}">
      Conteúdo
    </div>
  `,
};
```

### Exemplo: Documentação MDX

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Starkën Design System/Categoria/Título" />

# Título da Página

Conteúdo da documentação em Markdown.

## Seção

Mais conteúdo...
```

## 🚀 Deploy

### Netlify / Vercel

```bash
# Build
npm run build-storybook

# Deploy a pasta storybook-static
```

### GitHub Pages

```bash
# Build
npm run build-storybook

# Commitegit add storybook-static
git commit -m "Deploy Storybook"
git subtree push --prefix storybook-static origin gh-pages
```

## 📊 Métricas

- **50+** Componentes documentados
- **200+** Design tokens
- **100%** Cobertura de acessibilidade WCAG AA
- **Responsivo** em todos os breakpoints

## ♿ Acessibilidade

Todos os componentes são testados com o addon de acessibilidade (@storybook/addon-a11y) que verifica:

✅ Contraste de cores
✅ Labels em formulários
✅ Hierarquia de headings
✅ Navegação por teclado
✅ ARIA attributes

## 🔗 Links Úteis

- **Design System CSS:** `../starken-design-system.css`
- **Design Tokens:** `../tokens.json`
- **Brand Guidelines:** `../BRAND_GUIDELINES.md`
- **Componentes HTML:** `../componentes/componentes-exemplos.html`

## 📞 Suporte

**Starkën Tecnologia**

- 🌐 Website: [starkentecnologia.com.br](https://starkentecnologia.com.br)
- 📸 Instagram: [@starkentec](https://instagram.com/starkentec)
- 📧 Email: contato@starkentecnologia.com.br

## 📄 Licença

© 2026 Starkën Tecnologia. Todos os direitos reservados.

Este Storybook e o Design System são proprietários e de uso exclusivo da Starkën Tecnologia.

---

**Versão:** 2.0
**Última atualização:** Janeiro 2026
