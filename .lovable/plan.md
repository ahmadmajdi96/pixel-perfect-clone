

## Match QMS UI to Production Pulse Theme

The Production Pulse project uses a distinctive dark industrial "control-room" aesthetic that differs from the current QMS theme. Here's what needs to change:

### Key Differences

| Aspect | Current QMS | Production Pulse Target |
|--------|-------------|------------------------|
| Background | `222 47% 6%` (dark blue) | `220 20% 7%` (darker, more neutral) |
| Cards | `222 47% 9%` | `220 18% 10%` |
| Primary | `217 91% 60%` | `210 100% 56%` |
| Fonts | System default | Inter + JetBrains Mono |
| Sidebar | Has footer with user/logout | Logo + nav only, user in top nav |
| Top bar | Simple "QMS" title | Facility name, live indicator, alert bell, user badge |
| Cards style | Standard shadcn Cards | `data-card` with hover glow effect |
| Badges | Filled solid color | Translucent background with colored border |
| Labels | Standard | `metric-label` (uppercase, tracked, tiny) |
| Values | Standard bold | `metric-value` (mono font, tracked) |

### Files to Change

1. **`src/index.css`** — Replace CSS variables with Production Pulse values; add `data-card`, `metric-value`, `metric-label`, `pulse-dot`, `grid-pattern`, `status-*` badge classes, and scrollbar utility; import Inter + JetBrains Mono fonts

2. **`tailwind.config.ts`** — Add `fontFamily` (Inter, JetBrains Mono), `status` color tokens (running/idle/transition/down/normal/monitor/warning/critical), `pulse-glow` animation; keep existing `severity` and `chart` tokens

3. **`src/components/AppLayout.tsx`** — Replace simple header with Production Pulse-style `TopNav` pattern: facility name, live dot indicator, alert bell with badge count, user avatar with role label, sign-out button

4. **`src/components/AppSidebar.tsx`** — Replace "QMS" text label with icon + "QMS" + "Quality Management" subtext pattern; use `metric-label`-style group labels; remove footer (user info moves to top nav)

5. **`src/pages/Auth.tsx`** — Restyle to match Production Pulse login: `grid-pattern` background, custom input fields with icons (User, Lock, Eye toggle), `data-card` form container, `metric-label` labels, inline error banner

6. **`src/components/SeverityBadge.tsx`** — Switch from solid fills to translucent `status-badge` pattern (15% opacity background, colored text, 30% opacity border)

7. **`src/components/StatusBadge.tsx`** — Same translucent badge treatment for CAPA status, supplier status, and complaint status badges

8. **`src/pages/Dashboard.tsx`** — Apply `data-card` class to KPI cards, `metric-value` for numbers, `metric-label` for headings; style chart tooltips with dark popover background

9. **All list/detail pages** — Replace `<Card>` wrappers with `data-card` divs where appropriate; apply `metric-label` to section headings

### What stays the same
- All routing, auth logic, database queries, and business logic remain unchanged
- shadcn UI component library structure stays intact
- The sidebar navigation items (Dashboard, CAPA, Suppliers, Complaints) stay the same
- All page content and functionality is preserved

