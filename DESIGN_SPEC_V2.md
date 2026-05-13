# Starken OS — V2.0 Design Specification
## ClickUp/Notion-Inspired Redesign Blueprint

**Date:** 2026-03-26
**Status:** Draft for Implementation
**Current file:** `checklist-relatorios.html` (~5000+ lines, pure HTML/CSS/JS, no framework)

---

## Table of Contents

1. [Audit of Current State](#1-audit-of-current-state)
2. [Design System Definition](#2-design-system-definition)
3. [CSS Variable System](#3-css-variable-system)
4. [Layout Architecture](#4-layout-architecture)
5. [Module-by-Module Redesign Specs](#5-module-by-module-redesign-specs)
6. [Component Library](#6-component-library)
7. [Priority Implementation Order](#7-priority-implementation-order)

---

## 1. Audit of Current State

### What Exists

**Sidebar (220px fixed)**
- Dark gradient: `#0f172a → #1a2332`
- Font size 0.7–0.75rem, very compact
- Active state: blue left-border inset + blue text
- Folder hierarchy for tenant/client navigation
- Theme switcher and user popup in footer

**Content area**
- `margin-left: 220px` offset
- Topbar: sticky, 14px 24px padding, white background
- Main: `padding: 20px 24px`, max-width 1400px

**Existing CSS Variables (`:root`)**
- Primary: `--starken: #3b82f6` (blue)
- Success: `--alpha: #10b981` (green)
- Background: `--bg: #f1f5f9`, cards: `--card: #ffffff`
- Border radius: `--radius: 12px`, `--radius-sm: 8px`
- 3 themes: light (default), dark (`[data-theme="dark"]`), warm (`[data-theme="warm"]`)

**Typography**
- Font: `Inter` (Google Fonts)
- Sidebar: 0.64–0.82rem, very dense
- Body: 0.82–0.85rem
- Headings: 1.05rem topbar title, 1.3rem modal title

**Key Issues to Fix**
- Sidebar too narrow (220px) and overly compressed
- No visual hierarchy differentiation between nav sections
- Topbar is plain white with no personality
- Dashboard lacks modern data visualization feel
- Task rows have too little breathing room
- Status badges are inconsistent in sizing
- No icon system — purely emoji-based

---

## 2. Design System Definition

### 2.1 Color Palette

#### Base Palette — Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-app` | `#f0f2f5` | App background behind content |
| `--color-bg-surface` | `#ffffff` | Cards, modals, panels |
| `--color-bg-elevated` | `#f8f9fb` | Hover states, subtle fills |
| `--color-bg-overlay` | `rgba(15,23,42,0.55)` | Modal backdrops |

#### Sidebar (Always Dark — Theme Independent)

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-bg` | `#191b23` | Sidebar base |
| `--sidebar-bg-hover` | `rgba(255,255,255,0.055)` | Nav item hover |
| `--sidebar-bg-active` | `rgba(99,102,241,0.14)` | Active nav item fill |
| `--sidebar-border` | `rgba(255,255,255,0.07)` | Section dividers |
| `--sidebar-text-dim` | `rgba(255,255,255,0.38)` | Inactive labels |
| `--sidebar-text-mid` | `rgba(255,255,255,0.62)` | Secondary items |
| `--sidebar-text-bright` | `rgba(255,255,255,0.88)` | Active / hovered |
| `--sidebar-accent-line` | `#6366f1` | Active indicator bar |

#### Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-starken` | `#4f6ef7` | Primary blue (upgraded from #3b82f6) |
| `--brand-starken-light` | `#eef1ff` | Blue backgrounds |
| `--brand-starken-border` | `#c7d2fe` | Blue borders |
| `--brand-starken-dark` | `#3451d1` | Blue hover state |
| `--brand-alpha` | `#10b981` | Starken Performance accent green |
| `--brand-alpha-light` | `#ecfdf5` | Green backgrounds |
| `--brand-alpha-border` | `#a7f3d0` | Green borders |

#### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#16a34a` | Published, completed |
| `--color-success-bg` | `#f0fdf4` | Success fill |
| `--color-success-border` | `#86efac` | Success border |
| `--color-warning` | `#d97706` | Scheduled, attention |
| `--color-warning-bg` | `#fffbeb` | Warning fill |
| `--color-warning-border` | `#fcd34d` | Warning border |
| `--color-danger` | `#dc2626` | Failed, error, delete |
| `--color-danger-bg` | `#fef2f2` | Danger fill |
| `--color-danger-border` | `#fca5a5` | Danger border |
| `--color-info` | `#0284c7` | Queued, informational |
| `--color-info-bg` | `#f0f9ff` | Info fill |
| `--color-purple` | `#7c3aed` | Creative / design statuses |
| `--color-purple-bg` | `#f5f3ff` | Purple fill |

#### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#111827` | Main readable text |
| `--text-secondary` | `#4b5563` | Supporting text |
| `--text-tertiary` | `#9ca3af` | Metadata, timestamps |
| `--text-disabled` | `#d1d5db` | Disabled fields |
| `--text-inverse` | `#ffffff` | Text on dark bg |

#### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `#f3f4f6` | Very light separators |
| `--border-default` | `#e5e7eb` | Standard borders |
| `--border-strong` | `#d1d5db` | Input borders, emphasized |
| `--border-focus` | `#6366f1` | Focus rings |

### 2.2 Dark Theme Overrides

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg-app` | `#f0f2f5` | `#0d1117` |
| `--color-bg-surface` | `#ffffff` | `#161b22` |
| `--color-bg-elevated` | `#f8f9fb` | `#1c2128` |
| `--text-primary` | `#111827` | `#e6edf3` |
| `--text-secondary` | `#4b5563` | `#8b949e` |
| `--text-tertiary` | `#9ca3af` | `#6e7681` |
| `--border-default` | `#e5e7eb` | `#30363d` |
| `--border-strong` | `#d1d5db` | `#484f58` |

### 2.3 Warm Theme Overrides

| Token | Light | Warm |
|-------|-------|------|
| `--color-bg-app` | `#f0f2f5` | `#f2ede4` |
| `--color-bg-surface` | `#ffffff` | `#fdf8f0` |
| `--color-bg-elevated` | `#f8f9fb` | `#f7f2e8` |
| `--text-primary` | `#111827` | `#2d2a22` |
| `--text-secondary` | `#4b5563` | `#5c5444` |
| `--border-default` | `#e5e7eb` | `#ddd4c0` |

---

### 2.4 Typography

**Font Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

No font change needed — Inter is already loaded and appropriate.

| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| `--text-xs` | 11px / 0.6875rem | 500 | 1.4 | +0.2px | Timestamps, metadata, badge labels |
| `--text-sm` | 12px / 0.75rem | 400–500 | 1.5 | 0 | Secondary body, sidebar items |
| `--text-base` | 13px / 0.8125rem | 400 | 1.6 | 0 | Primary body, task names, inputs |
| `--text-md` | 14px / 0.875rem | 400–500 | 1.6 | 0 | Card content, modal body |
| `--text-lg` | 16px / 1rem | 600 | 1.4 | -0.2px | Section headings, card titles |
| `--text-xl` | 18px / 1.125rem | 700 | 1.3 | -0.3px | Page titles, modal titles |
| `--text-2xl` | 22px / 1.375rem | 800 | 1.2 | -0.4px | Dashboard stat values |
| `--text-3xl` | 28px / 1.75rem | 800 | 1.1 | -0.5px | Large metric numbers |

**Category Labels (Nav, Column Headers)**
Size: 10px / 0.625rem | Weight: 700 | Letter-spacing: +2px | Text-transform: uppercase

---

### 2.5 Spacing System (4px base grid)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Minimal gap, icon padding |
| `--space-2` | 8px | Tight spacing, chip padding |
| `--space-3` | 12px | Small component padding |
| `--space-4` | 16px | Standard padding, list row height |
| `--space-5` | 20px | Card padding, section gaps |
| `--space-6` | 24px | Page content padding |
| `--space-8` | 32px | Large section gaps |
| `--space-10` | 40px | Feature section spacing |
| `--space-12` | 48px | Modal padding, max |

---

### 2.6 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Inline badges, tiny chips |
| `--radius-sm` | 6px | Small buttons, input corners |
| `--radius-md` | 8px | Standard buttons, small cards |
| `--radius-lg` | 12px | Cards, dropdown menus |
| `--radius-xl` | 16px | Modals, large panels |
| `--radius-2xl` | 20px | Featured cards |
| `--radius-full` | 9999px | Pills, avatar circles |

---

### 2.7 Shadow Scale

```
--shadow-xs:  0 1px 2px rgba(0,0,0,0.04);
--shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:  0 4px 8px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg:  0 10px 20px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.04);
--shadow-xl:  0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);
--shadow-2xl: 0 32px 64px rgba(0,0,0,0.16);

/* Colored shadows for interactive lift */
--shadow-brand: 0 4px 14px rgba(99,102,241,0.25);
--shadow-success: 0 4px 14px rgba(16,163,74,0.2);
```

Dark theme: multiply all `rgba` alphas by approximately 2.5x.

---

### 2.8 Transition System

```
--transition-fast:   80ms ease;
--transition-base:   150ms ease;
--transition-slow:   250ms ease;
--transition-spring: 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 3. CSS Variable System

Complete replacement for the current `:root` block. Paste this as the new root:

```css
/* ╔══════════════════════════════════════════════════════════╗
   ║  STARKEN OS — V2.0 CSS VARIABLE SYSTEM                  ║
   ║  Replace existing :root block with this                  ║
   ╚══════════════════════════════════════════════════════════╝ */

:root {
  /* ── SIDEBAR (theme-independent, always dark) ── */
  --sb-bg:           #191b23;
  --sb-bg-hover:     rgba(255,255,255,0.055);
  --sb-bg-active:    rgba(99,102,241,0.14);
  --sb-border:       rgba(255,255,255,0.07);
  --sb-text-dim:     rgba(255,255,255,0.38);
  --sb-text-mid:     rgba(255,255,255,0.62);
  --sb-text-bright:  rgba(255,255,255,0.9);
  --sb-accent:       #6366f1;
  --sb-width:        240px;
  --sb-collapsed-w:  52px;

  /* ── APP SURFACE ── */
  --bg-app:          #f0f2f5;
  --bg-surface:      #ffffff;
  --bg-elevated:     #f8f9fb;
  --bg-overlay:      rgba(15,23,42,0.55);

  /* ── BRAND ── */
  --brand:           #4f6ef7;
  --brand-light:     #eef1ff;
  --brand-border:    #c7d2fe;
  --brand-dark:      #3451d1;
  --brand-alpha:     #10b981;
  --brand-alpha-light: #ecfdf5;
  --brand-alpha-border: #a7f3d0;
  --brand-alpha-dark: #059669;

  /* ── SEMANTIC ── */
  --color-success:        #16a34a;
  --color-success-bg:     #f0fdf4;
  --color-success-border: #86efac;
  --color-warning:        #d97706;
  --color-warning-bg:     #fffbeb;
  --color-warning-border: #fcd34d;
  --color-danger:         #dc2626;
  --color-danger-bg:      #fef2f2;
  --color-danger-border:  #fca5a5;
  --color-info:           #0284c7;
  --color-info-bg:        #f0f9ff;
  --color-info-border:    #bae6fd;
  --color-purple:         #7c3aed;
  --color-purple-bg:      #f5f3ff;
  --color-purple-border:  #c4b5fd;

  /* ── TEXT ── */
  --text-primary:   #111827;
  --text-secondary: #4b5563;
  --text-tertiary:  #9ca3af;
  --text-disabled:  #d1d5db;
  --text-inverse:   #ffffff;

  /* ── BORDERS ── */
  --border-subtle:  #f3f4f6;
  --border-default: #e5e7eb;
  --border-strong:  #d1d5db;
  --border-focus:   #6366f1;

  /* ── SPACING ── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;

  /* ── TYPOGRAPHY ── */
  --text-xs:   0.6875rem;  /* 11px */
  --text-sm:   0.75rem;    /* 12px */
  --text-base: 0.8125rem;  /* 13px */
  --text-md:   0.875rem;   /* 14px */
  --text-lg:   1rem;       /* 16px */
  --text-xl:   1.125rem;   /* 18px */
  --text-2xl:  1.375rem;   /* 22px */
  --text-3xl:  1.75rem;    /* 28px */

  /* ── RADIUS ── */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-full: 9999px;

  /* ── SHADOWS ── */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 8px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 10px 20px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.04);
  --shadow-xl:  0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);
  --shadow-brand: 0 4px 14px rgba(99,102,241,0.25);

  /* ── TRANSITIONS ── */
  --transition-fast:   80ms ease;
  --transition-base:   150ms ease;
  --transition-slow:   250ms ease;

  /* ── LEGACY COMPATIBILITY (keep these for existing code) ── */
  --starken:       var(--brand);
  --starken-bg:    var(--brand-light);
  --starken-border: var(--brand-border);
  --starken-dark:  var(--brand-dark);
  --alpha:         var(--brand-alpha);
  --alpha-bg:      var(--brand-alpha-light);
  --alpha-border:  var(--brand-alpha-border);
  --alpha-dark:    var(--brand-alpha-dark);
  --bg:            var(--bg-app);
  --bg-subtle:     var(--bg-elevated);
  --card:          var(--bg-surface);
  --border:        var(--border-default);
  --border-light:  var(--border-subtle);
  --text:          var(--text-primary);
  --text-muted:    var(--text-tertiary);
  --danger:        var(--color-danger);
  --warning:       var(--color-warning);
  --warning-bg:    var(--color-warning-bg);
  --purple:        var(--color-purple);
  --purple-bg:     var(--color-purple-bg);
  --success:       var(--color-success);
  --success-bg:    var(--color-success-bg);
  --radius:        var(--radius-lg);
  --radius-sm:     var(--radius-md);
  --shadow:        var(--shadow-sm);
  --shadow-md:     var(--shadow-md);
  --shadow-lg:     var(--shadow-lg);
}

/* ── DARK THEME ── */
[data-theme="dark"] {
  --bg-app:         #0d1117;
  --bg-surface:     #161b22;
  --bg-elevated:    #1c2128;
  --text-primary:   #e6edf3;
  --text-secondary: #8b949e;
  --text-tertiary:  #6e7681;
  --text-disabled:  #484f58;
  --border-subtle:  #21262d;
  --border-default: #30363d;
  --border-strong:  #484f58;
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md:  0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3);
  --shadow-lg:  0 10px 20px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4);
  --color-success-bg:  #0d2b1d;
  --color-warning-bg:  #2d1e08;
  --color-danger-bg:   #2d0d0d;
  --color-info-bg:     #0c1f2d;
  --color-purple-bg:   #1c0f36;
  --brand-light:       #1e2450;
  --brand-alpha-light: #0d2b1d;
}

/* ── WARM THEME ── */
[data-theme="warm"] {
  --bg-app:          #f2ede4;
  --bg-surface:      #fdf8f0;
  --bg-elevated:     #f7f2e8;
  --text-primary:    #2d2a22;
  --text-secondary:  #5c5444;
  --text-tertiary:   #9c8c78;
  --border-subtle:   #ede8dc;
  --border-default:  #ddd4c0;
  --border-strong:   #c8bfaa;
}
```

---

## 4. Layout Architecture

### 4.1 Overall Layout

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed, always dark)                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Brand logo + workspace name          [collapse btn] │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ WORKSPACE                                           │ │
│  │   Dashboard                                         │ │
│  │   Post Calendar                                     │ │
│  │   Post Planner                                      │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ CLIENTS                                             │ │
│  │ ▶ Starken Performance        25                     │ │
│  │     · Cliente A                                     │ │
│  │     · Cliente B                                     │ │
│  │ ▶ Alpha Assessoria           10                     │ │
│  │     · Cliente C                                     │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ TOOLS                                               │ │
│  │   Meta Ads                                          │ │
│  │   Reports                                           │ │
│  │   Meta Config                                       │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ [user avatar] Juan          ···                     │ │
│  │ [● Light] [◐ Dark] [☀ Warm]                        │ │
│  └─────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│  MAIN CONTENT AREA (margin-left: 240px)                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ TOPBAR (sticky)                                     │ │
│  │ [breadcrumb / page title]    [actions] [user]       │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ PAGE CONTENT                                        │ │
│  │ (varies per module)                                 │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Sidebar Redesign (ClickUp-style)

**Current issues:** 220px width, 0.7rem base font, overly dense
**V2.0 spec:**

```
Width:      240px (expanded) / 52px (collapsed)
Background: #191b23 (NOT theme-dependent)
Font-size:  0.8125rem (13px) for nav items
```

**Sidebar anatomy (top to bottom):**

```
┌─────────────────────────┐
│  [S] Starken OS         │  ← Brand: 52px height
│      WORKSPACE          │    Logo: 32x32 rounded square
├─────────────────────────┤
│  WORKSPACE      ···     │  ← Section label: 10px, uppercase, 2px ls
│  ○  Dashboard           │  ← Nav item: 34px tall, 12px horiz padding
│  ○  Calendário          │
│  ○  Planner Semanal     │
├─────────────────────────┤
│  CLIENTS                │
│  ▶ Starken Performance  │  ← Folder: bold, chevron, count badge
│      · Cliente A        │  ← Indent: 28px, dot bullet 4px
│      · Cliente B        │
│  ▶ Alpha Assessoria     │
├─────────────────────────┤
│  TOOLS                  │
│  ○  Meta Ads            │
│  ○  Relatórios          │
│  ○  Configurações       │
├─────────────────────────┤
│  [JB] Juan Borges  ···  │  ← User row: avatar 28px, popup on click
│  [○][◐][☀]             │  ← Theme dots: 8px circles
└─────────────────────────┘
```

**Nav Item States:**

| State | Background | Text | Left border |
|-------|-----------|------|-------------|
| Default | transparent | `--sb-text-mid` | none |
| Hover | `--sb-bg-hover` | `--sb-text-bright` | none |
| Active | `--sb-bg-active` | `#818cf8` (indigo-400) | 2px solid `#6366f1` |
| Active hover | `--sb-bg-active` brightened | same | same |

**Section Category label:**
```css
font-size: 10px;
font-weight: 700;
letter-spacing: 2px;
text-transform: uppercase;
color: var(--sb-text-dim);
padding: 16px 12px 4px;
```

**Client items (nested):**
```css
padding: 4px 12px 4px 28px;
font-size: 0.75rem;
font-weight: 400;
color: var(--sb-text-dim);
/* hover → --sb-text-mid */
/* before pseudo: 4px dot */
```

**Collapse behavior:**
- Toggle button: `>` icon at top right of sidebar
- Collapsed: show only icons (20px), no text
- Items get `title` tooltip on hover
- Smooth `width` transition: 200ms ease

### 4.3 Topbar Redesign

**Current:** White bar, plain title, no visual depth
**V2.0:**

```
┌────────────────────────────────────────────────────────┐
│ [← Gestão de Conteúdo] / [Cliente X]  [+ New] [Views] │
│ height: 52px, bg: --bg-surface, border-bottom: 1px     │
└────────────────────────────────────────────────────────┘
```

- Height: 52px (up from variable)
- Background: `var(--bg-surface)`
- Border: `1px solid var(--border-subtle)`
- Breadcrumb navigation for context
- Module-specific action buttons on the right
- Font: 13px base text, 14px for page titles
- No box-shadow — rely on border only

### 4.4 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Desktop XL | 1440px+ | Full sidebar + content max-width 1400px |
| Desktop | 1280px | Full sidebar + content |
| Tablet | 1024px | Sidebar collapsible, 2-col grids become 1-col |
| Mobile | 768px | Sidebar hidden (hamburger menu), single column |
| Mobile S | 480px | Stats single column, table scroll |

---

## 5. Module-by-Module Redesign Specs

### 5.1 Login Screen

**Current:** Blue gradient background, white centered card, PIN input

**V2.0 Changes:**

```
LAYOUT:
┌──────────────────────────────────────────────────────────┐
│   Dark left panel (55%)     |  White right panel (45%)   │
│                             |                            │
│  [S] Starken OS logo        |  Welcome back              │
│                             |  Sign in to your workspace │
│  "Gerencie sua agência      |                            │
│   de social media com       |  [User dropdown select]    │
│   precisão e velocidade"    |  [PIN ● ● ● ●]             │
│                             |  [Entrar →]                │
│  -- Feature highlights --   |                            │
│  ✓ 35 clientes              |  Starken Performance       │
│  ✓ 2 tenants                |  Starken OS v2.0           │
│  ✓ Meta Graph API v25.0     |                            │
└──────────────────────────────────────────────────────────┘
```

- Left panel: `#191b23` with subtle grid texture or gradient
- Right panel: `#ffffff` with clean form
- PIN input: 4 large circles (40px each) that fill on input — no text field style
- Replace text input with styled PIN pad visual
- "User" selection: avatar chips at top of form, tap to select

**PIN input redesign:**
```
[●][●][●][●]   ← 4 circles, 44px, fill indigo when entered
```

### 5.2 Dashboard

**Current:** 4-stat grid + 2-column client list (Starken / Alpha)
**V2.0 Changes:**

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Good morning, Juan                    Thu, Mar 26 2026 │
├─────────────────────────────────────────────────────────┤
│  [Total Clientes] [Posts Hoje] [Pendentes] [Publicados] │
│   KPI cards — minimal, no colored top bar               │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐ ┌─────────────────────┐ │
│  │  Starken Performance       │ │  Alpha Assessoria   │ │
│  │  Client list with status   │ │  Client list        │ │
│  └────────────────────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**KPI Card redesign:**
```
Current: colored top border + icon + label + big number
V2.0:
┌─────────────────────────────┐
│  35          Total Clientes │
│              ──────────────  │
│  ↑ 2 este mês      [icon]  │
└─────────────────────────────┘
```
- Remove colored top border accent
- Move label to the right of the number
- Add a subtle trend indicator (`↑` / `↓`)
- Icon: right-aligned, 36px, colored background circle
- Font: `--text-3xl` (28px) for value, `--text-sm` (12px) for label
- Border: `1px solid var(--border-default)`
- Background: `var(--bg-surface)`
- Shadow: `var(--shadow-sm)`

**Client column redesign:**
- Remove gradient header — replace with flat, pill-like tenant badge
- Client rows: cleaner, removed colored backgrounds for status
- Status shown as inline dot + label (not background color on entire row)

### 5.3 Sidebar (Already specified in 4.2)

Key additions:
- Add activity indicator (orange dot) on client if they have overdue tasks
- Add unread indicator counts on folder headers
- Keyboard navigation support (arrows to move, enter to select)

### 5.4 Content Management (Task List)

**Current:** Grid-based rows with tight padding, compact status badges
**V2.0 Changes:**

**Column structure (keep same grid but with better proportions):**
```
[checkbox][expand][name_____________________][status][assignee][date][priority][publish_col][actions]
```

New column widths:
```css
grid-template-columns: 20px 20px minmax(240px, 2fr) 130px 100px 110px 80px minmax(180px, auto) 48px;
```

**Group header row:**
```
┌──────────────────────────────────────────────────────────┐
│ ▼ Em Andamento                          [+] 12 tasks     │
│  (indigo dot 10px, bold 14px, left aligned, row 36px)   │
└──────────────────────────────────────────────────────────┘
```
- No white background on group header — use very subtle `var(--bg-elevated)`
- Color the dot with the status color, not the entire row background
- Count badge: pill shape, `--text-xs`, neutral gray fill

**Task row:**
- Height: 38px (currently ~35px — small but perceptible improvement)
- Hover: `var(--bg-elevated)` — no bold border, just fill
- Name text: `--text-base` (13px), `--text-primary`
- Checkbox: 16px round, indigo when checked
- Subtask indent: 32px per level (current 56px is too much for small screens)

**Status badge:**
```
Current: padding 4px 10px, border-radius 20px
V2.0:    padding 3px 8px, border-radius --radius-xs (4px), font-size --text-xs
```
- Change from pill shape to small rectangle with rounded corners
- This creates a "tag" feel consistent with ClickUp
- Text: `--text-xs` (11px), weight 600

**Publish column redesign:**
```
Current: gradient pills
V2.0:    flat pills, same data
         [FB ✓ Published] [IG ⏱ Sched. 14:00]
```
- Remove gradient backgrounds from publish pills
- Use solid flat fills only
- Platform indicator: 2-letter prefix + status dot + time if scheduled

**Floating action bar (bulk select):**
```
Current: dark pill at bottom center
V2.0:    same concept, upgrade to glassmorphism style
         backdrop-filter: blur(12px)
         background: rgba(17,24,39,0.88)
         border: 1px solid rgba(255,255,255,0.12)
         box-shadow: var(--shadow-xl)
```

### 5.5 Task Modal (Content Management)

**Current:** Full-screen 3-panel grid (200px sidebar | main | 260px activity)
**V2.0 Changes:**

This is the highest-value component — keep the 3-panel layout but improve density and hierarchy.

```
┌──────────────────────────────────────────────────────────────┐
│ MODAL OVERLAY (full screen)                                  │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [← Back]  Task Title (editable h1)          [⋯] [×]    │ │
│ ├────────┬─────────────────────────────┬──────────────────┤ │
│ │ SIDEBAR│ MAIN CONTENT                │ ACTIVITY PANEL   │ │
│ │ 220px  │                             │ 280px            │ │
│ │        │ [Meta row: status,          │ Activity feed    │ │
│ │ Task   │  assignee, date, priority]  │                  │ │
│ │ tree   │                             │ Comment input    │ │
│ │ nav    │ [Briefing section]          │ at bottom        │ │
│ │        │ [References upload]         │                  │ │
│ │        │ [Creative Final upload]     │                  │ │
│ │        │ [Copy text area]            │                  │ │
│ │        │ [Publish section]           │                  │ │
│ └────────┴─────────────────────────────┴──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Panel widths:**
- Sidebar nav: 220px → **200px** (slight reduction for main area)
- Main: flex 1 (unchanged)
- Activity: 260px → **300px** (comments deserve more width)

**Title area:**
```
Current: input[type=text] with bottom border focus
V2.0:    contenteditable div, no border at rest
         font-size: --text-xl (18px), weight 700
         hover shows subtle bottom border
         focus: no ring, just cursor
```

**Meta row (status, assignee, date, priority):**
```
Current: flex wrap with labels above each item
V2.0:    horizontal chips, inline — no labels, icon tooltips

[ ● Em Andamento ▾ ]  [ JB ▾ ]  [ 📅 26 Mar ▾ ]  [ 🔺 Alta ▾ ]
```
- Each chip: `border: 1px solid var(--border-default)`, rounded, 28px height
- Hover: `background: var(--bg-elevated)`
- Dropdown opens below

**Section titles:**
```
Current: 0.82rem, bold, with emoji icon
V2.0:    12px uppercase, letter-spacing 1.5px, color --text-tertiary
         + thin horizontal rule that extends full width
```

**Copy textarea:**
```
Current: warm yellow background (#fffbeb)
V2.0:    Keep warm yellow — it's a useful distinction
         But increase min-height to 240px
         Add character count at bottom right
         Add AI generate button inline with toolbar
```

**Publish section:**
```
Current: blue filled background block
V2.0:    clean card with left accent border
         border-left: 3px solid var(--brand)
         background: var(--bg-elevated)
         Remove heavy blue fill
```

### 5.6 Calendar / Post Planner

**Current:** Monthly grid + week planner (2 view tabs)
**V2.0 Changes (Monthly Calendar):**

**Toolbar:**
```
[← ] March 2026 [ →]    [Today]    [Filter: All clients ▾]
                                   [Published ● Scheduled ● Failed ●]
```
- Height: 44px
- Navigation: ghost buttons with clean arrows
- Month/Year: bold 16px

**Day cell:**
```
Current: min-height 100px (too tall for dense grids)
V2.0:    min-height: 80px, add overflow-hidden with "+3 more" link
         Day number: 12px bold, top-left
         Today highlight: indigo circle background around number (28px circle)
```

**Post chips in calendar:**
```
Current: color-coded left border bars
V2.0:    same concept, refined:
         height: 18px
         border-radius: 3px
         font-size: 10px
         left accent: 3px solid [status color]
         Platform dot: 6px circle after client name
```

**Week Planner View:**
```
Current: cards with image aspect-ratio + body
V2.0:    same cards, add client color band at top (2px)
         cleaner time display: "14:00" → bold monospace
         "published" cards get green subtle glow (box-shadow)
```

### 5.7 Client Info Page

**Current:** Simple fields in a card
**V2.0 Changes:**

```
┌────────────────────────────────────────────────────────────┐
│ [← Back]  CLIENT NAME                 Status: [● Ativo]   │
│           Starken Performance                              │
├──────────────────┬─────────────────────────────────────────┤
│  OVERVIEW TABS   │                                         │
│  [Info] [Posts]  │  Tab content                            │
│  [Ads]  [Files]  │                                         │
└──────────────────┴─────────────────────────────────────────┘
```

- Left-side vertical tab navigation for client subpages
- Overview: key stats at top (published posts this month, scheduled, pending)
- Profile completeness bar kept — improve visual

### 5.8 Meta Ads Section

**Current:** Tab-based with Config/Balance/BI/Schedule
**V2.0 Changes:**

**BI Dashboard improvements:**
- KPI cards: same data, use new card system
- Campaign table: zebra striping with subtle border, no heavy borders
- Period selector: pill button group (7d, 14d, 30d, 90d) — replace dropdown

**Publish flow:**
```
Current: step indicators (circles 1, 2, 3)
V2.0:    progress steps with connector lines
         Step 1 ──── Step 2 ──── Step 3
         (filled circles when done, outlined when pending)
```

**Platform selector buttons:**
```
Current: flex buttons with border
V2.0:    icon-first layout
         [FB icon]    [IG icon]
         Facebook     Instagram
         (both selectable, highlight on select)
```

### 5.9 Reports Section

**Current:** Not deeply audited — likely tables and PDF generation
**V2.0 Changes:**

- Apply new card system to report cards
- Period selector: pill button group
- Client selector: searchable dropdown
- Table: cleaner typography, subtle zebra rows
- Keep print styles (`@media print`)

---

## 6. Component Library

### 6.1 Buttons

**Sizes:**

| Variant | Padding | Font-size | Height |
|---------|---------|-----------|--------|
| `btn-xs` | 3px 8px | 11px | 22px |
| `btn-sm` | 5px 12px | 12px | 28px |
| `btn-md` | 7px 16px | 13px | 34px |
| `btn-lg` | 9px 20px | 14px | 40px |

**Variants:**

```css
/* Primary */
.btn-primary {
  background: var(--brand);
  color: white;
  border: none;
  /* hover: --brand-dark */
  /* shadow: var(--shadow-brand) on hover */
}

/* Secondary */
.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  /* hover: border-color var(--border-strong) */
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  /* hover: background var(--bg-elevated) */
}

/* Danger */
.btn-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger-border);
  /* hover: background #fecaca */
}

/* Success */
.btn-success {
  background: var(--brand-alpha);
  color: white;
  border: none;
}
```

All buttons:
- `border-radius: var(--radius-md)` (8px)
- `font-weight: 600`
- `transition: all var(--transition-base)`
- `display: inline-flex; align-items: center; gap: 6px`
- No `border-radius: 20px` pills for action buttons (reserve pills for badges only)

### 6.2 Inputs & Forms

```css
.v2-input {
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-surface);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.v2-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}

.v2-input::placeholder {
  color: var(--text-tertiary);
}
```

**Labels:**
```css
.v2-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
  display: block;
}
```

### 6.3 Cards

```css
.v2-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.v2-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.v2-card-title {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--text-primary);
}
```

### 6.4 Status Badges

**New system — 3 sizes, consistent shape:**

```css
/* Base */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  white-space: nowrap;
  border-radius: var(--radius-xs);
}

/* Size: sm */
.status-badge-sm {
  font-size: var(--text-xs);
  padding: 2px 6px;
  height: 18px;
}

/* Size: md (default) */
.status-badge-md {
  font-size: var(--text-sm);
  padding: 3px 8px;
  height: 22px;
}

/* Size: lg */
.status-badge-lg {
  font-size: var(--text-base);
  padding: 4px 12px;
  height: 26px;
}
```

**Status color map (new):**

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| a-fazer | `#f3f4f6` | `#374151` | `#e5e7eb` |
| em-andamento | `#eff6ff` | `#1d4ed8` | `#bfdbfe` |
| criacao-conteudo | `#f5f3ff` | `#6d28d9` | `#ddd6fe` |
| design | `#eff6ff` | `#2563eb` | `#bfdbfe` |
| aprovacao | `#f0fdf4` | `#15803d` | `#bbf7d0` |
| alteracao | `#fffbeb` | `#b45309` | `#fcd34d` |
| revisao | `#fef2f2` | `#dc2626` | `#fecaca` |
| agendado | `#f0f9ff` | `#0369a1` | `#bae6fd` |
| publicado | `#f0fdf4` | `#166534` | `#86efac` |
| standby | `#f8fafc` | `#64748b` | `#e2e8f0` |

### 6.5 Dropdowns

```css
.v2-dropdown {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  min-width: 180px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 10000;
}

.v2-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  cursor: pointer;
  transition: background var(--transition-fast);
  color: var(--text-secondary);
}

.v2-dropdown-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.v2-dropdown-item.selected {
  background: var(--brand-light);
  color: var(--brand);
  font-weight: 600;
}
```

### 6.6 Modals

```css
.v2-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
}

.v2-modal {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid var(--border-default);
}

.v2-modal-header {
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.v2-modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
```

### 6.7 Toast Notifications

**V2.0 redesign:**

```css
.v2-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 500;
  z-index: 9999;
  box-shadow: var(--shadow-xl);
  border: 1px solid;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: toastSlideIn 0.25s var(--transition-spring);
}

/* Variants */
.v2-toast.success {
  background: var(--bg-surface);
  border-color: var(--color-success-border);
  color: var(--text-primary);
  /* icon: green check circle */
}

.v2-toast.error {
  background: var(--bg-surface);
  border-color: var(--color-danger-border);
  color: var(--text-primary);
}

.v2-toast.info {
  background: var(--bg-surface);
  border-color: var(--brand-border);
  color: var(--text-primary);
}
```

Note: Remove the current dark pill style (`background: var(--text)`). Use white surface with colored border instead — cleaner and supports all themes.

### 6.8 Empty States

```css
.v2-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
  color: var(--text-tertiary);
}

.v2-empty-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-4);
  opacity: 0.4;
}

.v2-empty-title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.v2-empty-text {
  font-size: var(--text-sm);
  line-height: 1.6;
}
```

---

## 7. Priority Implementation Order

Implementation ranked by **visual impact per effort ratio**.

### Phase 1 — Maximum Visual Impact (Do First)

These changes transform the overall feel without touching JS logic.

**1.1 CSS Variables replacement** (30 min)
- Replace `:root` block with new V2.0 variable system
- Keep all legacy variable aliases — zero JS changes required
- Immediate benefit: colors, shadows, spacing uniformity

**1.2 Sidebar redesign** (2–3 hours)
- Update sidebar width to 240px
- Increase font-size from 0.7rem to 0.8125rem
- Rework nav item padding and states
- Improve folder hierarchy visual weight
- Update footer: user row + theme switcher dots
- This is the frame — when the sidebar looks good, everything looks better

**1.3 Topbar** (1 hour)
- Fix height to 52px
- Remove box-shadow, add subtle border only
- Clean up padding consistency

**1.4 Base typography pass** (1–2 hours)
- Pass through all `font-size: 0.7rem` instances → upgrade to 0.75rem minimum
- Update `body` font-size from implicit to explicit 13px
- Line-height: 1.5 on body text

---

### Phase 2 — Core Module Upgrade

**2.1 Content Management list** (3–4 hours)
- Row height increase to 38px
- Status badge: rectangle style (`border-radius: 4px`)
- Group header visual improvements
- Column grid proportions
- Hover state refinement

**2.2 Task Modal** (4–6 hours)
- Title: larger, more editorial
- Meta row: chip style
- Section headers: uppercase label style
- Publish section: remove blue fill, use border-left accent
- Activity panel: wider (300px)

**2.3 Dashboard KPI cards** (2 hours)
- Remove colored top border bars
- New layout: number + label side by side
- Trend indicators

---

### Phase 3 — Polish & Remaining Modules

**3.1 Calendar** (2–3 hours)
- Day cell min-height 80px
- Today number: indigo circle
- Post chip refinement

**3.2 Login** (2 hours)
- Split panel layout
- PIN circle inputs

**3.3 Buttons system-wide** (1–2 hours)
- Remove all `border-radius: 20px` from action buttons
- Standardize to 8px radius
- Apply new size classes

**3.4 Toast system** (1 hour)
- Replace dark pill toasts with white bordered toasts

**3.5 Meta Ads / Reports** (3–4 hours)
- KPI card system
- Period pill selectors
- Table cleanup

---

### Effort Summary

| Phase | Tasks | Estimated Time | Risk |
|-------|-------|---------------|------|
| Phase 1 | CSS vars, Sidebar, Topbar, Typography | 5–7 hours | Low — CSS only |
| Phase 2 | Content list, Task modal, Dashboard | 9–12 hours | Medium — some JS class changes |
| Phase 3 | Calendar, Login, Buttons, Toast, Ads | 8–10 hours | Low-Medium |
| **Total** | | **22–29 hours** | |

---

## ASCII Reference Mockups

### Sidebar (full expanded)

```
┌────────────────────────────┐
│ [S] Starken OS         [>] │  h:52px, brand area
├────────────────────────────┤
│  WORKSPACE                 │  10px uppercase label
│                            │
│  ⬜ Dashboard              │  nav item 34px tall
│  ⬜ Calendário             │
│  ⬜ Planner Semanal        │
│                            │
│  CLIENTS                   │
│  ▶ Starken Performance 25  │  folder header
│    · Acai na Tigela        │  client item 28px
│    · Agência Zen           │
│    · Blue Star             │
│    ┄ (22 more)             │
│  ▶ Alpha Assessoria    10  │
│    · Buffet Excellence     │
│                            │
│  TOOLS                     │
│  ⬜ Meta Ads               │
│  ⬜ Relatórios             │
│  ⬜ Configurações          │
├────────────────────────────┤
│ [JB] Juan Borges      [···]│  user row
│ [●Light] [●Dark] [●Warm]  │  theme dots
└────────────────────────────┘
```

### Content Management Row

```
┌────────────────────────────────────────────────────────────────────────┐
│ □ ▶ [••] Post Carrossel — Semana 14           [Design] [JB] [26 Mar]  │
│         Acai na Tigela                        [🔺 Alta] [FB ✓] [IG ⏱] │
└────────────────────────────────────────────────────────────────────────┘
```

### KPI Card

```
┌──────────────────────────────┐
│                    [icon ○]  │
│  35                          │
│  Total Clientes              │
│  ↑ 2 novos este mês         │
└──────────────────────────────┘
```

### Status Badge (new rectangle style)

```
 [Design]   [Em Andamento]   [Publicado]   [Standby]
  purple       blue             green        gray
  4px radius, 11px font, no pill shape
```

---

*End of Starken OS V2.0 Design Specification*
*File: DESIGN_SPEC_V2.md*
*Author: UI/UX Design Agent*
*Next step: Begin Phase 1 implementation starting with CSS variable replacement*
