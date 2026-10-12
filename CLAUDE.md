# CLAUDE.md — Portfólio AFS (Augusto Farias dos Santos)

## Visão geral do projeto

Portfólio pessoal de desenvolvedor fullstack. Site estático em HTML/CSS/JS vanilla (sem framework, sem bundler).
Deploy via GitHub Pages em `augustosantos.com.br`. Tema: dark dragon com efeitos de partículas de fogo e dragão animado SVG.

**Dono:** Augusto Farias dos Santos  
**Stack principal de trabalho:** .NET Core + Angular  
**Localização:** Curitiba, Brasil

---

## Estrutura de arquivos

```
Portifolio/
├── index.html                  ← único HTML; cada CSS em <link> próprio; main.js + modulepreload no <head>
├── css/
│   ├── base/
│   │   ├── fonts.css           ← @font-face de Cinzel e Inter (self-hosted)
│   │   ├── variables.css       ← tokens CSS (cores, brilhos, degradês, curvas, foco) + tema claro + color-scheme
│   │   ├── reset.css           ← reset, scrollbar nativa, .js-animate, .u-visually-hidden, prefers-reduced-motion
│   │   └── patterns.css        ← estilos gerais repetidos entre componentes (foco, caixa alta, botões
│   │                              redondos, .fire-canvas, @keyframes fade-slide-in)
│   ├── layout/
│   │   └── grid.css            ← .l-container, .l-section, .l-grid, .l-grid--columns-2
│   └── components/
│       ├── nav.css             ← header fixo, .header--scrolled, menu mobile (popover), theme-toggle
│       ├── logo.css            ← .nav-logo + pose de repouso do dragão (partes com classes .dragon-*)
│       ├── hero.css            ← hero, .btn, .btn--outline, efeito de digitação (.typing-char)
│       ├── about.css           ← section-title (com linha de brilho ::after), about-text, foto do hero
│       ├── experience.css      ← timeline vertical + pontos + experience-item
│       ├── cards.css           ← project cards com linha de topo no hover
│       ├── contact.css         ← menu radial de contato + .contact-subtitle
│       └── footer.css          ← footer com linha de brilho no topo
├── js/
│   ├── main.js                 ← orquestrador: essenciais depois da 1ª pintura; o resto via import() sob demanda
│   ├── core/                   ← utilitários compartilhados
│   │   ├── env.js              ← REDUCED_MOTION, IS_TOUCH (media queries nativas)
│   │   ├── lazy.js             ← run, load (import dinâmico), afterFirstPaint, whenIdle, whenVisible, onFirstPointer
│   │   ├── storage.js          ← localStorage seguro (try/catch)
│   │   └── canvas.js           ← cores do fogo, densidade de pixels, limpar canvas, sprites de brilho
│   └── modules/
│       ├── theme.js            ← essencial — tema com View Transitions + meta theme-color + tema do sistema
│       ├── nav.js              ← essencial — header--scrolled via IntersectionObserver, menu popover nativo
│       ├── typing.js           ← essencial — digitação no hero (letras em spans, layout fixo)
│       ├── reveal.js           ← essencial — entrada dos blocos .js-animate (só o que está fora da tela)
│       ├── logo.js             ← quando ocioso — dragão: pose com Web Animations API + sopro em canvas, 30 fps
│       ├── contact.js          ← perto do #contact — menu radial: abre sozinho, aria-expanded, Escape
│       ├── video.js            ← perto do vídeo — autoplay respeitando a pausa manual
│       └── link-fire.js        ← no 1º mouse na navbar / perto do contato — faíscas do hover (canvas)
├── assets/
│   ├── fonts/                  ← cinzel-latin.woff2, inter-latin.woff2 + OFL-*.txt (licenças)
│   ├── icons/
│   │   ├── sprite.svg          ← sprite SVG (icon-bars, icon-github, icon-external-link, icon-download…)
│   │   ├── favicon.svg         ← silhueta do dragão
│   │   ├── apple-touch-icon.png
│   │   └── *.svg               ← logos das tecnologias dos cards
│   ├── images/
│   │   ├── profile.webp/.jpg   ← foto do hero, 640×640 (LCP — preload do .webp no <head>)
│   │   ├── og-image.jpg        ← card 1200×630 para LinkedIn/WhatsApp
│   │   ├── api-clima-poster.webp
│   │   └── achados-perdidos.png
│   └── videos/
│       └── Api_Clima.mp4       ← 960×540, 30fps, sem áudio, faststart (~1 MB)
└── PDF/
    └── Curriculo-Augusto-Farias-dos-Santos.pdf
```

---

## Design system (variables.css)

### Cores (dark mode — padrão)
| Variável | Valor | Uso |
|---|---|---|
| `--color-bg-deep` | `#0B0C10` | Background principal |
| `--color-bg-surface` | `#1F2833` | Cards, superfícies |
| `--color-bg-surface-light` | `#2A3644` | Bordas, separadores |
| `--color-primary-base` | `#FF416C` | Rosa — bordas, gradientes, brilhos |
| `--color-primary-warm` | `#FF4B2B` | Laranja — gradientes |
| `--color-primary-hot` | `#EB5757` | Vermelho quente |
| `--color-accent-gold` | `#C5A059` | Dourado — destaques alternativos |
| `--color-text-main` | `#EAEAEA` | Texto principal |
| `--color-text-muted` | `#C5C6C7` | Texto secundário |
| `--color-primary-ink` | `#FF5277` | Rosa para **texto** (AA ≥ 4.5:1) |
| `--color-warm-ink` | `#FF5C3D` | Laranja para **texto** (AA ≥ 4.5:1) |
| `--color-on-primary` | `#0B0C10` | Texto sobre preenchimento rosa/laranja (hover do `.btn`) |
| `--color-divider` | `rgba(255,255,255,.05)` | Linhas sutis (rodapé) |

Regra: `--color-primary-base/warm` só para bordas, gradientes e brilhos; **texto usa `--color-*-ink`**.
Tokens de componente: `--color-header-*`, `--color-menu-*`, `--color-contact-border` / `--shadow-contact`,
`--color-code-bg-start/end` (prévia "janela de código", escura nos dois temas). `--scroll-offset` compensa o header
fixo ao rolar até âncoras (`scroll-padding-top`).

### Brilhos, degradês e foco (nunca escrever `rgba(255, 65, 108, …)` à mão)
- Escala de brilho rosa, derivada de `--color-primary-base` com `color-mix()`: `--color-glow-faint` (8%),
  `-subtle` (15%), `-soft` (25%), `--color-glow` (40%), `-line` (50%), `-strong` (60%), `-border` (75%).
- Sombras de brilho: `--shadow-glow-sm` / `-md` / `-lg`. Degradê de fogo: `--gradient-fire`.
- Foco: `--focus-ring` + `--focus-offset` (aplicados a todo `:focus-visible` em `patterns.css`).
- `color-scheme` (dark/light) declarado junto dos tokens: barras de rolagem e controles nativos seguem o tema.

### Cores (light mode — `[data-theme="light"]`)
| Variável | Valor |
|---|---|
| `--color-bg-deep` | `#F0F2F5` |
| `--color-bg-surface` | `#FFFFFF` |
| `--color-bg-surface-light` | `#D4D8E0` |
| `--color-text-main` | `#1A1A2E` |
| `--color-text-muted` | `#4A5568` |
| `--color-primary-ink` | `#C81E4A` |
| `--color-warm-ink` | `#B4361C` |

### Tipografia
- Títulos: `Cinzel` — `var(--font-family-title)`
- Corpo: `Inter` — `var(--font-family-base)`
- Fontes self-hosted em `assets/fonts/` (variáveis, subset latin, `font-display: swap`, preload no `<head>`).
  Licença OFL: manter os `OFL-*.txt` junto dos arquivos.

### Espaçamento
`xs=0.25rem` · `sm=0.5rem` · `md=1rem` · `lg=1.5rem` · `xl=2rem` · `xxl=4rem`

### Animações
- `--duration-animation: 0.6s` / `--timing-animation: ease-out`
- `--transition-fast: 0.2s ease` / `--transition-normal: 0.3s ease-in-out` / `--transition-slow: 0.4s var(--ease-standard)`
- Curvas: `--ease-standard` (cubic-bezier(0.4, 0, 0.2, 1)) e `--ease-spring` (com "quique")
- Keyframes compartilhado `fade-slide-in` (patterns.css); a distância vem de `--slide-from`

---

## Padrões de código

### CSS
- Todas as cores e valores reutilizáveis devem usar `var()` de `variables.css`.
- Sem inline styles no HTML. Sem `style=""` nos elementos.
- Modificadores via classes BEM: `.block__element--modifier`. Utilitários com prefixo `u-` (ex.: `.u-visually-hidden`).
- Classes JS prefixadas com `.js-` não devem ter estilos visuais.
- Para estados de scroll, use `.header--scrolled` (classe CSS) — nunca `element.style.*`.
- Para animações de entrada, use `.js-animate` (inicializado no JS) + `.is-visible` (JS adiciona).
- Conteúdo nunca pode depender só de JS: estados iniciais ocultos usam `.js` (adicionada ao `<html>` por um
  script inline no `<head>`) e precisam de failsafe — ex.: texto do hero aparece sozinho após 3s; sem JS o
  menu de contato já nasce aberto.
- Movimento: `prefers-reduced-motion` é tratado globalmente em `reset.css`; os módulos de efeito nem são carregados.
- Nada de `transition: all`. Padrão: `transition: var(--transition-normal); transition-property: a, b, c;`.
- Estilo que se repete em mais de um componente vai para `patterns.css` (seletores agrupados) ou vira token;
  antes de criar uma regra nova, procurar se já existe um padrão ou token para a mesma coisa.
- Sem `will-change` permanente e sem `backdrop-filter` sobre fundo opaco (custa GPU e não aparece).
- Sem transição global em `*`: a troca de tema usa View Transitions (theme.js).

### JavaScript
- Todos os módulos são `'use strict'` com `export function init*()` e funções pequenas, uma responsabilidade cada.
- `main.js` decide **quando** cada módulo roda: os essenciais (tema, menu, digitação, entrada) logo depois da
  primeira pintura (`afterFirstPaint`); os demais são baixados com `import()` dinâmico só quando necessários
  (`whenIdle`, `whenVisible`, `onFirstPointer` em `core/lazy.js`). Módulo novo entra nessa lista, nunca no carregamento.
- Preferir recursos nativos do navegador a reimplementar em JS: Popover API (menu), Web Animations API (pose do
  dragão), View Transitions (tema), IntersectionObserver, ResizeObserver, `requestIdleCallback`, `matchMedia`.
- Utilitários compartilhados ficam em `js/core/` (não duplicar `matchMedia`, cores do fogo, acesso a storage etc.).
- Efeitos visuais complexos (canvas, partículas) ficam em módulos separados; com `prefers-reduced-motion` o
  `main.js` nem os carrega. Partículas usam sprites (`glowSprite`) em vez de `shadowBlur` a cada quadro.
- Animações decorativas pequenas rodam a 30 fps (`TICK_MS` no logo.js) e pausam fora da tela.
- Canvas: `globalAlpha` sempre limitado a 0–1 (o canvas ignora valores fora disso e desenha com opacidade total)
  e, ao parar um loop de `requestAnimationFrame`, limpar o canvas — senão o último quadro fica congelado na tela.
- IntersectionObserver para qualquer coisa ativada por scroll (nenhum listener de `scroll` na página).
- Inline styles só são permitidos para estado inicial de animações progressivas (opacity/transform) — o `transition`
  fica no CSS. Posição e tamanho de elementos criados pelo JS vêm de classes CSS (ex.: `.fire-canvas`).
- Keyboard accessibility obrigatório: `aria-expanded`, `aria-label`, `Escape` para fechar menus.
  `aria-label` precisa conter o texto visível do elemento (WCAG 2.5.3).
- Links de âncora usam a rolagem nativa (não usar `preventDefault` + `scrollTo`): mantém o `#hash` e o foco.
- `main.js` roda cada `init*()` isolado em `try/catch`: um módulo com erro não derruba os outros.
- `localStorage` sempre dentro de `try/catch` (lança `SecurityError` quando o navegador bloqueia dados do site).

### HTML
- Imagem acima da dobra (hero): sem `loading="lazy"`, com `fetchpriority="high"` e `<link rel="preload">` no `<head>`.
  Nada acima da dobra usa `.js-animate` (atrasaria o LCP).
- Todas as outras imagens: `loading="lazy"`.
- Vídeos de projeto: `muted loop playsinline controls preload="none"` + `poster` (sem `autoplay` — o video.js
  cuida disso quando o vídeo se aproxima e respeita a pausa manual).
- JS: `<script type="module" src="js/main.js">` no `<head>` + `modulepreload` dos módulos essenciais.
- Menu mobile: `<ul popover>` + botão com `popovertarget` (o aria-expanded é nativo; não escrever à mão).
- Hierarquia de títulos: h1 (hero) → h2 (seções e colunas do footer) → h3 (categorias) → h4 (cards).
- Open Graph com URLs absolutas (`https://augustosantos.com.br/...`).

---

## Modo claro/escuro

- Controlado pelo atributo `data-theme` na tag `<html>`.
- Valores: `"dark"` (padrão sem JS) | `"light"`.
- Aplicado por um script inline no `<head>` antes da primeira pintura (sem flash); o mesmo script adiciona `.js`.
- Persistido em `localStorage` com chave `afs-theme`.
- Respeita `prefers-color-scheme` se não houver preferência salva — e acompanha a mudança do sistema em tempo real.
- Módulo: `js/modules/theme.js` (sincroniza o botão e o `<meta name="theme-color">`).
- Botão: `.theme-toggle.js-theme-toggle` na navbar — ícone de sol (dark mode) / lua (light mode);
  o `aria-label` descreve a ação ("Ativar modo claro/escuro"), sem `aria-pressed`.
- Transição: View Transitions API (cross-fade nativo da página); sem suporte ou com movimento reduzido, troca direta.

---

## Seções do portfólio

| Seção | ID | Número |
|---|---|---|
| Hero | — | — |
| Sobre Mim | `#about` | I. |
| Experiência | `#experience` | II. |
| Projetos | `#projects` | III. |
| Contato | `#contact` | IV. |

Todos os títulos de seção ficam alinhados à esquerda, com número e linha gradiente.

### Experiências listadas
1. **Trabalha Brasil** — Desenvolvedor Backend C# (2025–Presente)
2. **BNE** — Desenvolvedor Fullstack Angular + ASP.NET Core (2024–2025)
3. **IFPR Campus Colombo** — Auxiliar de dev PHP/MySQL (2023–2024)

### Projetos listados
Back-end:
1. **API de Gestão de Inventário** — C#/.NET, SQL Server, Redis, Docker
2. **API Achados e Perdidos** — Java + Spring + Swagger, com app Android

Front-end:
3. **Dashboard de Gestão de Inventário** — Angular 21 + TypeScript + Docker
4. **API de Clima** — React + Three.js + OpenStreetMap + WeatherAPI + Pexels

---

## Melhorias já feitas (para não repetir)

- Inline styles do scroll do header → classe `.header--scrolled` no CSS
- Transições de animação → movidas do JS para CSS (`.js-animate`)
- Grid `.l-grid--columns-2/3` implementado com `display: grid` responsivo
- Linha `::after` dos `section-title` tem gradiente rosa→transparente
- Timeline vertical na seção Experiência via pseudo-elementos CSS
- Cards têm linha de topo gradiente que desliza no hover (`.card::after`)
- Scrollbar customizada webkit no tema dark
- Audit + correções (2026-10-11):
  - Tema claro: tokens de texto AA (`*-ink`, `--color-on-primary`), contato legível, "janela de código" escura
    nos dois temas, sem `text-shadow` no título, tema aplicado no `<head>` (sem flash), `theme-color` dinâmico
  - Mobile: página não alarga mais (canvas do contato com `overflow-x: clip`, anel responsivo), header cabe abaixo
    de 375px, sem vazio sob os cargos da Experiência, footer em 1→2→4 colunas
  - Hero: título cabe na coluna ao lado da foto; digitação sem mexer no layout (CLS ~0) e acessível
    (texto completo para leitor de tela); nada do hero depende de JS
  - A11y: nomes acessíveis contêm o texto visível, Escape no menu mobile, âncoras nativas (foco + hash),
    links do contato fora do Tab quando fechado, `prefers-reduced-motion` em CSS e JS, vídeo com controles e
    poster, títulos h1→h2→h3→h4, contato dentro do `<main>` e abrindo sozinho ao aparecer
  - Performance: foto 1,26 MB → 95 KB (WebP 640px), vídeo 53,8 MB → 1 MB, fontes self-hosted com preload,
    CSS em `<link>` paralelos, sem `.js-animate` no hero, dragão do footer pausa fora da tela
  - Correções: SVG do dragão sem aspas escapadas e sem IDs duplicados, favicon + apple-touch-icon,
    `og:image` absoluto (card 1200×630), `<title>` descritivo, link de APK quebrado removido
  - Fogo do hover (`link-fire.js`) sem vestígio: alpha limitado a 0–1, partícula morta não é desenhada,
    canvas limpo por inteiro quando o fogo apaga, fade 3× mais rápido ao tirar o mouse, animação por tempo
    (igual em 60/144 Hz); mesma correção de alpha nas partículas do dragão (`logo.js`)
- Performance JS/CSS (2026-10-12), medido com CPU 4× mais lenta (thread principal, antes → depois):
  página parada −37% (desktop) / −60% (celular), rolagem −26%, troca de tema −33%, carregamento −28%
  (script −64%, estilo −56%), LCP 1.046 → 912 ms
  - JS em `core/` + módulos sob demanda (`import()`), essenciais depois da 1ª pintura, `modulepreload`
  - Dragão: pose com Web Animations API num relógio único de 30 fps, partículas com sprites, pausa fora da tela,
    clone do footer só quando ele se aproxima
  - Fogo do hover: módulo e canvas criados só no primeiro hover (antes: 3 canvas alocados no carregamento)
  - Nativos: Popover API no menu mobile (com ancoragem CSS), View Transitions no tema, IntersectionObserver no
    header (sem listener de scroll), `color-scheme`, `scrollbar-color`, vídeo com `preload="none"`
  - CSS: tokens de brilho/degradê/curvas/foco, `patterns.css` para estilos repetidos, sem transição global em `*`,
    sem `transition: all`, sem `backdrop-filter`/`will-change` inúteis, 10 seletores mortos removidos,
    `.nav-logo` sem `!important`

---

## O que ainda pode ser feito (próximas sessões)

### Depende do dono do site
- Repositórios `Inventory-Management` e `API-Achados-Perdidos-java-21` estão privados/inexistentes no GitHub
  (404 para visitantes) — 3 dos 4 cards apontam para eles: tornar públicos ou trocar os links
- `api-achadosperdidos.com.br` não resolve no DNS (link "API em PRD" e o texto "Em produção" do card)
- APK do app Achados e Perdidos: o build local sumiu; publicar (ex.: GitHub Releases) e religar o link no card

### Melhorias
- Adicionar mais projetos
- Internacionalização PT/EN (estrutura não preparada ainda)
- Animação de entrada escalonada nos cards de projeto
- Testes de acessibilidade com leitor de tela real (NVDA/VoiceOver)
- Verificar Core Web Vitals em produção depois do deploy
- Considerar extrair o SVG do dragão para `assets/dragon.svg` (96 linhas inline no HTML)
- Alvos de toque de 44px nos botões de menu e tema (hoje 30×24 e 32×32 — passam no mínimo de 24px)
