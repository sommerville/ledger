# STYLE.md — Sommerville Ledger

---

## App Identity
**Name:** Sommerville Ledger
**Short name:** Sommerville
**Internal version:** Ledger v14.3
**Formerly:** Portfolio / Sommerville's Finances (pre-Ledger v1.0 / Portfolio v18.3)

---

## File Structure (v14.3+)

Three files make up the app:
- `index.html` — mobile app, deployed from `Ledger_vX_Y.html`
- `ledger-desktop.html` — desktop dashboard, standalone
- `shared.js` — shared logic, loaded by both

Rules:
- `shared.js` must have **zero DOM references** — pure data/logic only
- Desktop-only functions are prefixed `dt`
- Mobile-only functions have no prefix convention
- Functions shared between files live in `shared.js`

---

## Themes

### alaskan-theme (default)
Aurora Borealis dark. Deep navy backgrounds, gold accent.
- Background: `#04090F`
- Accent: `#D4AF37` (gold)
- Text: `#C0C0C0` / `#E2E8F0`
- Cards: `#0C1828` / `#0F1E33`
- Borders: `#1A2A42` / `#2A3A52`
- Positive: `#4ADE80`
- Negative: `#F87171`
- Animated aurora background via `::before` pseudo-element
- Mountain silhouette at bottom via `::after`

### sunset-theme
Hawaiian beach. Warm crimson and gold.
- Background: `#0E0208`
- Accent: `#F5C030` (warm gold)
- Text: `#F0D8C0`
- Cards: `#180608` / `#200A0C`
- Borders: `#4A1810` / `#5A2018`
- Positive: `#F5A020`
- Negative: `#E05040`
- Animated sunset sky via `::before`
- Beach/ocean silhouette at bottom via `::after`

### Theme pre-load (required in every HTML file)
Must be the **first child of `<head>`**, before any CSS:
```html
<script>
    (function() {
        var t = localStorage.getItem('pf_theme') || 'alaskan';
        document.documentElement.classList.add(t === 'sunset' ? 'sunset-theme' : 'alaskan-theme');
    })();
</script>
```

---

## Desktop Dashboard CSS Variables

Applied via `dtApplyThemeVars(theme)` as inline style properties on `#desktopDashboard`:

| Variable | Alaskan | Sunset |
|---|---|---|
| `--dt-bg` | `#040C18` | `#0A0206` |
| `--dt-sidebar` | `#060E1A` | `#0E0308` |
| `--dt-card` | `#0C1828` | `#180608` |
| `--dt-card2` | `#0F1E33` | `#200A0C` |
| `--dt-border` | `#1A2A42` | `#4A1810` |
| `--dt-accent` | `#D4AF37` | `#F5C030` |
| `--dt-accent2` | `#B8941F` | `#E08020` |
| `--dt-text` | `#E2E8F0` | `#F0D8C0` |
| `--dt-muted` | `#7A8499` | `#9A7060` |
| `--dt-positive` | `#4ADE80` | `#F5A020` |
| `--dt-negative` | `#F87171` | `#E05040` |
| `--dt-hover` | `#162030` | `#28100A` |
| `--dt-active` | `#1A2A42` | `#381808` |
| `--dt-input-bg` | `#050D1A` | `#140408` |
| `--dt-tooltip` | `#060E1A` | `#200A0C` |
| `--dt-grid` | `rgba(255,255,255,0.05)` | `rgba(255,200,100,0.06)` |

---

## Home Screen Layout

- Grid: `repeat(auto-fill, minmax(88px, 1fr))` — reflows columns based on icon size
- Icon size: 88px default (stored in `pf_iconSize`, adjustable in settings)
- Dock: 3 fixed icons (Data, Log, Settings) — hardcoded HTML, not JS-rendered
- Two swipeable pages — swipe or drag to reorder; hold near edge to flip page
- Page dots below grid

### Home Screen Icons
PNG files at `icons/home/`. Referenced via `<img src="icons/home/X.png">` in `HOME_SVGS` object and dock HTML. 16 icons total:
`income`, `investments`, `expenses`, `net-worth`, `fire`, `summary`, `calculator`, `compound-interest`, `budget`, `backtest`, `retirement`, `debt`, `home-value`, `data`, `log`, `settings`

### PWA / App Icons
PNG files at `icons/app/`. Referenced in `manifest.json` and HTML `<head>` link tags.
`icon.png` (512×512), `icon-192.png`, `icon-192-maskable.png`, `icon-512-maskable.png`

---

## Typography
- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Desktop uses same stack
- Numbers: `Intl.NumberFormat` with `en-US` locale, currency USD, 0 decimal places

---

## Utility Classes

```css
.u-hidden        { display: none !important }
.u-mt4/8/10/20   { margin-top: Xpx }
.u-mb0/4/10/12   { margin-bottom: Xpx }
.u-fs11/12/13/14 { font-size: Xpx }
.u-fw600/700     { font-weight: X }
.u-grid-span2    { grid-column: span 2 }
.u-flex-col/row/between { display: flex + direction }
.u-text-right/center    { text-align }
.col-gold        { color: #D4AF37 }
.col-amber       { color: #D4AF37 }
.col-silver      { color: #E2E8F0 }
.col-silver2     { color: #C0C0C0 }
.col-muted       { color: #7A8499 }
.col-green       { color: #4ADE80 }
.col-red         { color: #F87171 }
.col-navy-text   { color: #0A1018 }
.bg-deep-alaskan { background: #050D1A }
.bg-alaskan      { background: #0C1828 }
.bg-alaskan-mid  { background: #0F1E33 }
.bdr-alaskan     { border: 1px solid #1A2A42 }
.bdr-alaskan2    { border: 1px solid #2A3A52 }
```

---

## Data Format Conventions

- Month keys: `YYYY-MM` format, always local time via `moKey(d)` — never `toISOString()`
- Entry IDs: `'src_' + Date.now()` or similar timestamp-based strings
- All localStorage values encrypted with AES-256 via CryptoJS when PIN is set
- Unencrypted keys: `pf_theme`, `pf_deviceMode`, `pf_pin`, `pf_pin_hint`, `pf_taxRate`, `pf_demoMode`, `pf_iconSize`, `pf_dt_user_age`, `pf_basicCalcEnabled`, `pf_logbook`

---

## Dead Code — Do Not Reintroduce
- `deltaStr` — computed but never rendered in most snapshot functions
- `pf_splashEnabled` — unused, splash always runs
- Net Saved on Financial Pulse chart — removed in v4.4
- `gross` field on income entries — legacy, stripped on load
- `body.desktop-mode` CSS class — desktop is now a separate file
- `#desktopDashboard` in index.html — moved to ledger-desktop.html
- `<audio id="bgMusic">` — removed in v14.3
- `dtApplyThemeVars()` call in index.html setTheme — desktop only, removed

---

## Working Style
- One change at a time
- Always download and test before proceeding
- Incremental verifiable changes over large combined refactors
- JS comments intentionally preserved as navigation landmarks for Claude sessions
- Bump `sw.js` CACHE_NAME on every deploy
- Upload only changed files — don't redeploy everything every session
- Archive versioned copy (`Ledger_vX_Y.html`), deploy as `index.html`
