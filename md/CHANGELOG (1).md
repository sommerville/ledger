# CHANGELOG — Sommerville Ledger

---

## Ledger v14.3 — Multi-File Split

| Version | Changes |
|---|---|
| v14.3 | **Multi-file architecture.** Single 19,746-line file split into three files to stay within Claude's context window and enable targeted editing. `index.html` (~13,810 lines) — mobile app. `ledger-desktop.html` (~8,300 lines) — desktop dashboard. `shared.js` (~510 lines) — shared state, encryption, storage, calculations. |
| v14.3 | **shared.js created.** Contains all global state vars, encrypt/decrypt, 20 save helpers, loadFromStorage, migrateRetirementSources, purgeOrphanedRetirementSources, net worth helpers, formatters, coast calc helpers, retirement calc helpers, retTheme, INCOME_TYPES, incomeEntryMatchesView, exportData/importData. |
| v14.3 | **ledger-desktop.html created.** Standalone desktop dashboard with its own PIN lock, splash screens, and all dt* rendering functions. Loads shared.js for data logic. setDeviceMode('mobile') redirects to index.html. |
| v14.3 | **PIN handoff.** index.html stores PIN in sessionStorage at login. ledger-desktop.html reads it on load, derives encryption key, clears it, loads data. Allows seamless mobile → desktop switch without re-entering PIN. |
| v14.3 | **Repository reorganized.** Icons split into `icons/home/` (16 home grid icons) and `icons/app/` (4 PWA icons). App icons moved from root to `icons/app/`. All paths updated in HTML files, manifest.json, and sw.js. |
| v14.3 | **manifest.json updated.** Name → `Sommerville Ledger`, short_name → `Sommerville`, background_color → `#04090F`, theme_color → `#D4AF37`. |
| v14.3 | **setDeviceMode patched.** `index.html` setDeviceMode('desktop') now redirects to `ledger-desktop.html` instead of manipulating CSS classes. On startup, if pf_deviceMode is 'desktop', redirects immediately. |
| v14.3 | **Background music element removed.** Dead `<audio id="bgMusic">` element removed from index.html. |
| v14.3 | **Known issue — desktop handoff.** Splash/PIN screens still show when switching mobile → desktop even with handoff PIN in sessionStorage. Data loads correctly after. Tracked for fix. |

---

## Ledger v10.0 — v14.1

| Version | Changes |
|---|---|
| v10.0 | **Accounts page added.** `accountsPage` replaces bare investments view. Investment accounts (`401k`, `ira`, `hsa`, `taxable`, `metals`) managed via `configAccountsModal`. `entries` array stores monthly balance snapshots per account. Metals accounts render separately in data dump with oz + price inputs. `metalsData` object stores `{ gold, silver, goldPrice, silverPrice }` keyed by YYYY-MM. |
| v10.0 | **Debt page added.** `debtPage` with `debtAccounts` and `debtEntries`. `bulkDebtPayments` for lump-sum payoffs. `configDebtAccountsModal` for account management. |
| v10.0 | **Coast contributions added to data dump.** `ddSectionCoast(mk)`. `coastAccounts` configured via `coastAccountsModal`. `coastContribs` entries pinned to `-15` of month key. |
| v10.0 | **Overview / Statement panel.** Full-screen summary sliding down from top. `openOverview()` / `buildOverview()` / `closeOverview()`. |
| v10.0 | **Home Value mobile support.** `mobileAddHomeValue()` and `mobileRenderHVList()`. |
| v10.0 | **Income Stats page.** `incomeStatsPage` with milestones and year-by-year totals. |
| v10.0 | **FIRE page restructured.** Three tabs — coast, goals, plan. |
| v10.0 | **Desktop dashboard added.** `#desktopDashboard` with sidebar navigation, 10 views: dashboard, investments, net worth, expenses, income, FIRE, retirement, coast contributions, calculators, data dump, settings. Activated via `setDeviceMode('desktop')`. |
| v10.0 | **Two themes.** `alaskan-theme` (Aurora dark, gold) and `sunset-theme` (Hawaiian, crimson/gold). Desert theme removed. |
| v10.0 | **Demo Mode.** `demoMode` flag multiplies all values by 0.01 for screenshots. |
| v10.0 | **Tax rate settings.** `pf_taxEnabled`, `pf_taxRate`, `taxRatePct`, `saveTaxRate()`. |
| v10.0 | **PIN security.** AES-256 encryption via CryptoJS. PBKDF2 key derivation. SHA-256 PIN hash. |
| v14.1 | **Version bump to v14.1.** All intermediate v10–v13 changes consolidated. Working file: `Ledger_v14_1.html`. Line count: ~20,151. |

---

## Ledger v8.x — v9.x

| Version | Changes |
|---|---|
| v8.0 | **Retirement contributions section.** `retirementPage` with source-based contribution tracking. `CONTRIB_TYPES`: 401k_pretax, 401k_roth, after_tax, employer_match, hsa_employee, hsa_employer. `retirementSources` array. `retCalcYTD()` and `retCalcYTDMerged()`. |
| v8.0 | **Retirement — HSA split.** `migrateRetirementSources()` splits sources with both 401k and HSA types into two. |
| v8.0 | **Orphan retirement source cleanup.** `purgeOrphanedRetirementSources()` runs at load. |
| v8.8 | **Hilcorp contributions fixed.** |

---

## Ledger v7.x
See `HANDOVER_Ledger_v7.md`

## Ledger v5.x — v6.0
See `HANDOVER_Ledger_v6.md`

## Ledger v4.x
See `HANDOVER_Ledger_v5.md`

## Portfolio v17.0 → Ledger v4.0
See `HANDOVER_Ledger_v4.md`
