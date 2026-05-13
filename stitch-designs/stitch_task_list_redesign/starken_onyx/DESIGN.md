# Design System Document

## 1. Overview & Creative North Star

### The Creative North Star: "The Curated Architect"
This design system moves away from the chaotic, "feature-soup" appearance of traditional SaaS. We are building a workspace that feels like a high-end editorial studio—blending the functional density of **Notion** with the high-performance utility of **ClickUp**, but through a lens of premium intentionality.

The system is defined by **Structural Honesty**. We do not hide behind heavy borders or gaudy gradients. Instead, we use sophisticated tonal layering, intentional white space, and a rigid adherence to rectangular geometry to create an environment of focus. The goal is to make social media management feel less like a chore and more like a curated creative process.

---

## 2. Colors

### Foundation & Brand
The palette is rooted in deep obsidian and crisp whites, punctuated by a highly precise Primary Blue.

- **Primary (`#2a4dd7`):** Use for high-impact actions and focus states.
- **On-Primary (`#ffffff`):** Text/icons on primary backgrounds.
- **Surface (`#f7f9fc`):** The foundation of the light content area.
- **Sidebar Background (`#191b23`):** Fixed dark navigation.

### Status Tonalities
Statuses are strictly rectangular and must use the following semantic tokens:
- **Success (Green):** `#2e7d32`
- **Warning (Orange):** `#ed6c02`
- **Danger (Red):** `#d32f2f`
- **Scheduled (Blue):** `#0288d1`
- **Creative (Purple):** `#7b1fa2`

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Structural separation is achieved through background color shifts. A `surface-container-low` section sitting on a `surface` background is the standard. Use the `outline-variant` token at 10% opacity only if a physical boundary is legally required for accessibility.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine paper sheets. Use the Tiers to define depth:
1.  **Lowest (`#ffffff`):** Floating cards and active input fields.
2.  **Low (`#f2f4f7`):** Secondary content areas.
3.  **Medium (`#eceef1`):** Canvas background.
4.  **High/Highest:** Used for modal overlays and elevated panels.

---

## 3. Typography

**Font Family:** Inter (Sans-serif)

Typography is our primary tool for hierarchy. We use extreme contrast between uppercase labels and tight body copy to create an editorial feel.

- **Display/Headline:** Use for dashboard titles and major section headers. High-weight, tight letter-spacing.
- **Title SM (`1rem`):** The standard for card titles and navigation groups.
- **Body MD (`13px`):** The workhorse. This specific size balances information density with readability.
- **Label SM (`11px`):** **Uppercase / Letter-spacing: 0.8px.** This is a signature style. Use for metadata, column headers in tables, and category markers.

---

## 4. Elevation & Depth

### The Layering Principle
Hierarchy is conveyed through **Tonal Layering**. Instead of a border, an inner panel should be one step higher or lower on the `surface-container` scale than its parent. 

### Ambient Shadows
Shadows are used sparingly to indicate "float" (e.g., active modals or dragging cards).
- **Token:** `0 1px 3px rgba(0,0,0,0.06)`
- **Execution:** Shadows must be extra-diffused. For floating elements, use a backdrop-blur of `8px` combined with a semi-transparent surface color to create a **Glassmorphic** effect. This ensures the UI feels integrated, not pasted on.

### Ghost Borders
If a container needs a edge, use the `outline-variant` token at **15% opacity**. Never use 100% black or high-contrast grey lines.

---

## 5. Components

### Sidebar Navigation
- **Background:** `#191b23`
- **Inactive Text:** `rgba(255,255,255,0.62)`
- **Active State:** Background `rgba(99,102,241,0.14)` with a `2px` solid `#6366f1` left border. 
- **Radius:** Keep nav item hover states at `4px` radius.

### Buttons & Inputs
- **Buttons:** Primary buttons use a subtle gradient from `primary` to `primary-container`. 
- **Inputs:** `6px` corner radius. Use `surface-container-lowest` (`#ffffff`) for the background with a "Ghost Border" in the resting state.
- **Cards:** `8px` corner radius. No borders. Elevation via the `surface-container-low` background.
- **Panels:** Large layout containers (like a calendar view) use a `12px` radius.

### Rectangular Badges (Status)
**Strict Rule:** No rounded pills. 
- **Radius:** `4px`
- **Typography:** `Label-sm` (11px Uppercase).
- **Style:** Use a 10% opacity tint of the status color for the background, and the 100% opaque color for the text.

### Content Separation
Forbid the use of divider lines in lists. Use **Vertical White Space** (from the `Spacing Scale`) or subtle tonal shifts between `surface` and `surface-container-low` to separate items.

---

## 6. Do's and Don'ts

### Do:
- **Use Asymmetry:** Align primary content to a strong left axis, but allow metadata or "Creative" elements to break the grid slightly to avoid a "Bootstrap" feel.
- **Layering:** Place a `#ffffff` card on an `#f0f2f5` background to create depth.
- **Typography as UI:** Use the 11px uppercase labels to guide the eye without adding heavy icons.

### Don't:
- **No Pill Shapes:** Avoid 999px radius on buttons or tags. We are building a "Square" system.
- **No Heavy Lines:** Do not use `#000000` or `#cccccc` for borders. If you can see the border clearly, it is too heavy.
- **No Flat UI:** Avoid using the same color for the background and the containers. There must always be a tonal "step."
- **No Default Inter:** Don't just use Inter at 16px. Use the specific `13px` body and `11px` label tokens to maintain the signature density.

### Director's Note
This system succeeds when it feels **quiet**. The complexity of social media management requires a UI that recedes, allowing the content (the posts, the data, the creative) to be the hero. Focus on the gaps between elements as much as the elements themselves.