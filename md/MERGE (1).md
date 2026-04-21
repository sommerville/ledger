# MERGE.md — Sommerville Multi-File Architecture

**Goal:** Multi-HTML PWA suite sharing one localStorage origin, one service worker, and one manifest.

---

## Current File Structure

```
repo root/
├── icons/
│   ├── home/           ← 16 home grid icons
│   └── app/            ← 4 PWA app icons
├── images/
│   ├── banner.webp
│   └── banner-large.webp
├── favicon.ico
├── index.html          ← Mobile app (Ledger v14.3) ✅ Done
├── ledger-desktop.html ← Desktop dashboard ✅ Done
├── shared.js           ← Shared logic ✅ Done
├── retirement.html     ← Early retirement planner ✅ Done (not yet in repo)
├── manifest.json       ✅ Updated
├── sw.js               ✅ Updated
├── CLAUDE.md
├── CHANGELOG.md
├── STYLE.md
└── MERGE.md
```

---

## App Inventory

| File | Title | Status | Description |
|---|---|---|---|
| `index.html` | Sommerville Ledger | ✅ Done | Full mobile app — investments, income, expenses, debt, FIRE, retirement, coast, retirement plan |
| `ledger-desktop.html` | Ledger Desktop | ✅ Done | Desktop dashboard — all data views, logbook, settings |
| `shared.js` | Shared Logic | ✅ Done | State, encryption, storage, calculations shared by all files |
| `retirement.html` | Early Retirement | ✅ Built, 🔲 Not in repo | 4-phase retirement roadmap planner |
| `index-hub.html` | Sommerville Hub | 🔲 Planned | Launcher menu — links to all tools |

---

## localStorage Key Map

All keys use the `pf_` prefix. Same origin = shared across all HTML files automatically.

### Written by index.html
| Key | Type | Description |
|---|---|---|
| `pf_entries` | Array | Investment balance snapshots |
| `pf_accounts` | Array | Investment account configs |
| `pf_expenses` | Array | Expense entries |
| `pf_incomeEntries` | Array | Income entries |
| `pf_payers` | Array | Income payer configs |
| `pf_retirementContribs` | Array | Retirement contribution records |
| `pf_retirementSources` | Array | Retirement source configs |
| `pf_retirementLimits` | Object | 401k/HSA annual limits |
| `pf_debtAccounts` | Array | Debt account configs |
| `pf_debtEntries` | Array | Debt balance snapshots |
| `pf_bulkDebtPayments` | Array | Extra debt payments |
| `pf_metalsData` | Object | Precious metals oz/price by month |
| `pf_institutions` | Array | Investment institution names |
| `pf_companies` | Array | Expense company configs |
| `pf_yearlyGoals` | Object | Annual contribution goals |
| `pf_monthNotes` | Object | Monthly journal notes by YYYY-MM |
| `pf_coastContribs` | Array | Coast contribution entries |
| `pf_coastAccounts` | Array | Coast account configs |
| `pf_logbook` | Array | Logbook journal entries |
| `pf_pin` | String | Hashed PIN (SHA-256) |
| `pf_pin_hint` | String | PIN hint text |
| `pf_taxRate` | Number | Effective tax rate % |
| `pf_demoMode` | String | `'0'` or `'1'` |
| `pf_deviceMode` | String | `'mobile'` or `'desktop'` |
| `pf_theme` | String | `'alaskan'` or `'sunset'` |
| `pf_iconSize` | Number | Home grid icon size in px |
| `pf_basicCalcEnabled` | String | `'0'` or `'1'` |
| `pf_dt_user_age` | String | User age (set in desktop settings) |
| `pf_er_goal` | String | Phase 1 retirement goal (Ret Plan widget) |

### Written by ledger-desktop.html
| Key | Type | Description |
|---|---|---|
| `pf_theme` | String | Shared — also read by all files |
| `pf_taxRate` | Number | Shared — also read by index.html |
| `pf_deviceMode` | String | Shared — controls redirect on load |

### Written by retirement.html
| Key | Type | Description |
|---|---|---|
| `pf_theme` | String | Shared theme preference |
| `pf_taxRate` | Number | Tax rate if changed here |

### sessionStorage (transient, tab-scoped)
| Key | Description |
|---|---|
| `pf_handoff_pin` | PIN passed from index.html → ledger-desktop.html at switch time. Cleared immediately after key derivation. |

---

## Theme System

Every HTML file must include this pre-load script as the **first thing in `<head>`** — before any CSS:

```html
<script>
    (function() {
        var t = localStorage.getItem('pf_theme') || 'alaskan';
        document.documentElement.classList.add(t === 'sunset' ? 'sunset-theme' : 'alaskan-theme');
    })();
</script>
```

### Theme CSS required in every file
Copy from `index.html` or `ledger-desktop.html`:
- `body.alaskan-theme` — Aurora dark, accent `#D4AF37`
- `body.sunset-theme` — Hawaiian sunset, accent `#F5C030`

---

## Service Worker (sw.js)

Current cache list:

```javascript
const CACHE_NAME = 'Ledger v14.4 14';
const ASSETS = [
  './',
  './index.html',
  './ledger-desktop.html',
  './shared.js',
  './manifest.json',
  './favicon.ico',
  './icons/app/icon.png',
  './icons/app/icon-192.png',
  './icons/app/icon-512-maskable.png',
  './icons/app/icon-192-maskable.png',
  './images/banner.webp',
  './images/banner-large.webp',
  './icons/home/backtest.png',
  './icons/home/budget.png',
  './icons/home/calculator.png',
  './icons/home/compound-interest.png',
  './icons/home/data.png',
  './icons/home/debt.png',
  './icons/home/expenses.png',
  './icons/home/fire.png',
  './icons/home/home-value.png',
  './icons/home/income.png',
  './icons/home/investments.png',
  './icons/home/log.png',
  './icons/home/net-worth.png',
  './icons/home/retirement.png',
  './icons/home/settings.png',
  './icons/home/summary.png',
  './icons/home/ret-plan.png'
  // Add './retirement.html' when uploaded to repo
];
```

---

## Manifest (manifest.json)

```json
{
  "name": "Sommerville Ledger",
  "short_name": "Sommerville",
  "description": "Personal finance and FIRE planning suite",
  "start_url": "./index.html",
  "display": "fullscreen",
  "background_color": "#04090F",
  "theme_color": "#D4AF37",
  "orientation": "any",
  "icons": [
    { "src": "icons/app/icon-192.png",         "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/app/icon.png",              "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/app/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "icons/app/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## PIN / Encryption Handoff

When user switches from mobile → desktop:

```
index.html:
  attemptLogin() → encryptionKey = deriveEncryptionKey(pin)
                 → sessionStorage.setItem('pf_handoff_pin', pin)

  setDeviceMode('desktop') → window.location.href = 'ledger-desktop.html'

ledger-desktop.html startup:
  sessionStorage has 'pf_handoff_pin'
    → desktopInit() immediately (skip splash/PIN)
    → deriveEncryptionKey(pin) → removeItem → loadFromStorage()

  no handoff → showSplash() → checkPinStatus() → PIN screen
```

**Known issue:** Splash/PIN screens still show on handoff in some cases. Tracked for fix.

---

## Checklist — Per New HTML File

- [ ] Theme pre-load script in `<head>` (first child, before CSS)
- [ ] Both theme CSS blocks (alaskan, sunset)
- [ ] `<script src="shared.js">` loaded before page script
- [ ] `loadFromStorage()` called on init
- [ ] `← Menu` back link to future `index-hub.html`
- [ ] File added to `sw.js` cache list
- [ ] File added to this MERGE.md app inventory table
- [ ] `CACHE_NAME` bumped in sw.js

---

## Roadmap

### Next — retirement.html
- Upload to repo
- Add to sw.js cache list
- Verify it reads shared `pf_*` keys correctly

### Future — index-hub.html
Simple launcher page. Buttons linking to each tool. Theme switcher. Optional data status banner reading `pf_entries` count.

```
┌─────────────────────────────────────────┐
│  📱  Sommerville Ledger                 │
│      Investments, income, expenses      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🖥️  Desktop Dashboard                  │
│      Full wealth dashboard              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🏆  Early Retirement                   │
│      4-phase retirement roadmap         │
└─────────────────────────────────────────┘
```

When built: update `manifest.json` start_url to `./index-hub.html`.

---

*Last updated: April 2026*
*Files: index.html (~14,740 lines), ledger-desktop.html (~10,356 lines), shared.js (~510 lines)*
