# Stitch Design Token System
## Extracted from 5 Stitch HTML Files
### Source files:
- task_list_redesign_2/code.html
- weekly_post_planner_2/code.html
- post_editor_modal_2/code.html
- starken_dashboard_v2.0_2/code.html
- gerenciar_clientes/code.html

---

## 1. TAILWIND CONFIG — COMPLETE COLOR PALETTE

All five files share an identical Tailwind config. Every token below is canonical.

```
Token Name                    → Hex Value
─────────────────────────────────────────────────────
primary                       → #2a4dd7
secondary                     → #4648d4
tertiary                      → #712ae2

primary-container             → #4868f1
secondary-container           → #6063ee
tertiary-container            → #8a4cfc

primary-fixed                 → #dde1ff
primary-fixed-dim             → #b9c3ff
secondary-fixed               → #e1e0ff
secondary-fixed-dim           → #c0c1ff
tertiary-fixed                → #eaddff
tertiary-fixed-dim            → #d2bbff

on-primary                    → #ffffff
on-secondary                  → #ffffff
on-tertiary                   → #ffffff
on-primary-container          → #fffbff
on-secondary-container        → #fffbff
on-tertiary-container         → #fffbff
on-primary-fixed              → #001257
on-primary-fixed-variant      → #0034c0
on-secondary-fixed            → #07006c
on-secondary-fixed-variant    → #2f2ebe
on-tertiary-fixed             → #25005a
on-tertiary-fixed-variant     → #5a00c6

surface                       → #f7f9fc
surface-bright                → #f7f9fc
surface-dim                   → #d8dadd
surface-variant               → #e0e3e6
surface-tint                  → #2d50d9

surface-container-lowest      → #ffffff
surface-container-low         → #f2f4f7
surface-container             → #eceef1
surface-container-high        → #e6e8eb
surface-container-highest     → #e0e3e6

on-surface                    → #191c1e
on-surface-variant            → #444654
on-background                 → #191c1e
background                    → #f7f9fc

outline                       → #747686
outline-variant               → #c4c5d7

inverse-surface               → #2d3133
inverse-on-surface            → #eff1f4
inverse-primary               → #b9c3ff

error                         → #ba1a1a
on-error                      → #ffffff
error-container               → #ffdad6
on-error-container            → #93000a
```

### Hardcoded Colors (used directly in class attributes, not via tokens)

```
[#191b23]   → Sidebar background (near-black navy)
[#2a4dd7]   → Primary (also used hardcoded in some nav active states)
[#6366f1]   → Indigo-500 equivalent (sidebar active border in gerenciar_clientes)
[#2e7d32]   → Green-800 (status "Ativo", success green, save button)
[#ed6c02]   → Orange (warning/pending state)
[#0288d1]   → Light blue (schedule status chip, FB indicator dot)
indigo-500  → #6366f1 (sidebar active bg and border via Tailwind default)
```

---

## 2. TRANSLATION TABLE — Tailwind Class → CSS Property: Value

### Colors

```
bg-surface                    → background-color: #f7f9fc
bg-surface-container-lowest   → background-color: #ffffff
bg-surface-container-low      → background-color: #f2f4f7
bg-surface-container          → background-color: #eceef1
bg-surface-container-high     → background-color: #e6e8eb
bg-surface-container-highest  → background-color: #e0e3e6
bg-surface-dim                → background-color: #d8dadd
bg-background                 → background-color: #f7f9fc
bg-[#191b23]                  → background-color: #191b23
bg-primary                    → background-color: #2a4dd7
bg-primary-container          → background-color: #4868f1
bg-primary/5                  → background-color: rgba(42, 77, 215, 0.05)
bg-primary/10                 → background-color: rgba(42, 77, 215, 0.10)
bg-secondary                  → background-color: #4648d4
bg-secondary/5                → background-color: rgba(70, 72, 212, 0.05)
bg-tertiary                   → background-color: #712ae2
bg-tertiary-container         → background-color: #8a4cfc
bg-error                      → background-color: #ba1a1a
bg-outline-variant            → background-color: #c4c5d7

text-on-surface               → color: #191c1e
text-on-surface-variant       → color: #444654
text-on-background            → color: #191c1e
text-primary                  → color: #2a4dd7
text-secondary                → color: #4648d4
text-tertiary                 → color: #712ae2
text-on-primary               → color: #ffffff
text-on-secondary             → color: #ffffff
text-outline                  → color: #747686
text-outline-variant          → color: #c4c5d7
text-error                    → color: #ba1a1a
text-white                    → color: #ffffff
text-white/40                 → color: rgba(255, 255, 255, 0.40)
text-white/60                 → color: rgba(255, 255, 255, 0.60)
text-white/80                 → color: rgba(255, 255, 255, 0.80)

border-primary                → border-color: #2a4dd7
border-outline-variant        → border-color: #c4c5d7
border-outline-variant/10     → border-color: rgba(196, 197, 215, 0.10)
border-outline-variant/30     → border-color: rgba(196, 197, 215, 0.30)
border-white/10               → border-color: rgba(255, 255, 255, 0.10)
border-indigo-500             → border-color: #6366f1
```

### Typography

```
font-family: Inter             → font-family: 'Inter', sans-serif
                                 (used for headline, body, label roles)

text-[9px]                    → font-size: 9px
text-[10px]                   → font-size: 10px
text-[11px]                   → font-size: 11px
text-[12px]                   → font-size: 12px
text-[13px]                   → font-size: 13px   ← primary body size
text-[14px]                   → font-size: 14px
text-[16px]                   → font-size: 16px
text-[18px]                   → font-size: 18px
text-lg                       → font-size: 1.125rem (18px)
text-xl                       → font-size: 1.25rem  (20px)
text-2xl                      → font-size: 1.5rem   (24px)
text-3xl                      → font-size: 1.875rem (30px)
text-[22px]                   → font-size: 22px    (modal title)
text-4xl                      → font-size: 2.25rem (icon in video card)

font-normal                   → font-weight: 400
font-medium                   → font-weight: 500
font-semibold                 → font-weight: 600
font-bold                     → font-weight: 700
font-extrabold                → font-weight: 800

tracking-tight                → letter-spacing: -0.025em
tracking-[0.5px]              → letter-spacing: 0.5px
tracking-[0.8px]              → letter-spacing: 0.8px  ← sidebar label standard
tracking-wider                → letter-spacing: 0.05em
tracking-widest               → letter-spacing: 0.1em
uppercase                     → text-transform: uppercase

.sidebar-label                → font-size: 11px; letter-spacing: 0.8px; font-weight: 700
```

### Spacing

```
p-1                           → padding: 0.25rem  (4px)
p-1.5                         → padding: 0.375rem (6px)
p-2                           → padding: 0.5rem   (8px)
p-2.5                         → padding: 0.625rem (10px)
p-3                           → padding: 0.75rem  (12px)
p-4                           → padding: 1rem     (16px)
p-5                           → padding: 1.25rem  (20px)
p-6                           → padding: 1.5rem   (24px)
p-8                           → padding: 2rem     (32px)

px-1.5                        → padding-left: 0.375rem; padding-right: 0.375rem
px-2                          → padding-left: 0.5rem;   padding-right: 0.5rem
px-2.5                        → padding-left: 0.625rem; padding-right: 0.625rem
px-3                          → padding-left: 0.75rem;  padding-right: 0.75rem
px-4                          → padding-left: 1rem;     padding-right: 1rem
px-5                          → padding-left: 1.25rem;  padding-right: 1.25rem
px-6                          → padding-left: 1.5rem;   padding-right: 1.5rem
px-8                          → padding-left: 2rem;     padding-right: 2rem

py-0.5                        → padding-top: 0.125rem; padding-bottom: 0.125rem
py-1                          → padding-top: 0.25rem;  padding-bottom: 0.25rem
py-1.5                        → padding-top: 0.375rem; padding-bottom: 0.375rem
py-2                          → padding-top: 0.5rem;   padding-bottom: 0.5rem
py-2.5                        → padding-top: 0.625rem; padding-bottom: 0.625rem
py-3                          → padding-top: 0.75rem;  padding-bottom: 0.75rem
py-4                          → padding-top: 1rem;     padding-bottom: 1rem
py-6                          → padding-top: 1.5rem;   padding-bottom: 1.5rem

mb-1                          → margin-bottom: 0.25rem
mb-2                          → margin-bottom: 0.5rem
mb-4                          → margin-bottom: 1rem
mb-8                          → margin-bottom: 2rem
mt-1                          → margin-top: 0.25rem
mt-2                          → margin-top: 0.5rem
mt-auto                       → margin-top: auto
ml-[240px]                    → margin-left: 240px
ml-64                         → margin-left: 16rem (256px)

gap-1                         → gap: 0.25rem  (4px)
gap-1.5                       → gap: 0.375rem (6px)
gap-2                         → gap: 0.5rem   (8px)
gap-3                         → gap: 0.75rem  (12px)
gap-4                         → gap: 1rem     (16px)
gap-6                         → gap: 1.5rem   (24px)
gap-8                         → gap: 2rem     (32px)

space-y-1                     → margin-top: 0.25rem between children
space-y-2                     → margin-top: 0.5rem  between children
space-y-3                     → margin-top: 0.75rem between children
space-y-4                     → margin-top: 1rem    between children
space-y-6                     → margin-top: 1.5rem  between children
space-y-8                     → margin-top: 2rem    between children
```

### Border Radius (Custom Scale from Tailwind Config)

```
rounded (DEFAULT)             → border-radius: 0.125rem  (2px)  ← tags/chips
rounded-sm                    → border-radius: 0.125rem  (2px)  (Tailwind default sm = 2px)
rounded-[4px]                 → border-radius: 4px
rounded-lg                    → border-radius: 0.25rem   (4px)  ← custom override
rounded-xl                    → border-radius: 0.5rem    (8px)  ← cards/panels
rounded-full                  → border-radius: 0.75rem   (12px) ← custom override
rounded-full (avatars)        → border-radius: 9999px    (forced via Tailwind default for w-N h-N circles)

NOTE: This config overrides Tailwind defaults significantly:
  Default Tailwind rounded-lg = 8px → Stitch rounded-lg = 4px
  Default Tailwind rounded-xl = 12px → Stitch rounded-xl = 8px
  Default Tailwind rounded-full = 9999px → Stitch rounded-full = 12px
```

### Shadows

```
shadow-sm                     → box-shadow: 0 1px 2px rgba(0,0,0,0.05)
shadow-md                     → box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)
shadow-lg                     → box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)
shadow-2xl                    → box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)
shadow-[0_1px_3px_rgba(0,0,0,0.06)] → box-shadow: 0 1px 3px rgba(0,0,0,0.06) ← KPI cards
shadow-[0_0_0_3px_rgba(42,77,215,0.2)] → box-shadow: 0 0 0 3px rgba(42,77,215,0.2) ← activity dot ring
shadow-lg.shadow-primary/20   → box-shadow: 0 10px 15px -3px rgba(42,77,215,0.2)
shadow-2xl (FAB/floating bar) → box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)
```

### Transitions and Animations

```
transition-all                → transition: all 150ms cubic-bezier(0.4,0,0.2,1)
transition-colors             → transition: color, background-color, border-color 150ms ease
transition-opacity            → transition: opacity 150ms ease
transition-transform          → transition: transform 150ms ease

duration-200                  → transition-duration: 200ms

hover:opacity-90              → opacity: 0.90 on :hover
hover:bg-white/5              → background-color: rgba(255,255,255,0.05) on :hover
hover:bg-white/50             → background-color: rgba(255,255,255,0.50) on :hover
hover:bg-slate-50             → background-color: #f8fafc on :hover
hover:bg-surface-container-low → background-color: #f2f4f7 on :hover
hover:translate-y-[-2px]      → transform: translateY(-2px) on :hover
hover:scale-105               → transform: scale(1.05) on :hover
hover:shadow-md               → shadow upgrade on :hover
active:scale-95               → transform: scale(0.95) on :active

group-hover:opacity-100       → opacity: 1 when parent .group is hovered
group-hover:opacity-0 (reverse) → opacity: 0 when parent is not hovered
group-hover:scale-110         → transform: scale(1.10) on parent hover
```

### Layout Patterns

```
SIDEBAR LAYOUT:
  w-[240px] h-screen fixed left-0 top-0 bg-[#191b23] flex flex-col py-6 z-50
  → width: 240px; height: 100vh; position: fixed; left:0; top:0;
    background: #191b23; display: flex; flex-direction: column;
    padding-top/bottom: 24px; z-index: 50

MAIN CONTENT OFFSET:
  ml-[240px] flex flex-col h-screen
  → margin-left: 240px; display:flex; flex-direction:column; height:100vh

TOP BAR:
  h-[52px] w-[calc(100%-240px)] ml-[240px] fixed top-0 flex items-center
  → height: 52px; width: calc(100% - 240px); margin-left:240px;
    position:fixed; top:0; display:flex; align-items:center

TASK ROW HEIGHT:
  .task-row { height: 42px }

KPI GRID (Dashboard):
  grid grid-cols-4 gap-6
  → display:grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem

BENTO GRID (Gerenciar Clientes):
  grid grid-cols-12 gap-6
  col-span-8 / col-span-4
  → 12-column grid; left panel = 8/12 cols; right panel = 4/12 cols

CALENDAR GRID (Weekly Planner):
  grid grid-cols-7 gap-px bg-outline-variant/20 rounded-xl overflow-hidden
  → 7-column grid; 1px gap filled with outline-variant at 20% opacity

MODAL LAYOUT:
  fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4
  → Full overlay; blur behind modal
  Modal panel: max-w-[1400px] h-[921px] rounded-xl flex
    Left aside: w-[220px] (tree nav)
    Center section: flex-1 (main content)
    Right aside: w-[280px] (activity log)

FLOATING ACTION BAR:
  fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#191b23] rounded-xl shadow-2xl
  px-6 py-3 flex items-center gap-8 z-50
  → Centered at bottom, 32px from bottom edge

AVATAR CLUSTER (table):
  flex -space-x-2  → stacked avatars with negative spacing

SECTION HEADER PATTERN:
  flex items-center justify-between mb-8
  → Standard header row with title + badge/action

PROGRESS BARS:
  Segmented: flex gap-1.5 h-3 (individual flex-1 colored divs)
  Continuous: w-full bg-surface-container h-3 rounded-sm overflow-hidden flex
```

---

## 3. STATUS CHIP SYSTEM

All status badges follow this pattern: `px-2 py-0.5 rounded-[4px] text-[11px] font-bold sidebar-label`

```
PUBLICADO (Published):
  bg: #ecfdf5 (emerald-50)  text: #065f46 (emerald-700)

AGENDADO (Scheduled):
  bg: #fffbeb (amber-50)    text: #92400e (amber-700)

CRIATIVO (Creative):
  bg: #f8fafc (slate-100)   text: #475569 (slate-600)

FEED format chip:
  bg: #faf5ff (purple-50)   text: #6b21a8 (purple-700)

REELS format chip:
  bg: #eef2ff (indigo-50)   text: #3730a3 (indigo-700)

Activity feed badges (wider tags in dashboard):
  Scheduled:  bg: rgba(219,234,254,0.5) (blue-100/50)  text: #1d4ed8 (blue-700)
  Approved:   bg: rgba(220,252,231,0.5) (green-100/50) text: #15803d (green-700)
  Revision:   bg: rgba(254,243,199,0.5) (orange-100/50) text: #c2410c (orange-700)
  Creative:   bg: rgba(243,232,255,0.5) (purple-100/50) text: #7e22ce (purple-700)

Client status (Ativo):
  bg: rgba(46,125,50,0.10)  text: #2e7d32
```

---

## 4. CSS VARIABLES BLOCK — 3-Theme System

```css
/* ============================================================
   STARKEN OS — CSS DESIGN TOKEN SYSTEM
   Generated from Stitch designs (March 2026)
   Supports: light | dark | warm themes
   Usage: <html data-theme="light|dark|warm">
   ============================================================ */

:root,
[data-theme="light"] {
  /* ── Brand Colors ── */
  --color-primary:              #2a4dd7;
  --color-primary-container:    #4868f1;
  --color-primary-fixed:        #dde1ff;
  --color-primary-fixed-dim:    #b9c3ff;
  --color-on-primary:           #ffffff;
  --color-on-primary-container: #fffbff;
  --color-on-primary-fixed:     #001257;
  --color-on-primary-fixed-variant: #0034c0;
  --color-inverse-primary:      #b9c3ff;

  --color-secondary:            #4648d4;
  --color-secondary-container:  #6063ee;
  --color-secondary-fixed:      #e1e0ff;
  --color-secondary-fixed-dim:  #c0c1ff;
  --color-on-secondary:         #ffffff;
  --color-on-secondary-container: #fffbff;
  --color-on-secondary-fixed:   #07006c;
  --color-on-secondary-fixed-variant: #2f2ebe;

  --color-tertiary:             #712ae2;
  --color-tertiary-container:   #8a4cfc;
  --color-tertiary-fixed:       #eaddff;
  --color-tertiary-fixed-dim:   #d2bbff;
  --color-on-tertiary:          #ffffff;
  --color-on-tertiary-container: #fffbff;
  --color-on-tertiary-fixed:    #25005a;
  --color-on-tertiary-fixed-variant: #5a00c6;

  /* ── Surface Scale ── */
  --color-surface-lowest:       #ffffff;
  --color-surface-low:          #f2f4f7;
  --color-surface:              #f7f9fc;
  --color-surface-container:    #eceef1;
  --color-surface-high:         #e6e8eb;
  --color-surface-highest:      #e0e3e6;
  --color-surface-dim:          #d8dadd;
  --color-surface-bright:       #f7f9fc;
  --color-surface-variant:      #e0e3e6;
  --color-surface-tint:         #2d50d9;
  --color-background:           #f7f9fc;

  /* ── On-Surface Text ── */
  --color-on-surface:           #191c1e;
  --color-on-surface-variant:   #444654;
  --color-on-background:        #191c1e;
  --color-inverse-surface:      #2d3133;
  --color-inverse-on-surface:   #eff1f4;

  /* ── Outline / Border ── */
  --color-outline:              #747686;
  --color-outline-variant:      #c4c5d7;

  /* ── Error ── */
  --color-error:                #ba1a1a;
  --color-error-container:      #ffdad6;
  --color-on-error:             #ffffff;
  --color-on-error-container:   #93000a;

  /* ── Sidebar (fixed dark, does not theme-shift) ── */
  --color-sidebar-bg:           #191b23;
  --color-sidebar-text:         #ffffff;
  --color-sidebar-text-muted:   rgba(255, 255, 255, 0.60);
  --color-sidebar-label:        rgba(255, 255, 255, 0.40);
  --color-sidebar-active-bg:    rgba(99, 102, 241, 0.15);
  --color-sidebar-active-border: #6366f1;
  --color-sidebar-hover-bg:     rgba(255, 255, 255, 0.05);
  --color-sidebar-divider:      rgba(255, 255, 255, 0.10);

  /* ── Semantic Status Colors ── */
  --color-status-published-bg:  #ecfdf5;
  --color-status-published-text: #065f46;
  --color-status-scheduled-bg:  #fffbeb;
  --color-status-scheduled-text: #92400e;
  --color-status-creative-bg:   #f8fafc;
  --color-status-creative-text: #475569;
  --color-status-active-bg:     rgba(46, 125, 50, 0.10);
  --color-status-active-text:   #2e7d32;
  --color-status-warning-text:  #ed6c02;
  --color-status-info:          #0288d1;

  /* ── Typography Scale ── */
  --font-family-base:           'Inter', sans-serif;
  --font-size-label-xs:         9px;
  --font-size-label-sm:         10px;
  --font-size-label:            11px;    /* sidebar labels, section headers */
  --font-size-caption:          12px;    /* meta text, dates */
  --font-size-body:             13px;    /* primary body, nav items */
  --font-size-body-md:          14px;    /* calendar date numbers */
  --font-size-body-lg:          16px;    /* icons via font-size */
  --font-size-title-sm:         18px;    /* sidebar logo */
  --font-size-title:            20px;    /* icon buttons */
  --font-size-title-lg:         22px;    /* modal title */
  --font-size-headline:         24px;    /* page sections */
  --font-size-display:          30px;    /* KPI numbers */
  --font-weight-regular:        400;
  --font-weight-medium:         500;
  --font-weight-semibold:       600;
  --font-weight-bold:           700;
  --font-weight-extrabold:      800;
  --letter-spacing-label:       0.8px;   /* sidebar labels, status chips */
  --letter-spacing-tag:         0.5px;   /* activity badges */

  /* ── Border Radius (Stitch custom scale) ── */
  --radius-chip:                2px;     /* rounded DEFAULT = 0.125rem */
  --radius-tag:                 4px;     /* rounded-[4px], status badges */
  --radius-sm:                  2px;     /* rounded-sm (checkbox etc) */
  --radius-lg:                  4px;     /* rounded-lg = 0.25rem custom */
  --radius-xl:                  8px;     /* rounded-xl = 0.5rem custom — cards */
  --radius-full:                12px;    /* rounded-full = 0.75rem custom — avatars */
  --radius-pill:                9999px;  /* for true pill shapes (forced on circles) */

  /* ── Spacing Scale ── */
  --space-0-5:  2px;
  --space-1:    4px;
  --space-1-5:  6px;
  --space-2:    8px;
  --space-2-5:  10px;
  --space-3:    12px;
  --space-4:    16px;
  --space-5:    20px;
  --space-6:    24px;
  --space-8:    32px;

  /* ── Component Dimensions ── */
  --sidebar-width:              240px;
  --topbar-height:              52px;
  --task-row-height:            42px;
  --avatar-sm:                  24px;   /* w-6 h-6 */
  --avatar-md:                  28px;   /* w-7 h-7 */
  --avatar-lg:                  32px;   /* w-8 h-8 */
  --avatar-xl:                  36px;   /* w-9 h-9 */
  --avatar-2xl:                 40px;   /* w-10 h-10 */
  --fab-size:                   56px;   /* w-14 h-14 */
  --icon-sm:                    16px;
  --icon-md:                    18px;
  --icon-lg:                    20px;
  --icon-xl:                    24px;

  /* ── Shadow Scale ── */
  --shadow-card:                0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-sm:                  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md:                  0 4px 6px -1px rgba(0, 0, 0, 0.10);
  --shadow-lg:                  0 10px 15px -3px rgba(0, 0, 0, 0.10);
  --shadow-2xl:                 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-primary-glow:        0 10px 15px -3px rgba(42, 77, 215, 0.20);
  --shadow-focus-ring:          0 0 0 3px rgba(42, 77, 215, 0.20);

  /* ── Transition ── */
  --transition-fast:            150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base:            200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============================================================
   DARK THEME
   ============================================================ */
[data-theme="dark"] {
  /* ── Surface Scale (inverted) ── */
  --color-surface-lowest:       #191c1e;
  --color-surface-low:          #1e2124;
  --color-surface:              #22262a;
  --color-surface-container:    #2d3133;
  --color-surface-high:         #353b3f;
  --color-surface-highest:      #3d4347;
  --color-surface-dim:          #111416;
  --color-surface-bright:       #383c3e;
  --color-surface-variant:      #3a3d40;
  --color-background:           #191c1e;

  /* ── On-Surface Text (light on dark) ── */
  --color-on-surface:           #e2e3e6;
  --color-on-surface-variant:   #c3c5d0;
  --color-on-background:        #e2e3e6;
  --color-inverse-surface:      #e2e3e6;
  --color-inverse-on-surface:   #2d3133;

  /* ── Brand (use dim/fixed-dim variants for dark) ── */
  --color-primary:              #b9c3ff;    /* inverse-primary becomes active */
  --color-primary-container:    #0034c0;
  --color-on-primary:           #001257;
  --color-on-primary-container: #dde1ff;

  --color-secondary:            #c0c1ff;
  --color-secondary-container:  #2f2ebe;
  --color-on-secondary:         #07006c;
  --color-on-secondary-container: #e1e0ff;

  --color-tertiary:             #d2bbff;
  --color-tertiary-container:   #5a00c6;
  --color-on-tertiary:          #25005a;
  --color-on-tertiary-container: #eaddff;

  /* ── Outline / Border ── */
  --color-outline:              #8d8fa0;
  --color-outline-variant:      #444654;

  /* ── Error ── */
  --color-error:                #ffb4ab;
  --color-error-container:      #93000a;
  --color-on-error:             #690005;
  --color-on-error-container:   #ffdad6;

  /* ── Semantic Status Colors (dark-adjusted) ── */
  --color-status-published-bg:  rgba(6, 95, 70, 0.20);
  --color-status-published-text: #6ee7b7;
  --color-status-scheduled-bg:  rgba(146, 64, 14, 0.20);
  --color-status-scheduled-text: #fcd34d;
  --color-status-creative-bg:   rgba(71, 85, 105, 0.20);
  --color-status-creative-text: #94a3b8;
  --color-status-active-bg:     rgba(46, 125, 50, 0.20);
  --color-status-active-text:   #86efac;
  --color-status-warning-text:  #fb923c;
  --color-status-info:          #38bdf8;

  /* ── Sidebar stays dark — only tweak borders ── */
  --color-sidebar-bg:           #111318;
  --color-sidebar-divider:      rgba(255, 255, 255, 0.08);

  /* ── Shadows (more intense on dark) ── */
  --shadow-card:                0 1px 3px rgba(0, 0, 0, 0.30);
  --shadow-primary-glow:        0 10px 15px -3px rgba(185, 195, 255, 0.15);
  --shadow-focus-ring:          0 0 0 3px rgba(185, 195, 255, 0.25);
}

/* ============================================================
   WARM / SEPIA THEME
   ============================================================ */
[data-theme="warm"] {
  /* ── Surface Scale (warm beige/cream tones) ── */
  --color-surface-lowest:       #fffdf7;
  --color-surface-low:          #f5f0e8;
  --color-surface:              #faf6ef;
  --color-surface-container:    #ede8de;
  --color-surface-high:         #e6dfd2;
  --color-surface-highest:      #ddd5c5;
  --color-surface-dim:          #c8c0b0;
  --color-surface-bright:       #fffdf7;
  --color-surface-variant:      #e0d8cc;
  --color-background:           #faf6ef;

  /* ── On-Surface Text (warm dark brown) ── */
  --color-on-surface:           #1c1a16;
  --color-on-surface-variant:   #4a4640;
  --color-on-background:        #1c1a16;
  --color-inverse-surface:      #312e27;
  --color-inverse-on-surface:   #f5f0e8;

  /* ── Brand (warm-shifted primary, keep brand identity) ── */
  --color-primary:              #3050d0;    /* slightly warmer blue */
  --color-primary-container:    #506af0;
  --color-on-primary:           #ffffff;
  --color-on-primary-container: #fff8f0;

  --color-secondary:            #5050d0;
  --color-secondary-container:  #7070e8;
  --color-on-secondary:         #ffffff;
  --color-on-secondary-container: #fff8f0;

  --color-tertiary:             #7a35e0;
  --color-tertiary-container:   #9060f0;
  --color-on-tertiary:          #ffffff;
  --color-on-tertiary-container: #f5eeff;

  /* ── Outline / Border (warm-toned) ── */
  --color-outline:              #7a7264;
  --color-outline-variant:      #c8bfaa;

  /* ── Error ── */
  --color-error:                #c0211f;
  --color-error-container:      #fde8e8;
  --color-on-error:             #ffffff;
  --color-on-error-container:   #8c0000;

  /* ── Semantic Status Colors (warm-tinted) ── */
  --color-status-published-bg:  #f0fdf4;
  --color-status-published-text: #14532d;
  --color-status-scheduled-bg:  #fefce8;
  --color-status-scheduled-text: #713f12;
  --color-status-creative-bg:   #faf9f7;
  --color-status-creative-text: #57534e;
  --color-status-active-bg:     rgba(46, 125, 50, 0.10);
  --color-status-active-text:   #2e7d32;
  --color-status-warning-text:  #c2550a;
  --color-status-info:          #0277bd;

  /* ── Sidebar (warm dark) ── */
  --color-sidebar-bg:           #1c1912;
  --color-sidebar-text:         #f5f0e8;
  --color-sidebar-text-muted:   rgba(245, 240, 232, 0.60);
  --color-sidebar-label:        rgba(245, 240, 232, 0.40);
  --color-sidebar-active-bg:    rgba(99, 102, 241, 0.12);
  --color-sidebar-divider:      rgba(245, 240, 232, 0.10);
}
```

---

## 5. KEY COMPONENT PATTERNS (Reference Snippets)

### Sidebar Navigation Item — Active State
```css
.nav-item-active {
  background-color: rgba(99, 102, 241, 0.15);
  color: #ffffff;
  border-left: 2px solid #6366f1;
  display: flex; align-items: center;
  padding: 8px 24px;
  transition: var(--transition-base);
}
```

### Status Chip
```css
.chip {
  padding: 2px 8px;
  border-radius: var(--radius-tag);    /* 4px */
  font-size: var(--font-size-label);   /* 11px */
  font-weight: 700;
  letter-spacing: var(--letter-spacing-label); /* 0.8px */
  text-transform: uppercase;
}
```

### KPI Card
```css
.card-kpi {
  background: var(--color-surface-lowest);
  padding: var(--space-5);            /* 20px */
  border-radius: var(--radius-xl);    /* 8px */
  box-shadow: var(--shadow-card);     /* 0 1px 3px rgba(0,0,0,0.06) */
  transition: transform var(--transition-fast);
}
.card-kpi:hover {
  transform: translateY(-2px);
}
```

### Section Header Label
```css
.section-label {
  font-size: var(--font-size-label);  /* 11px */
  font-weight: 700;
  letter-spacing: var(--letter-spacing-label); /* 0.8px */
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
}
```

### Primary Button
```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 8px 16px;
  border-radius: var(--radius-xl);    /* 8px via rounded-lg or rounded */
  font-size: var(--font-size-body);   /* 13px */
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}
.btn-primary:hover { opacity: 0.90; }
.btn-primary:active { transform: scale(0.95); }
```

### Floating Action Bar
```css
.fab-bar {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-sidebar-bg); /* #191b23 */
  color: #ffffff;
  border-radius: 8px;                 /* rounded-xl */
  box-shadow: var(--shadow-2xl);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  z-index: 50;
}
```

### Table Row
```css
.table-row {
  height: var(--task-row-height);     /* 42px */
  border-bottom: 1px solid rgba(196, 197, 215, 0.15);
  transition: background-color var(--transition-fast);
}
.table-row:hover {
  background-color: #f8fafc;          /* slate-50 */
}
```

### Glass Panel (gerenciar_clientes footer)
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.40);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.60);
  padding: var(--space-6);            /* 24px */
}
```

---

## 6. MATERIAL SYMBOLS ICON CONFIGURATION

```css
/* Standard icon setup used in all files */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
  font-size: 18px; /* default size in task_list */
}

/* Filled icon variant */
.material-symbols-outlined.filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

---

## 7. SCROLLBAR STYLE

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: #e0e3e6;  /* surface-variant */
  border-radius: 10px;
}

/* Hide scrollbar (used in sidebar nav) */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Custom narrow (4px) scrollbar — gerenciar_clientes panels */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
```

---

## 8. GHOST BORDER UTILITY

```css
/* Used for table row separators — very subtle */
.ghost-border {
  border-bottom: 1px solid rgba(196, 197, 215, 0.15);
}
```

---

*This document is the single source of truth for converting all Stitch HTML designs to pure CSS for Starken OS.*
