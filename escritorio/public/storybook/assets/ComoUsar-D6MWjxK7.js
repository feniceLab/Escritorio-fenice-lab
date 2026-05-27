import{j as n}from"./jsx-runtime-hHfaRg7l.js";import{M as i}from"./index-Dk_fxxrH.js";import{u as t}from"./index-BGCrCKzi.js";import"./iframe-Dk4lslzK.js";import"../sb-preview/runtime.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-Cu4lwwaE.js";import"./index-DvNeJ8cg.js";import"./index-DrFu-skq.js";const o=""+new URL("post-1-B8k6LWp_.png",import.meta.url).href,l=""+new URL("post-3-ByCkqKTP.png",import.meta.url).href;function r(s){const e=Object.assign({h1:"h1",p:"p",h2:"h2",h3:"h3",pre:"pre",code:"code",ul:"ul",li:"li",strong:"strong",div:"div",img:"img",ol:"ol",hr:"hr"},t(),s.components);return n.jsxs(n.Fragment,{children:[n.jsx(i,{title:"Starkën Design System/Introdução/Como Usar"}),`
`,n.jsx(e.h1,{id:"como-usar-o-design-system",children:"Como Usar o Design System"}),`
`,n.jsx(e.p,{children:"Este guia mostra como integrar e usar o Starkën Design System em seus projetos."}),`
`,n.jsx(e.h2,{id:"-instalação",children:"📦 Instalação"}),`
`,n.jsx(e.h3,{id:"via-npm-recomendado",children:"Via NPM (recomendado)"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-bash",children:`npm install @starken/design-system
`})}),`
`,n.jsx(e.h3,{id:"via-cdn",children:"Via CDN"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<link rel="stylesheet" href="https://cdn.starkentecnologia.com.br/design-system/v2/starken-design-system.css">
`})}),`
`,n.jsx(e.h3,{id:"download-manual",children:"Download Manual"}),`
`,n.jsx(e.p,{children:"Baixe os arquivos direto do repositório e inclua no seu projeto:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<link rel="stylesheet" href="./starken-design-system.css">
`})}),`
`,n.jsx(e.h2,{id:"-configuração",children:"🚀 Configuração"}),`
`,n.jsx(e.h3,{id:"html-puro",children:"HTML Puro"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Projeto</title>

    <!-- Importar fontes -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Design System CSS -->
    <link rel="stylesheet" href="starken-design-system.css">
</head>
<body>
    <div class="starken-container">
        <h1>Olá Mundo!</h1>
        <button class="starken-btn starken-btn-primary">Começar</button>
    </div>
</body>
</html>
`})}),`
`,n.jsx(e.h3,{id:"react",children:"React"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-jsx",children:`// App.jsx
import '@starken/design-system/dist/starken-design-system.css';

function App() {
  return (
    <div className="starken-container">
      <h1>Olá Mundo!</h1>
      <button className="starken-btn starken-btn-primary">
        Começar
      </button>
    </div>
  );
}

export default App;
`})}),`
`,n.jsx(e.h3,{id:"vuejs",children:"Vue.js"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-vue",children:`<!-- App.vue -->
<template>
  <div class="starken-container">
    <h1>Olá Mundo!</h1>
    <button class="starken-btn starken-btn-primary">
      Começar
    </button>
  </div>
</template>

<script>
import '@starken/design-system/dist/starken-design-system.css';

export default {
  name: 'App'
}
<\/script>
`})}),`
`,n.jsx(e.h3,{id:"nextjs",children:"Next.js"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-jsx",children:`// pages/_app.js
import '@starken/design-system/dist/starken-design-system.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp;
`})}),`
`,n.jsx(e.h2,{id:"-usando-variáveis-css",children:"🎨 Usando Variáveis CSS"}),`
`,n.jsx(e.p,{children:"O design system fornece todas as cores, espaçamentos e outros tokens como variáveis CSS:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-css",children:`.meu-componente-customizado {
  /* Cores */
  background: var(--starken-color-bg-surface);
  color: var(--starken-color-text-primary);

  /* Espaçamento */
  padding: var(--starken-spacing-4);
  margin-bottom: var(--starken-spacing-6);

  /* Bordas */
  border-radius: var(--starken-radius-md);
  border: 1px solid var(--starken-color-border-default);

  /* Transições */
  transition: all var(--starken-duration-normal) var(--starken-easing-default);
}

.meu-componente-customizado:hover {
  border-color: var(--starken-color-border-hover);
  box-shadow: var(--starken-shadow-glow);
}
`})}),`
`,n.jsx(e.h2,{id:"-usando-componentes",children:"🧩 Usando Componentes"}),`
`,n.jsx(e.h3,{id:"botões",children:"Botões"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<!-- Primário -->
<button class="starken-btn starken-btn-primary">
  Começar Agora
</button>

<!-- Secundário -->
<button class="starken-btn starken-btn-secondary">
  Saiba Mais
</button>

<!-- Ghost -->
<button class="starken-btn starken-btn-ghost">
  Cancelar
</button>

<!-- Tamanhos -->
<button class="starken-btn starken-btn-primary starken-btn-sm">Pequeno</button>
<button class="starken-btn starken-btn-primary">Médio (padrão)</button>
<button class="starken-btn starken-btn-primary starken-btn-lg">Grande</button>
`})}),`
`,n.jsx(e.h3,{id:"cards",children:"Cards"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<div class="starken-card">
  <div class="starken-card-header">
    <h3 class="starken-card-title">Título do Card</h3>
    <p class="starken-card-description">Descrição breve</p>
  </div>
  <div class="starken-card-body">
    <p>Conteúdo principal do card...</p>
  </div>
  <div class="starken-card-footer">
    <button class="starken-btn starken-btn-secondary starken-btn-sm">
      Ação
    </button>
  </div>
</div>
`})}),`
`,n.jsx(e.h3,{id:"formulários",children:"Formulários"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<form>
  <div>
    <label class="starken-label" for="nome">Nome</label>
    <input
      type="text"
      id="nome"
      class="starken-input"
      placeholder="Digite seu nome"
    >
  </div>

  <div>
    <label class="starken-label" for="email">E-mail</label>
    <input
      type="email"
      id="email"
      class="starken-input"
      placeholder="seu@email.com"
    >
  </div>

  <div>
    <label class="starken-label" for="mensagem">Mensagem</label>
    <textarea
      id="mensagem"
      class="starken-input starken-textarea"
      placeholder="Sua mensagem..."
    ></textarea>
  </div>

  <button type="submit" class="starken-btn starken-btn-primary">
    Enviar
  </button>
</form>
`})}),`
`,n.jsx(e.h2,{id:"-classes-utilitárias",children:"🎯 Classes Utilitárias"}),`
`,n.jsx(e.h3,{id:"tipografia",children:"Tipografia"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<h1 class="text-6xl font-bold text-emerald">Hero Title</h1>
<h2 class="text-4xl font-bold">H1 Title</h2>
<p class="text-base text-secondary">Parágrafo normal</p>
<small class="text-sm text-muted">Texto pequeno</small>
`})}),`
`,n.jsx(e.h3,{id:"cores-de-texto",children:"Cores de Texto"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<p class="text-primary">Texto primário (branco)</p>
<p class="text-secondary">Texto secundário (cinza claro)</p>
<p class="text-muted">Texto muted (cinza escuro)</p>
<p class="text-emerald">Texto verde (marca)</p>
`})}),`
`,n.jsx(e.h3,{id:"backgrounds",children:"Backgrounds"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<div class="bg-dark">Background escuro</div>
<div class="bg-surface">Background surface</div>
<div class="bg-elevated">Background elevado</div>
<div class="bg-gradient">Background gradiente</div>
`})}),`
`,n.jsx(e.h2,{id:"-responsividade",children:"📱 Responsividade"}),`
`,n.jsx(e.p,{children:"O design system é totalmente responsivo por padrão. Use o container para layouts responsivos:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<div class="starken-container">
  <!-- Conteúdo com margens automáticas e responsive -->
</div>
`})}),`
`,n.jsx(e.p,{children:"Breakpoints disponíveis:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"sm:"})," 640px"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"md:"})," 768px"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"lg:"})," 1024px"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"xl:"})," 1280px"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"2xl:"})," 1536px"]}),`
`]}),`
`,n.jsx(e.h2,{id:"-templates-de-marketing",children:"📣 Templates de Marketing"}),`
`,n.jsx(e.p,{children:"Além dos componentes de interface, o design system também contempla assets prontos para comunicação da marca."}),`
`,n.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:"1.5rem",marginTop:"2rem",marginBottom:"2rem"},children:[{title:"Post 1",src:o,description:"Template institucional para peças de marca, campanhas e anúncios com foco em posicionamento."},{title:"Post 3",src:l,description:"Template para conteúdos de tecnologia, serviços e comunicações com apelo mais técnico."}].map(a=>n.jsxs(e.div,{style:{background:"#0f172a",padding:"1.25rem",borderRadius:"12px",border:"1px solid rgba(255, 255, 255, 0.1)"},children:[n.jsx(e.div,{style:{overflow:"hidden",borderRadius:"10px",marginBottom:"1rem",border:"1px solid rgba(255, 255, 255, 0.08)"},children:n.jsx(e.img,{src:a.src,alt:a.title,style:{width:"100%",display:"block"}})}),n.jsx(e.h3,{style:{color:"#10b981",marginBottom:"0.5rem"},children:a.title}),n.jsx(e.p,{style:{color:"#94a3b8",fontSize:"0.875rem",margin:0},children:a.description})]},a.title))}),`
`,n.jsx(e.h3,{id:"boas-práticas-para-uso-desses-assets",children:"Boas práticas para uso desses assets"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Preserve a proporção original dos arquivos"}),`
`,n.jsx(e.li,{children:"Use a logo branca em fundos escuros e a principal em superfícies neutras"}),`
`,n.jsx(e.li,{children:"Evite aplicar efeitos extras ou alterar a paleta da marca"}),`
`,n.jsx(e.li,{children:"Prefira os templates de post como base visual, mantendo consistência entre campanhas"}),`
`]}),`
`,n.jsx(e.h2,{id:"-acessibilidade",children:"♿ Acessibilidade"}),`
`,n.jsx(e.p,{children:"Todas as combinações de cores atendem WCAG 2.1 nível AA. Sempre:"}),`
`,n.jsx(e.p,{children:`✅ Use labels semânticos em formulários
✅ Forneça alt text em imagens
✅ Mantenha contraste adequado
✅ Use headings hierárquicos (H1 → H2 → H3)`}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<!-- ✅ BOM -->
<label class="starken-label" for="email">E-mail</label>
<input type="email" id="email" class="starken-input" aria-required="true">

<!-- ❌ RUIM -->
<input type="email" class="starken-input" placeholder="E-mail">
`})}),`
`,n.jsx(e.h2,{id:"-customização",children:"🔧 Customização"}),`
`,n.jsx(e.h3,{id:"sobrescrever-variáveis",children:"Sobrescrever variáveis"}),`
`,n.jsx(e.p,{children:"Você pode sobrescrever as variáveis CSS para customizar:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-css",children:`:root {
  /* Alterar cor primária */
  --starken-color-brand-emerald: #your-color;

  /* Alterar espaçamento base */
  --starken-spacing-4: 1.25rem;

  /* Alterar fonte */
  --starken-font-family-primary: 'Sua Fonte', sans-serif;
}
`})}),`
`,n.jsx(e.h3,{id:"criar-componentes-customizados",children:"Criar componentes customizados"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-css",children:`.meu-card-especial {
  /* Usar tokens do design system */
  background: var(--starken-color-bg-surface);
  padding: var(--starken-spacing-6);
  border-radius: var(--starken-radius-lg);

  /* + suas customizações */
  border-left: 4px solid var(--starken-color-brand-emerald);
}
`})}),`
`,n.jsx(e.h2,{id:"-próximos-passos",children:"📚 Próximos Passos"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:["Explore os ",n.jsx(e.strong,{children:"Fundamentos"})," para conhecer cores, tipografia e espaçamento"]}),`
`,n.jsxs(e.li,{children:["Veja todos os ",n.jsx(e.strong,{children:"Componentes"})," disponíveis"]}),`
`,n.jsxs(e.li,{children:["Leia os ",n.jsx(e.strong,{children:"Padrões"})," de uso e best practices"]}),`
`]}),`
`,n.jsx(e.h2,{id:"-dicas",children:"💡 Dicas"}),`
`,n.jsxs(e.ol,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Sempre use as classes do design system"})," ao invés de CSS inline"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Use variáveis CSS"})," para manter consistência"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Siga a hierarquia de headings"})," (H1 → H2 → H3)"]}),`
`,n.jsx(e.li,{children:n.jsx(e.strong,{children:"Teste em diferentes tamanhos de tela"})}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Valide acessibilidade"})," com ferramentas como Lighthouse"]}),`
`]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.p,{children:"Precisa de ajuda? Entre em contato com a equipe de design da Starkën Tecnologia."})]})}function b(s={}){const{wrapper:e}=Object.assign({},t(),s.components);return e?n.jsx(e,Object.assign({},s,{children:n.jsx(r,s)})):r(s)}export{b as default};
