/**
 * shared.js — Sommerville Suite v14.3
 *
 * Shared state, encryption, storage, and calculation helpers used by
 * both ledger.html (mobile) and ledger-desktop.html (desktop dashboard).
 *
 * Load order in EVERY HTML file:
 *   1. Theme pre-load <script> (inline, first child of <head>)
 *   2. <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js">
 *   3. <script src="shared.js">
 *   4. Page-specific <script> block
 *
 * Design rule: shared.js must have ZERO DOM references.
 * It is pure data + logic. DOM work belongs in the page scripts.
 * Exception: retTheme() reads body.classList — that's intentional and safe.
 */

// ─── Month key helper ─────────────────────────────────────────────────────────
// Always local time — toISOString() is UTC and shifts month for US timezones.
function moKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

// ─── Global state ─────────────────────────────────────────────────────────────
var entries            = [];
var accounts           = [];
var institutions       = ['M1', 'Charles Schwab', 'Sofi', 'T.Rowe', 'Empower', 'HSA Bank'];
var expenses           = [];
var companies          = [];
var yearlyGoals        = {};
var metalsData         = {};
var demoMode           = false;
var taxAdjustEnabled   = true;
var taxRatePct         = 25;
var debtAccounts       = [];
var debtEntries        = [];
var bulkDebtPayments   = [];
var monthNotes         = {};
var incomeEntries      = [];
var payers             = [];
var retirementContribs = [];
var retirementLimits   = {};
var retirementSources  = [];
var coastContribs      = [];
var coastAccounts      = [];

// ─── Encryption ───────────────────────────────────────────────────────────────
var encryptionKey = null;

function deriveEncryptionKey(pin) {
    return CryptoJS.PBKDF2(pin, 'portfolio-salt-v1', {
        keySize: 256/32,
        iterations: 10000
    }).toString();
}

function encrypt(data) {
    if (!encryptionKey) return data;
    try {
        return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
    } catch(e) { return data; }
}

function decrypt(encryptedData) {
    if (!encryptionKey || !encryptedData) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
        const str   = bytes.toString(CryptoJS.enc.Utf8);
        if (str) return JSON.parse(str);
    } catch(e) {}
    try { return JSON.parse(encryptedData); } catch(e2) { return null; }
}

// ─── Save helpers ─────────────────────────────────────────────────────────────
function saveEntries()              { localStorage.setItem('pf_entries',             encrypt(entries)); }
function saveAccounts()             { localStorage.setItem('pf_accounts',            encrypt(accounts)); }
function saveInstitutions()         { localStorage.setItem('pf_institutions',         encrypt(institutions)); }
function saveExpenses()             { localStorage.setItem('pf_expenses',             encrypt(expenses)); }
function saveCompanies()            { localStorage.setItem('pf_companies',            encrypt(companies)); }
function saveYearlyGoals()          { localStorage.setItem('pf_yearlyGoals',          encrypt(yearlyGoals)); }
function saveMetalsData()           { localStorage.setItem('pf_metalsData',           encrypt(metalsData)); }
function saveDebtAccounts()         { localStorage.setItem('pf_debtAccounts',         encrypt(debtAccounts)); }
function saveDebtEntries()          { localStorage.setItem('pf_debtEntries',          encrypt(debtEntries)); }
function saveBulkDebtPayments()     { localStorage.setItem('pf_bulkDebtPayments',     encrypt(bulkDebtPayments)); }
function saveMonthNotes()           { localStorage.setItem('pf_monthNotes',           encrypt(monthNotes)); }
function saveIncomeEntries()        { localStorage.setItem('pf_incomeEntries',         encrypt(incomeEntries)); }
function savePayers()               { localStorage.setItem('pf_payers',               encrypt(payers)); }
function saveRetirementLimitsData() { localStorage.setItem('pf_retirementLimits',     encrypt(retirementLimits)); }
function saveRetirementContribs()   { localStorage.setItem('pf_retirementContribs',   encrypt(retirementContribs)); }
function saveRetirementSources()    { localStorage.setItem('pf_retirementSources',    encrypt(retirementSources)); }
function saveCoastContribs()        { localStorage.setItem('pf_coastContribs',         encrypt(coastContribs)); }
function saveCoastAccounts()        { localStorage.setItem('pf_coastAccounts',         encrypt(coastAccounts)); }

// ─── Coast data loader ────────────────────────────────────────────────────────
function loadCoastData() {
    try { coastContribs = decrypt(localStorage.getItem('pf_coastContribs')) || []; } catch(e) { coastContribs = []; }
    try { coastAccounts = decrypt(localStorage.getItem('pf_coastAccounts')) || []; } catch(e) { coastAccounts = []; }
}

// ─── Retirement source migration ──────────────────────────────────────────────
// Splits any source that has both 401k and HSA contrib types into two sources.
// Idempotent — safe to run on every load.
function migrateRetirementSources() {
    const hsaKeys  = ['hsa_employee', 'hsa_employer'];
    const k401Keys = ['401k_pretax', '401k_roth', 'after_tax', 'employer_match'];
    var changed    = false;
    var toAdd      = [];
    var srcIdRemap = {}; // old sourceId → new HSA sourceId

    retirementSources.forEach(function(src) {
        var types   = src.contribTypes || [];
        var has401k = types.some(function(k) { return k401Keys.includes(k); });
        var hasHSA  = types.some(function(k) { return hsaKeys.includes(k);  });
        if (has401k && hasHSA) {
            src.contribTypes = types.filter(function(k) { return !hsaKeys.includes(k); });
            var hsaExists = retirementSources.some(function(s) {
                return s.sponsor === src.sponsor &&
                       (s.contribTypes || []).some(function(k) { return hsaKeys.includes(k); });
            });
            if (!hsaExists) {
                var newHsaId = 'src_' + Date.now() + '_h';
                toAdd.push({
                    id:           newHsaId,
                    label:        (src.sponsor || src.label) + ' \u2014 HSA',
                    institution:  src.institution || '',
                    sponsor:      src.sponsor || '',
                    contribTypes: types.filter(function(k) { return hsaKeys.includes(k); })
                });
                srcIdRemap[src.id] = newHsaId;
            }
            changed = true;
        }
    });
    retirementSources.push.apply(retirementSources, toAdd);

    if (Object.keys(srcIdRemap).length > 0) {
        retirementContribs.forEach(function(entry) {
            var newHsaId = srcIdRemap[entry.sourceId];
            if (!newHsaId || !entry.amounts) return;
            var hsaAmounts = {};
            var hsaTotal   = 0;
            hsaKeys.forEach(function(k) {
                if (entry.amounts[k] > 0) {
                    hsaAmounts[k]   = entry.amounts[k];
                    hsaTotal       += entry.amounts[k];
                    delete entry.amounts[k];
                }
            });
            if (hsaTotal > 0) {
                entry.totalAmount = Object.values(entry.amounts).reduce(function(a,b) { return a+(b||0); }, 0);
                retirementContribs.push({
                    id:          'rc_' + Date.now() + '_hm',
                    date:        entry.date,
                    sourceId:    newHsaId,
                    sourceName:  (toAdd.find(function(s) { return s.id === newHsaId; }) || {}).label || 'HSA',
                    amounts:     hsaAmounts,
                    totalAmount: hsaTotal,
                    ts:          (entry.ts || Date.now()) + 1
                });
            }
        });
        retirementContribs.sort(function(a,b) { return a.date.localeCompare(b.date); });
        saveRetirementContribs();
    }
    if (changed) saveRetirementSources();
}

// ─── Orphan cleanup ───────────────────────────────────────────────────────────
function purgeOrphanedRetirementSources() {
    var payerNames = new Set(payers.map(function(p) { return p.name; }));
    var before     = retirementSources.length;
    retirementSources = retirementSources.filter(function(s) {
        return !s.sponsor || payerNames.has(s.sponsor);
    });
    if (retirementSources.length !== before) saveRetirementSources();
}

// ─── Load all data from localStorage ─────────────────────────────────────────
function loadFromStorage() {
    try { entries            = decrypt(localStorage.getItem('pf_entries'))            || []; } catch(e) { entries            = []; }
    try { accounts           = decrypt(localStorage.getItem('pf_accounts'))           || []; } catch(e) { accounts           = []; }
    try { expenses           = decrypt(localStorage.getItem('pf_expenses'))           || []; } catch(e) { expenses           = []; }
    try { companies          = decrypt(localStorage.getItem('pf_companies'))          || []; } catch(e) { companies          = []; }
    try { yearlyGoals        = decrypt(localStorage.getItem('pf_yearlyGoals'))        || {}; } catch(e) { yearlyGoals        = {}; }
    try { metalsData         = decrypt(localStorage.getItem('pf_metalsData'))         || {}; } catch(e) { metalsData         = {}; }
    try { debtAccounts       = decrypt(localStorage.getItem('pf_debtAccounts'))       || []; } catch(e) { debtAccounts       = []; }
    try { debtEntries        = decrypt(localStorage.getItem('pf_debtEntries'))        || []; } catch(e) { debtEntries        = []; }
    try { bulkDebtPayments   = decrypt(localStorage.getItem('pf_bulkDebtPayments'))   || []; } catch(e) { bulkDebtPayments   = []; }
    try { monthNotes         = decrypt(localStorage.getItem('pf_monthNotes'))         || {}; } catch(e) { monthNotes         = {}; }
    try {
        incomeEntries = decrypt(localStorage.getItem('pf_incomeEntries')) || [];
        // One-time cleanup: strip orphaned 'gross' field where 'grossPay' exists
        incomeEntries.forEach(function(e) { if ('gross' in e && 'grossPay' in e) delete e.gross; });
    } catch(e) { incomeEntries = []; }
    try { payers             = decrypt(localStorage.getItem('pf_payers'))             || []; } catch(e) { payers             = []; }
    try { retirementContribs = decrypt(localStorage.getItem('pf_retirementContribs')) || []; } catch(e) { retirementContribs = []; }
    try { retirementLimits   = decrypt(localStorage.getItem('pf_retirementLimits'))   || {}; } catch(e) { retirementLimits   = {}; }
    try { retirementSources  = decrypt(localStorage.getItem('pf_retirementSources'))  || []; } catch(e) { retirementSources  = []; }

    purgeOrphanedRetirementSources();
    migrateRetirementSources();
    loadCoastData();

    try {
        var inst = decrypt(localStorage.getItem('pf_institutions'));
        if (Array.isArray(inst) && inst.length) institutions = inst;
    } catch(e) {}

    // Tax rate (stored unencrypted)
    var savedTaxRate = localStorage.getItem('pf_taxRate');
    if (savedTaxRate !== null) taxRatePct = parseFloat(savedTaxRate) || 25;
}

// ─── Net worth helpers ────────────────────────────────────────────────────────
function getTotalInvestments() {
    var total = 0;
    accounts.forEach(function(acct) {
        var ae = entries.filter(function(e) { return e.accountId === acct.id; })
                        .sort(function(a,b) { return a.date.localeCompare(b.date); });
        if (ae.length) total += ae[ae.length - 1].amount;
    });
    return total;
}

function getTotalDebt() {
    // Cap at prior month — a new month with no entries cannot zero-out net worth
    var _n  = new Date();
    var _p  = new Date(_n.getFullYear(), _n.getMonth() - 1, 1);
    var _pk = _p.getFullYear() + '-' + String(_p.getMonth() + 1).padStart(2, '0');
    var total = 0;
    debtAccounts.forEach(function(acct) {
        var ae = debtEntries
            .filter(function(e) { return e.accountId === acct.id && e.date.slice(0,7) <= _pk; })
            .sort(function(a,b) { return a.date.localeCompare(b.date); });
        if (ae.length) total += ae[ae.length - 1].amount;
    });
    return total;
}

function getCurrentNetWorth() { return getTotalInvestments() - getTotalDebt(); }

function getCurrentTotal() {
    var total = 0;
    accounts.forEach(function(acct) {
        var ae = entries.filter(function(e) { return e.accountId === acct.id; });
        if (ae.length) total += ae[ae.length - 1].amount;
    });
    return total;
}

// ─── Age ──────────────────────────────────────────────────────────────────────
var BIRTHDAY = new Date(1985, 3, 29); // April 29, 1985

function getCurrentAge() {
    var today  = new Date();
    var age    = today.getFullYear() - BIRTHDAY.getFullYear();
    var passed = today.getMonth() > BIRTHDAY.getMonth() ||
        (today.getMonth() === BIRTHDAY.getMonth() && today.getDate() >= BIRTHDAY.getDate());
    if (!passed) age--;
    return age;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmt(n) {
    var value = demoMode ? n * 0.01 : n;
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(Math.round(value));
}

function fmtExpense(n) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(Math.round(n));
}

function fmtDate(str) {
    var d     = new Date(str);
    var month = d.toLocaleDateString('en-US', { month: 'short' });
    var year  = String(d.getFullYear()).slice(-2);
    return month + " '" + year;
}

// ─── Coast calculation helpers ────────────────────────────────────────────────
function coastCalcYTD() {
    var yr = new Date().getFullYear();
    return coastContribs
        .filter(function(e) { return e.date && e.date.startsWith(String(yr)); })
        .reduce(function(s,e) { return s + (e.amount||0); }, 0);
}

function coastCalcAllTime() {
    return coastContribs.reduce(function(s,e) { return s + (e.amount||0); }, 0);
}

function coastCalcForYear(yr) {
    return coastContribs
        .filter(function(e) { return e.date && e.date.startsWith(String(yr)); })
        .reduce(function(s,e) { return s + (e.amount||0); }, 0);
}

function coastCalcMonthlyAvg() {
    if (!coastContribs.length) return 0;
    var dated = coastContribs.filter(function(e) { return !!e.date; })
                              .map(function(e) { return e.date.slice(0,7); })
                              .sort();
    if (!dated.length) return 0;
    var parts1  = dated[0].split('-').map(Number);
    var fy = parts1[0], fm = parts1[1];
    var now = new Date();
    var ny  = now.getFullYear(), nm = now.getMonth()+1;
    var months = (ny-fy)*12 + (nm-fm) + 1;
    return months > 0 ? coastCalcAllTime() / months : 0;
}

// ─── Retirement calculation helpers ──────────────────────────────────────────
var CONTRIB_TYPES = {
    '401k_pretax':    { label: '401k Pre-Tax',    group: '401k_emp', limitKey: 'limit401k'      },
    '401k_roth':      { label: 'Roth 401k',        group: '401k_emp', limitKey: 'limit401k'      },
    'after_tax':      { label: 'After-Tax',         group: '401k_at',  limitKey: 'limitTotal401k' },
    'employer_match': { label: 'Employer Match',    group: '401k_er',  limitKey: 'limitTotal401k' },
    'hsa_employee':   { label: 'HSA (Employee)',    group: 'hsa_emp',  limitKey: 'limitHSA'       },
    'hsa_employer':   { label: 'HSA (Employer)',    group: 'hsa_er',   limitKey: 'limitHSA'       },
};

function retCalcYTD(sourceIdFilter) {
    var yrStr = String(new Date().getFullYear());
    var es    = retirementContribs.filter(function(e) { return e.date && e.date.startsWith(yrStr); });
    if (sourceIdFilter) es = es.filter(function(e) { return e.sourceId === sourceIdFilter; });
    var totals = {};
    Object.keys(CONTRIB_TYPES).forEach(function(k) { totals[k] = 0; });
    es.forEach(function(e) {
        if (e.amounts && typeof e.amounts === 'object') {
            Object.entries(e.amounts).forEach(function(kv) {
                if (kv[0] in totals) totals[kv[0]] += (kv[1]||0);
            });
        } else if (e.contribType && e.contribType in totals) {
            totals[e.contribType] += (e.amount||0);
        }
    });
    var employee401k = totals['401k_pretax'] + totals['401k_roth'];
    var total401k    = employee401k + totals['after_tax'] + totals['employer_match'];
    var totalHSA     = totals['hsa_employee'] + totals['hsa_employer'];
    return { totals: totals, employee401k: employee401k, total401k: total401k, totalHSA: totalHSA, grandTotal: total401k + totalHSA };
}

function retCalcYTDMerged(sourceIds) {
    var yrStr = String(new Date().getFullYear());
    var idSet = new Set(sourceIds);
    var es    = retirementContribs.filter(function(e) {
        return e.date && e.date.startsWith(yrStr) && idSet.has(e.sourceId);
    });
    var totals = {};
    Object.keys(CONTRIB_TYPES).forEach(function(k) { totals[k] = 0; });
    es.forEach(function(e) {
        if (e.amounts && typeof e.amounts === 'object') {
            Object.entries(e.amounts).forEach(function(kv) {
                if (kv[0] in totals) totals[kv[0]] += (kv[1]||0);
            });
        } else if (e.contribType && e.contribType in totals) {
            totals[e.contribType] += (e.amount||0);
        }
    });
    var employee401k = totals['401k_pretax'] + totals['401k_roth'];
    var total401k    = employee401k + totals['after_tax'] + totals['employer_match'];
    var totalHSA     = totals['hsa_employee'] + totals['hsa_employer'];
    return { totals: totals, employee401k: employee401k, total401k: total401k, totalHSA: totalHSA, grandTotal: total401k + totalHSA };
}

function retCalcForYear(yr, srcId) {
    var yrStr = String(yr);
    var es = retirementContribs.filter(function(e) { return e.date && e.date.startsWith(yrStr); });
    if (srcId) es = es.filter(function(e) { return e.sourceId === srcId; });
    return es.reduce(function(s,e) { return s + (e.totalAmount || e.amount || 0); }, 0);
}

function _retBonusSourcesFor(src) {
    var bonusSponsor = (src.sponsor || src.label || '') + ' \u2014 Bonus';
    return retirementSources.filter(function(s) {
        return s.sponsor === bonusSponsor || (s.id.endsWith('_b') && s.sponsor === bonusSponsor);
    });
}

function _retDisplaySources() {
    var bonusSponsors = new Set(
        payers.filter(function(p) { return p.defaultType === 'bonus'; }).map(function(p) { return p.name; })
    );
    return retirementSources.filter(function(s) { return !bonusSponsors.has(s.sponsor); });
}

// ─── Theme palette helper ─────────────────────────────────────────────────────
// Returns a colour palette based on the current body theme class.
function retTheme() {
    var isSunset = document.body.classList.contains('sunset-theme');
    var isDark   = document.body.classList.contains('alaskan-theme') || isSunset;
    return {
        isDark:    isDark,
        isSunset:  isSunset,
        accent:    isSunset ? '#F5C030' : (isDark ? '#D4AF37' : '#2a69ac'),
        cardBg:    isSunset ? '#2A0808' : (isDark ? '#1A2A42' : '#f4f8ff'),
        inputBg:   isSunset ? '#1A0404' : (isDark ? '#0D1829' : '#fff'),
        borderClr: isSunset ? '#5A2018' : (isDark ? '#2A3A52' : '#dde4f0'),
        textClr:   isSunset ? '#F0D0A0' : (isDark ? '#E0E8F0' : '#222'),
        mutedClr:  isSunset ? '#C08060' : (isDark ? '#7A8FA0' : '#666'),
        valClr:    isSunset ? '#F5C030' : (isDark ? '#60A5FA' : '#1e3c72'),
        greenClr:  isSunset ? '#4ADE80' : (isDark ? '#4ADE80' : '#16a34a'),
        warnClr:   '#F87171',
    };
}

// ─── Income helpers ───────────────────────────────────────────────────────────
var INCOME_TYPES = {
    payroll:    { label: 'Payroll',    emoji: '💼' },
    dividends:  { label: 'Dividends',  emoji: '📈' },
    tax_refund: { label: 'Tax Refund', emoji: '🏛️' },
    bonus:      { label: 'Bonus',      emoji: '🎉' },
};

var INCOME_VIEW_LABELS = {
    total:    'Past Year Total',
    hilcorp:  'Hilcorp — Past Year',
    sunshine: 'Sunshine — Past Year',
    payroll:  'Payroll — Past Year',
    bonus:    'Bonus — Past Year',
    other:    'Other — Past Year',
};

function incomeEntryMatchesView(e, view) {
    if (view === 'total') return true;
    var payerLower = (e.payerName || '').toLowerCase();
    var typeLower  = (e.type || '').toLowerCase();
    if (view === 'hilcorp')  return payerLower.includes('hilcorp');
    if (view === 'sunshine') return payerLower.includes('sunshine');
    if (view === 'payroll')  return typeLower === 'payroll';
    if (view === 'bonus')    return typeLower === 'bonus';
    if (view === 'other') {
        return !payerLower.includes('hilcorp') && !payerLower.includes('sunshine') &&
               typeLower !== 'payroll' && typeLower !== 'bonus';
    }
    return true;
}

// ─── Export / Import ──────────────────────────────────────────────────────────
// exportData() and importData() are shared so either page can trigger a backup.
// importData() takes an optional onSuccess callback (page calls dtRefresh / refreshAll).

function exportData() {
    var payload = {
        version:           'pf-backup-v2',
        exported:          new Date().toISOString(),
        entries:           entries,
        accounts:          accounts,
        institutions:      institutions,
        expenses:          expenses,
        companies:         companies,
        yearlyGoals:       yearlyGoals,
        metalsData:        metalsData,
        debtAccounts:      debtAccounts,
        debtEntries:       debtEntries,
        bulkDebtPayments:  bulkDebtPayments,
        monthNotes:        monthNotes,
        incomeEntries:     incomeEntries,
        payers:            payers,
        retirementContribs: retirementContribs,
        retirementLimits:  retirementLimits,
        retirementSources: retirementSources,
        coastContribs:     coastContribs,
        coastAccounts:     coastAccounts,
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'sommerville-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event, onSuccess) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            if (data.entries)             { entries            = data.entries;            saveEntries();              }
            if (data.accounts)            { accounts           = data.accounts;           saveAccounts();             }
            if (data.institutions)        { institutions       = data.institutions;       saveInstitutions();         }
            if (data.expenses)            { expenses           = data.expenses;           saveExpenses();             }
            if (data.companies)           { companies          = data.companies;          saveCompanies();            }
            if (data.yearlyGoals)         { yearlyGoals        = data.yearlyGoals;        saveYearlyGoals();          }
            if (data.metalsData)          { metalsData         = data.metalsData;         saveMetalsData();           }
            if (data.debtAccounts)        { debtAccounts       = data.debtAccounts;       saveDebtAccounts();         }
            if (data.debtEntries)         { debtEntries        = data.debtEntries;        saveDebtEntries();          }
            if (data.bulkDebtPayments)    { bulkDebtPayments   = data.bulkDebtPayments;   saveBulkDebtPayments();     }
            if (data.monthNotes)          { monthNotes         = data.monthNotes;         saveMonthNotes();           }
            if (data.incomeEntries)       { incomeEntries      = data.incomeEntries;      saveIncomeEntries();        }
            if (data.payers)              { payers             = data.payers;             savePayers();               }
            if (data.retirementContribs)  { retirementContribs = data.retirementContribs; saveRetirementContribs();  }
            if (data.retirementLimits)    { retirementLimits   = data.retirementLimits;   saveRetirementLimitsData(); }
            if (data.retirementSources)   { retirementSources  = data.retirementSources;  saveRetirementSources();   }
            if (data.coastContribs)       { coastContribs      = data.coastContribs;      saveCoastContribs();        }
            if (data.coastAccounts)       { coastAccounts      = data.coastAccounts;      saveCoastAccounts();        }
            if (typeof onSuccess === 'function') onSuccess();
        } catch(err) {
            alert('Import failed: ' + err.message);
        }
    };
    reader.readAsText(file);
}
