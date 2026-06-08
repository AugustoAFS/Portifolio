# CLAUDE.md — Portfólio AFS (Augusto Farias dos Santos)

## Visão geral do projeto

Portfólio pessoal de desenvolvedor fullstack. Site estático em HTML/CSS/JS vanilla (sem framework, sem bundler).
Deploy via GitHub Pages. Tema: dark dragon com efeitos de partículas de fogo e dragão animado SVG.

**Dono:** Augusto Farias dos Santos  
**Stack principal de trabalho:** .NET Core + Angular  
**Localização:** Curitiba, Brasil

---

## Estrutura de arquivos

```
Portifolio/
├── index.html                  ← único HTML, toda a aplicação
├── css/
│   ├── style.css               ← apenas @imports (ponto de entrada)
│   ├── base/
│   │   ├── variables.css       ← tokens CSS + tema claro [data-theme="light"]
│   │   └── reset.css           ← reset + .js-animate + scrollbar + transição de tema
│   ├── layout/
│   │   └── grid.css            ← .l-container, .l-section, .l-grid, .l-grid--columns-2/3
│   └── components/
│       ├── nav.css             ← header fixo, .header--scrolled, theme-toggle
│       ├── logo.css            ← animação SVG do dragão via CSS variables
│       ├── hero.css            ← hero, .btn, .btn--outline, .hero-greeting
│       ├── about.css           ← section-title (com linha gradiente ::after), about-text
│       ├── experience.css      ← timeline vertical + pontos + experience-item
│       ├── cards.css           ← project cards com linha de topo no hover
│       ├── contact.css         ← menu circular expansível + .contact-subtitle
│       └── footer.css          ← footer com gradiente no topo
├── js/
│   ├── main.js                 ← DOMContentLoaded → chama todos os init()
│   └── modules/
│       ├── nav.js              ← scroll usa classList.toggle('header--scrolled')
│       ├── animations.js       ← IntersectionObserver + autoplay de vídeos no viewport
│       ├── typing.js           ← efeito de digitação no hero
│       ├── contact.js          ← menu circular + aria-expanded + fecha com Escape
│       ├── link-fire.js        ← partículas de fogo nos links (canvas)
│       ├── logo.js             ← animação do dragão (canvas + CSS vars)
│       └── theme.js            ← dark/light toggle com localStorage
├── assets/
│   ├── icons/sprite.svg        ← sprite SVG (icon-bars, icon-github, icon-external-link, icon-download)
│   ├── images/
│   │   ├── profile.jpg         ← foto de perfil (LCP — tem preload no <head>)
│   │   └── achados-perdidos.png
│   └── videos/
│       └── Api_Clima.mp4
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
| `--color-primary-base` | `#FF416C` | Rosa — cor principal/destaque |
| `--color-primary-warm` | `#FF4B2B` | Laranja — gradientes |
| `--color-primary-hot` | `#EB5757` | Vermelho quente |
| `--color-accent-gold` | `#C5A059` | Dourado — destaques alternativos |
| `--color-text-main` | `#EAEAEA` | Texto principal |
| `--color-text-muted` | `#C5C6C7` | Texto secundário |

### Cores (light mode — `[data-theme="light"]`)
| Variável | Valor |
|---|---|
| `--color-bg-deep` | `#F0F2F5` |
| `--color-bg-surface` | `#FFFFFF` |
| `--color-bg-surface-light` | `#D4D8E0` |
| `--color-text-main` | `#1A1A2E` |
| `--color-text-muted` | `#4A5568` |

### Tipografia
- Títulos: `Cinzel` (Google Fonts) — `var(--font-family-title)`
- Corpo: `Inter` (Google Fonts) — `var(--font-family-base)`

### Espaçamento
`xs=0.25rem` · `sm=0.5rem` · `md=1rem` · `lg=1.5rem` · `xl=2rem` · `xxl=4rem`

### Animações
- `--duration-animation: 0.6s` / `--timing-animation: ease-out`
- `--transition-fast: 0.2s ease` / `--transition-normal: 0.3s ease-in-out`

---

## Padrões de código

### CSS
- Todas as cores e valores reutilizáveis devem usar `var()` de `variables.css`.
- Sem inline styles no HTML. Sem `style=""` nos elementos.
- Modificadores via classes BEM: `.block__element--modifier`.
- Classes JS prefixadas com `.js-` não devem ter estilos visuais.
- Para estados de scroll, use `.header--scrolled` (classe CSS) — nunca `element.style.*`.
- Para animações de entrada, use `.js-animate` (inicializado no JS) + `.is-visible` (JS adiciona).

### JavaScript
- Todos os módulos são `'use strict'` com `export function init*()`.
- Efeitos visuais complexos (canvas, partículas) ficam em módulos separados.
- IntersectionObserver para qualquer coisa ativada por scroll (não usar eventos `scroll` com cálculos pesados).
- Inline styles só são permitidos para estado inicial de animações progressivas (opacity/transform) — o `transition` fica no CSS.
- Keyboard accessibility obrigatório: `aria-expanded`, `aria-label`, `Escape` para fechar menus.

### HTML
- Imagem acima da dobra (hero): sem `loading="lazy"`, adicionar `fetchpriority="high"` e `<link rel="preload">` no `<head>`.
- Todas as outras imagens: `loading="lazy"`.
- Vídeos de projeto: `muted loop playsinline preload="metadata"` (sem `autoplay` — o JS cuida disso via IntersectionObserver).

---

## Modo claro/escuro

- Controlado pelo atributo `data-theme` na tag `<html>`.
- Valores: `"dark"` (padrão) | `"light"`.
- Persistido em `localStorage` com chave `afs-theme`.
- Respeita `prefers-color-scheme` se não houver preferência salva.
- Módulo: `js/modules/theme.js`.
- Botão: `.theme-toggle.js-theme-toggle` na navbar — ícone de sol (dark mode) / lua (light mode).
- Transição suave: `html[data-theme] *` recebe `transition: background-color/border-color/color`.

---

## Seções do portfólio

| Seção | ID | Número |
|---|---|---|
| Hero | — | — |
| Sobre Mim | `#about` | I. |
| Experiência | `#experience` | (sem número visível) |
| Projetos | `#projects` | III. |
| Contato | `#contact` | IV. |

### Experiências listadas
1. **Trabalha Brasil** — Desenvolvedor Backend C# (2025–Presente)
2. **BNE** — Desenvolvedor Fullstack Angular + ASP.NET Core (2024–2025)
3. **IFPR Campus Colombo** — Auxiliar de dev PHP/MySQL (2023–2024)

### Projetos listados
1. **API Achados e Perdidos** — Java + Spring + Swagger, em produção com app Android
2. **API de Clima** — React + Three.js + OpenStreetMap + WeatherAPI + Pexels

---

## Melhorias já feitas (para não repetir)

- Inline styles do scroll do header → classe `.header--scrolled` no CSS
- Transições de animação → movidas do JS para CSS (`.js-animate`)
- `loading="lazy"` removido da foto do hero, adicionada `fetchpriority="high"`
- Grid `.l-grid--columns-2/3` implementado com `display: grid` responsivo
- `contact.js` suporta `Escape` para fechar e tem `aria-expanded`
- Linha `::after` dos `section-title` tem gradiente rosa→transparente
- Timeline vertical na seção Experiência via pseudo-elementos CSS
- Cards têm linha de topo gradiente que desliza no hover (`.card::after`)
- Scrollbar customizada webkit no tema dark
- Open Graph tags, `theme-color`, `dns-prefetch` e `<link rel="preload">` para a foto
- Vídeo do projeto: autoplay/pause via IntersectionObserver
- `html[data-theme="light"]` com variáveis de tema claro completas

---

## O que ainda pode ser feito (próximas sessões)

- Adicionar mais projetos (seções Backend e Frontend estão com apenas 1 cada)
- Internacionalização PT/EN (estrutura não preparada ainda)
- Animação de entrada escalonada nos cards de projeto
- Testes de acessibilidade (NVDA/VoiceOver)
- Verificar Core Web Vitals em produção (LCP, CLS, FID)
- Considerar extrair o SVG do dragão para `assets/dragon.svg` (96 linhas inline no HTML)
