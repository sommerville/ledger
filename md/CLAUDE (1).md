# CLAUDE.md — Sommerville Ledger

**Working files:**
- `index.html` — Mobile app (deploy name for `Ledger_v14_3.html`)
- `ledger-desktop.html` — Desktop dashboard (new as of v14.3)
- `shared.js` — Shared state, encryption, storage, calculations (new as of v14.3)

**Version:** Ledger v14.3
**Line counts:** `index.html` ~13,810 · `ledger-desktop.html` ~8,300 · `shared.js` ~510

---

## Repository Structure

```
repo root/
├── icons/
│   ├── home/       ← 16 home grid icons (income.png, fire.png, etc.)
│   └── app/        ← 4 PWA icons (icon.png, icon-192.png, etc.)
├── images/
│   ├── banner.webp
│   └── banner-large.webp
├── favicon.ico
├── index.html          ← Mobile app
├── ledger-desktop.html ← Desktop dashboard
├── shared.js           ← Shared logic
├── manifest.json
├── sw.js
├── retirement.html     ← Early retirement planner (separate app)
├── CLAUDE.md
├── CHANGELOG.md
├── STYLE.md
└── MERGE.md
```

---

## Architecture — Multi-File Split (v14.3)

The app was split from a single 19,746-line file into three files to stay within Claude's context window for editing sessions.

### shared.js
Loaded first by both HTML files. Contains:
- All global state variables (`entries`, `accounts`, `expenses`, etc.)
- Encryption helpers (`encrypt`, `decrypt`, `deriveEncryptionKey`)
- All 20 `save*()` functions
- `loadFromStorage()` and `loadCoastData()`
- `migrateRetirementSources()` and `purgeOrphanedRetirementSources()`
- Net worth helpers (`getTotalInvestments`, `getTotalDebt`, `getCurrentNetWorth`, `getCurrentTotal`)
- Formatters (`fmt`, `fmtExpense`, `fmtDate`)
- Coast calc helpers (`coastCalcYTD`, `coastCalcAllTime`, `coastCalcMonthlyAvg`, `coastCalcForYear`)
- Retirement calc helpers (`retCalcYTD`, `retCalcYTDMerged`, `retCalcForYear`, `_retBonusSourcesFor`, `_retDisplaySources`)
- Theme palette helper (`retTheme`)
- Income helpers (`INCOME_TYPES`, `INCOME_VIEW_LABELS`, `incomeEntryMatchesView`)
- `exportData()` / `importData()` with callback support

### index.html (Mobile)
- All mobile pages, modals, and navigation
- PIN lock/unlock system
- Splash screens
- Home screen grid + dock
- All mobile JS (investments, expenses, income, debt, retirement, coast, FIRE, logbook, calculator, budget)
- `setDeviceMode('desktop')` redirects to `ledger-desktop.html`
- Stores PIN in `sessionStorage` at login for desktop handoff

### ledger-desktop.html (Desktop)
- Standalone — does not depend on index.html being open
- Loads `shared.js` for all data logic
- Has its own PIN lock screen and splash sequences
- On arrival via handoff from index.html: reads PIN from `sessionStorage`, derives encryption key, skips splash
- On direct load: shows splash → PIN → dashboard
- All `dt*` functions for dashboard rendering
- `setDeviceMode('mobile')` redirects back to `ledger.html`

---

## PIN / Encryption Handoff Flow

```
index.html login:
  attemptLogin() → encryptionKey = deriveEncryptionKey(pin)
                 → sessionStorage.setItem('pf_handoff_pin', pin)

User switches to desktop:
  setDeviceMode('desktop') → window.location.href = 'ledger-desktop.html'

ledger-desktop.html startup IIFE:
  sessionStorage has 'pf_handoff_pin' → desktopInit() immediately
  no handoff → showSplash() → checkPinStatus() → PIN screen

desktopInit():
  reads pf_handoff_pin → deriveEncryptionKey() → removeItem → loadFromStorage()
```

**Known issue:** Splash/PIN screens still show when switching mobile → desktop (handoff timing). Tracked for fix.

---

## localStorage Key Map (`pf_` prefix)

### Written by index.html
| Key | Type | Description |
|---|---|---|
| `pf_entries` | Array | Investment balance snapshots |
| `pf_accounts` | Array | Investment account configs |
| `pf_expenses` | Array | Expense entries |
| `pf_companies` | Array | Expense company configs |
| `pf_yearlyGoals` | Object | Annual contribution goals |
| `pf_metalsData` | Object | Precious metals oz/price by month |
| `pf_debtAccounts` | Array | Debt account configs |
| `pf_debtEntries` | Array | Debt balance snapshots |
| `pf_bulkDebtPayments` | Array | Extra debt payments |
| `pf_monthNotes` | Object | Monthly journal notes by YYYY-MM |
| `pf_incomeEntries` | Array | Income entries |
| `pf_payers` | Array | Income payer configs |
| `pf_retirementContribs` | Array | Retirement contribution records |
| `pf_retirementSources` | Array | Retirement source configs |
| `pf_retirementLimits` | Object | 401k/HSA annual limits |
| `pf_institutions` | Array | Investment institution names |
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
| `pf_dt_user_age` | String | User age (set in desktop settings) |
| `pf_basicCalcEnabled` | String | `'0'` or `'1'` |

### sessionStorage (transient)
| Key | Description |
|---|---|
| `pf_handoff_pin` | PIN passed from index.html to ledger-desktop.html at switch time. Cleared immediately after key derivation. |

---

## Theme System

Every HTML file must include this pre-load script as the **first thing in `<head>`**:

```html
<script>
    (function() {
        var t = localStorage.getItem('pf_theme') || 'alaskan';
        document.documentElement.classList.add(t === 'sunset' ? 'sunset-theme' : 'alaskan-theme');
    })();
</script>
```

### Themes
- `alaskan-theme` — Aurora Borealis dark, gold accent `#D4AF37` (default)
- `sunset-theme` — Hawaiian sunset, warm crimson & gold accent `#F5C030`

`setTheme(theme)` is in `shared.js` logic but implemented differently per file:
- `index.html` — rebuilds charts, closes modal
- `ledger-desktop.html` — calls `dtApplyThemeVars()`, calls `dtRefresh()`

---

## Service Worker

`sw.js` caches all files. Bump `CACHE_NAME` on every deploy.

Current cache list includes: `index.html`, `ledger-desktop.html`, `shared.js`, `manifest.json`, `favicon.ico`, `icons/app/*` (4 files), `images/*` (2 files), `icons/home/*` (16 files).

`retirement.html` not yet in cache — add when uploaded to repo.

---

## Per-Session Checklist

When uploading a new version:
- [ ] Bump `CACHE_NAME` in `sw.js`
- [ ] Unregister old service worker in DevTools before testing
- [ ] Test both `index.html` and `ledger-desktop.html`
- [ ] Verify theme switching works in both files

---

## Working Style
- One change at a time
- Always download and test before proceeding
- Incremental verifiable changes over large combined refactors
- JS comments intentionally preserved as navigation landmarks for Claude sessions
- Upload only changed files — don't redeploy everything every session
