// --- Configuration & État Global ---
const SUPABASE_URL = 'https://rpqjcmycfpmeqsqjnigg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcWpjbXljZnBtZXFzcWpuaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzM2NTIsImV4cCI6MjA5NDQwOTY1Mn0.5Z3VFXGHmfeAaTSMJqO0i5Wf6BwWfGrZz9uq6GAIcG8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

let appState = {
    activePropertyId: null,
    properties: []
};

let currentDate = new Date();
let currentMonth = '';
let currentMonthKey = '';

// Statuts mensuels pré-remplis pour les mois passés
const SEEDED_MONTHLY_STATUSES = {
    '2026-02': { 't_jules': 'paid', 't_thomas': 'paid', 't_maxime': 'paid' },
    '2026-03': { 't_jules': 'paid', 't_thomas': 'paid', 't_maxime': 'paid', 't_sarah': 'paid' },
    '2026-04': { 't_jules': 'paid', 't_thomas': 'paid', 't_maxime': 'paid', 't_sarah': 'paid' },
    '2026-05': { 't_jules': 'paid', 't_thomas': 'paid', 't_maxime': 'paid', 't_sarah': 'paid' }
};

// Données initiales réelles de la colocation
const DEFAULT_PROPERTIES = [
    {
        id: 'prop_ransart',
        name: 'Colocation Ransart',
        provisionCharges: 125,
        tenants: [
            {
                id: 't_jules',
                name: 'Chambre 1 - Jules',
                rent: 585,
                paymentDay: 1,
                deposit: 920,
                history: [
                    { month: '2026-02', label: 'Fév', status: 'paid', amount: 585 },
                    { month: '2026-03', label: 'Mar', status: 'paid', amount: 585 },
                    { month: '2026-04', label: 'Avr', status: 'paid', amount: 585 },
                    { month: '2026-05', label: 'Mai', status: 'paid', amount: 585 }
                ]
            },
            {
                id: 't_thomas',
                name: 'Chambre 2 - Thomas',
                rent: 585,
                paymentDay: 1,
                deposit: 920,
                history: [
                    { month: '2026-02', label: 'Fév', status: 'paid', amount: 585 },
                    { month: '2026-03', label: 'Mar', status: 'paid', amount: 585 },
                    { month: '2026-04', label: 'Avr', status: 'paid', amount: 585 },
                    { month: '2026-05', label: 'Mai', status: 'paid', amount: 585 }
                ]
            },
            {
                id: 't_maxime',
                name: 'Chambre 3 - Maxime',
                rent: 570,
                paymentDay: 5,
                deposit: 890,
                history: [
                    { month: '2026-02', label: 'Fév', status: 'paid', amount: 142.5 },
                    { month: '2026-03', label: 'Mar', status: 'paid', amount: 570 },
                    { month: '2026-04', label: 'Avr', status: 'paid', amount: 570 },
                    { month: '2026-05', label: 'Mai', status: 'paid', amount: 570 }
                ]
            },
            {
                id: 't_sarah',
                name: 'Chambre 4 - Sarah',
                rent: 570,
                paymentDay: 1,
                deposit: 890,
                history: [
                    { month: '2026-03', label: 'Mar', status: 'paid', amount: 427.5 },
                    { month: '2026-04', label: 'Avr', status: 'paid', amount: 570 },
                    { month: '2026-05', label: 'Mai', status: 'paid', amount: 570 }
                ]
            }
        ],
        fixedExpenses: [
            { id: 'exp_f1', name: 'Précompte immobilier (mensualisé)', amount: 67.48 },
            { id: 'exp_f2', name: 'Assurance vie (mensualisée)', amount: 54.76 },
            { id: 'exp_f3', name: 'Assurance incendie (mensualisée)', amount: 44.10 },
            { id: 'exp_f4', name: 'ARAG protection juridique', amount: 4.92 },
            { id: 'exp_f5', name: 'Crédit mensuel', amount: 614.00 }
        ],
        variableExpenses: [
            { id: 'exp_v1', name: 'Eau', amount: 90.00 },
            { id: 'exp_v2', name: 'Électricité', amount: 110.00 },
            { id: 'exp_v3', name: 'Gaz', amount: 85.00 },
            { id: 'exp_v4', name: 'Internet', amount: 50.00 },
            { id: 'exp_v5', name: 'Nettoyage', amount: 132.00 },
            { id: 'exp_v6', name: 'Netflix', amount: 10.99 },
            { id: 'exp_v7', name: 'Abandon de recours', amount: 7.00 }
        ]
    }
];

// État mensuel des paiements pour le mois sélectionné
let monthlyStatus = {}; // { tenantId: 'pending'|'paid'|'unpaid' }

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    // Boutons d'authentification
    document.getElementById('auth-signup-btn').onclick = handleSignUp;
    document.getElementById('auth-login-btn').onclick = handleLogin;
    document.getElementById('logout-btn').onclick = handleLogout;

    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthSession(session);
    });
}

function handleAuthSession(session) {
    if (session) {
        currentUser = session.user;
        document.getElementById('modal-auth').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-flex';
        initApp();
    } else {
        currentUser = null;
        document.getElementById('modal-auth').style.display = 'flex';
        document.getElementById('logout-btn').style.display = 'none';
        
        // Vider l'interface en attendant la connexion
        appState.properties = [];
        appState.activePropertyId = null;
        renderTabs();
        document.getElementById('property-title').textContent = "Veuillez vous connecter";
        document.getElementById('locataires-container').innerHTML = '';
        document.getElementById('garanties-container').innerHTML = '';
        document.getElementById('kpi-revenus').textContent = '0 €';
        document.getElementById('kpi-depenses').textContent = '0 €';
        document.getElementById('kpi-depenses-var').textContent = '0 €';
        document.getElementById('kpi-cashflow').textContent = '0 €';
        document.getElementById('kpi-taux').textContent = '0 %';
        document.getElementById('kpi-progress').style.width = '0%';
    }
}

async function handleSignUp() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    const msgEl = document.getElementById('auth-message');
    errEl.style.display = 'none';
    msgEl.style.display = 'none';

    if (!email || !password) return (errEl.textContent = 'Email et mot de passe requis', errEl.style.display = 'block');

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        errEl.textContent = error.message;
        errEl.style.display = 'block';
    } else {
        msgEl.textContent = 'Inscription réussie ! Vous êtes connecté.';
        msgEl.style.display = 'block';
    }
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';

    if (!email || !password) return (errEl.textContent = 'Email et mot de passe requis', errEl.style.display = 'block');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        errEl.textContent = error.message;
        errEl.style.display = 'block';
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
}

// --- Navigation Temporelle ---

function updateMonthDisplay() {
    const optionsMois = { month: 'long', year: 'numeric' };
    const moisFormat = currentDate.toLocaleDateString('fr-FR', optionsMois);
    currentMonth = moisFormat.charAt(0).toUpperCase() + moisFormat.slice(1);
    
    const moisNum = String(currentDate.getMonth() + 1).padStart(2, '0');
    currentMonthKey = `${currentDate.getFullYear()}-${moisNum}`;

    const el = document.getElementById('current-month-display');
    if (el) el.textContent = currentMonth;
}

function formatShortMonth(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    const name = d.toLocaleDateString('fr-FR', { month: 'short' });
    return name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
}

async function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateMonthDisplay();
    await loadMonthlyStatus();
    renderActiveProperty();
}

async function goToCurrentMonth() {
    currentDate = new Date();
    updateMonthDisplay();
    await loadMonthlyStatus();
    renderActiveProperty();
}

async function initApp() {
    updateMonthDisplay();
    setupEventListeners();

    // Chargement des données globales
    await loadGlobalData();
    
    // Chargement du statut pour ce mois
    await loadMonthlyStatus();

    renderTabs();
    if (appState.properties.length > 0) {
        if (!appState.activePropertyId || !appState.properties.find(p => p.id === appState.activePropertyId)) {
            appState.activePropertyId = appState.properties[0].id;
        }
        renderActiveProperty();
    }
}

// --- Chargement et Sauvegarde ---

async function loadGlobalData() {
    if (!currentUser) return;
    
    const { data, error } = await supabase
        .from('properties')
        .select('*');
        
    if (error) {
        console.error("Erreur de chargement:", error);
        return;
    }
    
    if (data && data.length > 0) {
        appState.properties = data.map(dbProp => ({
            id: dbProp.id,
            name: dbProp.name,
            provisionCharges: Number(dbProp.provision_charges),
            tenants: dbProp.tenants || [],
            fixedExpenses: dbProp.fixed_expenses || [],
            variableExpenses: dbProp.variable_expenses || []
        }));

        // Si le compte possédait le bien vide générique par défaut ("Mon Premier Bien" sans locataires), on le remplace par les données réelles
        if (appState.properties.length === 1 && 
            appState.properties[0].name === 'Mon Premier Bien' && 
            appState.properties[0].tenants.length === 0) {
            appState.properties = JSON.parse(JSON.stringify(DEFAULT_PROPERTIES));
            await saveGlobalData();
        }
    } else {
        // Nouveau compte : initialiser directement avec la colocation Ransart
        appState.properties = JSON.parse(JSON.stringify(DEFAULT_PROPERTIES));
        appState.activePropertyId = appState.properties[0].id;
        await saveGlobalData();
    }
}

async function saveGlobalData() {
    if (!currentUser) return;
    
    const upserts = appState.properties.map(p => ({
        id: p.id,
        user_id: currentUser.id,
        name: p.name,
        provision_charges: p.provisionCharges,
        tenants: p.tenants,
        fixed_expenses: p.fixedExpenses,
        variable_expenses: p.variableExpenses,
        updated_at: new Date()
    }));

    const { error } = await supabase.from('properties').upsert(upserts);
    if (error) {
        console.error("Erreur de sauvegarde:", error);
        alert("Erreur lors de la sauvegarde des données.");
    }
}

async function loadMonthlyStatus() {
    if (!currentUser) return;
    const { data, error } = await supabase
        .from('monthly_status')
        .select('status_data')
        .eq('month_key', currentMonthKey)
        .single();
        
    if (data && data.status_data) {
        monthlyStatus = data.status_data || {};
    } else if (SEEDED_MONTHLY_STATUSES[currentMonthKey]) {
        monthlyStatus = { ...SEEDED_MONTHLY_STATUSES[currentMonthKey] };
    } else {
        monthlyStatus = {};
    }
}

async function saveMonthlyStatus() {
    if (!currentUser) return;
    const id = `${currentUser.id}_${currentMonthKey}`;
    const { error } = await supabase.from('monthly_status').upsert({
        id: id,
        user_id: currentUser.id,
        month_key: currentMonthKey,
        status_data: monthlyStatus,
        updated_at: new Date()
    });
    if (error) console.error("Erreur sauvegarde statut", error);
}

// --- Helpers Métier ---

function getActiveProperty() {
    return appState.properties.find(p => p.id === appState.activePropertyId);
}

function getTenantStatus(tenantId) {
    return monthlyStatus[tenantId] || 'pending';
}

function getTenantRentForMonth(tenant, monthKey) {
    if (tenant.history) {
        const h = tenant.history.find(x => x.month === monthKey);
        if (h && typeof h.amount === 'number' && h.amount > 0) {
            return h.amount;
        }
    }
    return tenant.rent;
}

// Ajustement automatique du crédit selon la date (614 € avant sept 2026, 1 010 € à partir de sept 2026)
function getEffectiveFixedExpenses(prop, monthKey) {
    const [year, month] = (monthKey || currentMonthKey).split('-').map(Number);
    const isPostSept2026 = (year > 2026 || (year === 2026 && month >= 9));

    return (prop.fixedExpenses || []).map(exp => {
        if (exp.name && exp.name.toLowerCase().includes('crédit')) {
            if (isPostSept2026 && exp.amount === 614) {
                return { ...exp, amount: 1010 };
            } else if (!isPostSept2026 && exp.amount === 1010) {
                return { ...exp, amount: 614 };
            }
        }
        return exp;
    });
}

// --- Rendu Interface ---

function renderTabs() {
    const container = document.getElementById('property-tabs');
    container.innerHTML = '';
    
    appState.properties.forEach(prop => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${prop.id === appState.activePropertyId ? 'active' : ''}`;
        btn.textContent = prop.name;
        btn.onclick = () => {
            appState.activePropertyId = prop.id;
            saveGlobalData();
            renderTabs();
            renderActiveProperty();
        };
        container.appendChild(btn);
    });
}

function renderActiveProperty() {
    const prop = getActiveProperty();
    if (!prop) return;

    document.getElementById('property-title').innerHTML = `Gestion locative - ${prop.name} <span class="edit-icon" style="opacity: 1; cursor:pointer; font-size: 0.8em; margin-left: 10px;" onclick="deleteProperty('${prop.id}')" title="Supprimer ce bien">✏️</span>`;

    // Calculs
    let revenusAttendus = 0;
    let revenusReels = 0;
    let locatairesPayes = 0;

    prop.tenants.forEach(t => {
        const tenantRent = getTenantRentForMonth(t, currentMonthKey);
        revenusAttendus += tenantRent;
        const status = getTenantStatus(t.id);
        if (status === 'paid') {
            revenusReels += tenantRent;
            locatairesPayes++;
        }
    });

    const effectiveFixed = getEffectiveFixedExpenses(prop, currentMonthKey);
    const totalFixed = effectiveFixed.reduce((sum, e) => sum + e.amount, 0);
    const totalVar = prop.variableExpenses.reduce((sum, e) => sum + e.amount, 0);

    const provisionsRecues = locatairesPayes * prop.provisionCharges;
    const loyersNets = revenusReels - provisionsRecues;
    const cashFlow = loyersNets - totalFixed;
    const deltaCharges = provisionsRecues - totalVar;
    
    const tauxPaiement = prop.tenants.length > 0 
        ? Math.round((locatairesPayes / prop.tenants.length) * 100) 
        : 0;

    // Mise à jour KPIs
    document.getElementById('kpi-revenus').textContent = `${revenusReels.toFixed(2).replace('.00', '').replace('.', ',')} €`;
    document.getElementById('kpi-revenus-attendu').textContent = `sur ${revenusAttendus.toFixed(2).replace('.00', '').replace('.', ',')} € attendus`;
    
    document.getElementById('kpi-depenses').textContent = `${totalFixed.toFixed(2).replace('.', ',')} €`;
    document.getElementById('kpi-depenses-var').textContent = `${totalVar.toFixed(2).replace('.', ',')} €`;

    const kpiCashFlow = document.getElementById('kpi-cashflow');
    const signeCf = cashFlow > 0 ? '+' : '';
    kpiCashFlow.textContent = `${signeCf}${cashFlow.toFixed(2).replace('.', ',')} €`;
    kpiCashFlow.style.color = cashFlow > 0 ? 'var(--accent-success)' : (cashFlow < 0 ? 'var(--accent-danger)' : 'var(--text-primary)');

    const kpiDelta = document.getElementById('kpi-delta-charges');
    const signeDelta = deltaCharges > 0 ? '+' : '';
    kpiDelta.textContent = `Delta charges: ${signeDelta}${deltaCharges.toFixed(2).replace('.', ',')} €`;
    kpiDelta.style.color = deltaCharges > 0 ? 'var(--accent-success)' : (deltaCharges < 0 ? 'var(--accent-danger)' : 'inherit');

    document.getElementById('kpi-taux').textContent = `${tauxPaiement} %`;
    document.getElementById('kpi-progress').style.width = `${tauxPaiement}%`;

    // Cartes Locataires
    const locatairesContainer = document.getElementById('locataires-container');
    locatairesContainer.innerHTML = '';

    prop.tenants.forEach((t, i) => {
        const status = getTenantStatus(t.id);
        const currentRent = getTenantRentForMonth(t, currentMonthKey);
        let badgeClass = 'pending';
        let badgeText = '⏱️ En attente';
        if (status === 'paid') { badgeClass = 'paid'; badgeText = '✅ Payé'; }
        else if (status === 'unpaid') { badgeClass = 'unpaid'; badgeText = '❌ Impayé'; }

        // Pastilles d'historique
        let historyHTML = '';
        if (t.history && t.history.length > 0) {
            const dots = t.history.map(h => {
                const label = h.label || formatShortMonth(h.month);
                const statusLabel = h.status === 'paid' ? 'Payé' : (h.status === 'unpaid' ? 'Impayé' : 'En attente');
                return `
                    <div class="history-month" title="${h.month}: ${statusLabel} (${h.amount || t.rent} €)">
                        <span class="history-dot ${h.status}"></span>
                        <span>${label}</span>
                    </div>
                `;
            }).join('');
            historyHTML = `
                <div class="locataire-history">
                    <div class="history-title">Historique des paiements</div>
                    <div class="history-dots">
                        ${dots}
                    </div>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'locataire-card';
        card.style.animationDelay = `${i * 0.1}s`;

        const rentDisplay = currentRent !== t.rent 
            ? `${currentRent} € <span style="font-size:0.75rem; color: var(--text-secondary);">(prorata)</span>` 
            : `${currentRent} €`;

        card.innerHTML = `
            <div class="locataire-header">
                <div class="locataire-info">
                    <h3>${t.name} <span class="edit-icon" style="opacity: 1; cursor:pointer;" onclick="openTenantModal('${t.id}')">✏️</span></h3>
                    <div class="locataire-meta">
                        <span>📅 Attendu le ${t.paymentDay} du mois</span>
                    </div>
                </div>
                <div class="locataire-amount">${rentDisplay}</div>
            </div>
            
            <div class="status-badge ${badgeClass}">
                ${badgeText}
            </div>

            <div class="locataire-actions">
                <button class="btn-action btn-success ${status === 'paid' ? 'active' : ''}" 
                        onclick="setTenantStatus('${t.id}', 'paid')">
                    ✅ Reçu
                </button>
                <button class="btn-action btn-danger ${status === 'unpaid' ? 'active' : ''}" 
                        onclick="setTenantStatus('${t.id}', 'unpaid')">
                    ❌ Non reçu
                </button>
            </div>
            
            ${historyHTML}
        `;
        locatairesContainer.appendChild(card);
    });

    // Garanties locatives
    const garantiesContainer = document.getElementById('garanties-container');
    garantiesContainer.innerHTML = '';
    prop.tenants.forEach(t => {
        const card = document.createElement('div');
        card.className = 'kpi-card clickable';
        card.onclick = () => openGuaranteeModal(t.id);
        card.innerHTML = `
            <div class="kpi-icon highlight">🔒</div>
            <div class="kpi-details">
                <h3>${t.name} <span class="edit-icon">✏️</span></h3>
                <p class="kpi-value">${t.deposit} €</p>
            </div>
        `;
        garantiesContainer.appendChild(card);
    });
}

function setTenantStatus(tenantId, status) {
    monthlyStatus[tenantId] = status;
    saveMonthlyStatus();

    // Mettre à jour l'historique visuel du locataire pour ce mois
    const prop = getActiveProperty();
    if (prop) {
        const tenant = prop.tenants.find(t => t.id === tenantId);
        if (tenant) {
            if (!tenant.history) tenant.history = [];
            const existing = tenant.history.find(h => h.month === currentMonthKey);
            if (existing) {
                existing.status = status;
            } else {
                tenant.history.push({
                    month: currentMonthKey,
                    label: formatShortMonth(currentMonthKey),
                    status: status,
                    amount: tenant.rent
                });
                tenant.history.sort((a, b) => a.month.localeCompare(b.month));
            }
            saveGlobalData();
        }
    }

    renderActiveProperty();
}

// --- Événements et Modales ---

function setupEventListeners() {
    // Navigation temporelle
    document.getElementById('prev-month-btn').onclick = () => changeMonth(-1);
    document.getElementById('next-month-btn').onclick = () => changeMonth(1);
    document.getElementById('today-month-btn').onclick = () => goToCurrentMonth();

    // Reset du mois
    document.getElementById('reset-data-btn').onclick = () => {
        if (confirm(`Réinitialiser les statuts de paiement pour ${currentMonth} ?`)) {
            monthlyStatus = {};
            saveMonthlyStatus();
            renderActiveProperty();
        }
    };

    // Fermeture modales
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
        };
    });

    // Modal Propriété
    document.getElementById('add-property-btn').onclick = () => {
        document.getElementById('modal-property-title').textContent = "Ajouter un bien";
        document.getElementById('prop-name').value = '';
        document.getElementById('prop-provision').value = '125';
        document.getElementById('modal-property').classList.add('show');
    };

    document.getElementById('save-property-btn').onclick = () => {
        const name = document.getElementById('prop-name').value;
        const provision = parseFloat(document.getElementById('prop-provision').value) || 0;
        if (!name) return alert('Le nom est requis');

        const newProp = {
            id: 'prop_' + Date.now(),
            name,
            provisionCharges: provision,
            tenants: [],
            fixedExpenses: [],
            variableExpenses: []
        };
        appState.properties.push(newProp);
        appState.activePropertyId = newProp.id;
        saveGlobalData();
        document.getElementById('modal-property').classList.remove('show');
        renderTabs();
        renderActiveProperty();
    };

    // Modal Locataire
    document.getElementById('add-tenant-btn').onclick = () => openTenantModal(null);

    document.getElementById('save-tenant-btn').onclick = () => {
        const prop = getActiveProperty();
        const id = document.getElementById('tenant-id').value;
        const name = document.getElementById('tenant-name').value;
        const rent = parseFloat(document.getElementById('tenant-rent').value) || 0;
        const day = parseInt(document.getElementById('tenant-day').value) || 1;
        const deposit = parseFloat(document.getElementById('tenant-deposit').value) || 0;

        if (!name) return alert('Nom requis');

        if (id) {
            const t = prop.tenants.find(x => x.id === id);
            t.name = name; t.rent = rent; t.paymentDay = day; t.deposit = deposit;
        } else {
            prop.tenants.push({
                id: 't_' + Date.now(),
                name, rent, paymentDay: day, deposit,
                history: []
            });
        }
        saveGlobalData();
        document.getElementById('modal-tenant').classList.remove('show');
        renderActiveProperty();
    };

    document.getElementById('delete-tenant-btn').onclick = () => {
        const id = document.getElementById('tenant-id').value;
        if (confirm("Supprimer ce locataire ?")) {
            const prop = getActiveProperty();
            prop.tenants = prop.tenants.filter(t => t.id !== id);
            saveGlobalData();
            document.getElementById('modal-tenant').classList.remove('show');
            renderActiveProperty();
        }
    };

    // Modal Garanties
    document.getElementById('save-guarantee-btn').onclick = () => {
        const prop = getActiveProperty();
        const id = document.getElementById('guarantee-tenant-id').value;
        const deposit = parseFloat(document.getElementById('guarantee-amount').value) || 0;
        const t = prop.tenants.find(x => x.id === id);
        if (t) t.deposit = deposit;
        saveGlobalData();
        document.getElementById('modal-guarantee').classList.remove('show');
        renderActiveProperty();
    };

    // Modal Dépenses (Fixes)
    document.getElementById('btn-edit-fixed-expenses').onclick = () => openExpensesModal('fixed');
    
    // Modal Dépenses (Variables)
    document.getElementById('btn-edit-variable-expenses').onclick = () => openExpensesModal('variable');
}

let currentExpenseType = 'fixed';

function openTenantModal(tenantId) {
    const prop = getActiveProperty();
    const isEdit = !!tenantId;
    document.getElementById('modal-tenant-title').textContent = isEdit ? "Modifier locataire" : "Ajouter locataire";
    document.getElementById('delete-tenant-btn').style.display = isEdit ? 'block' : 'none';

    if (isEdit) {
        const t = prop.tenants.find(x => x.id === tenantId);
        document.getElementById('tenant-id').value = t.id;
        document.getElementById('tenant-name').value = t.name;
        document.getElementById('tenant-rent').value = t.rent;
        document.getElementById('tenant-day').value = t.paymentDay;
        document.getElementById('tenant-deposit').value = t.deposit;
    } else {
        document.getElementById('tenant-id').value = '';
        document.getElementById('tenant-name').value = '';
        document.getElementById('tenant-rent').value = '';
        document.getElementById('tenant-day').value = '';
        document.getElementById('tenant-deposit').value = '';
    }
    document.getElementById('modal-tenant').classList.add('show');
}

function openGuaranteeModal(tenantId) {
    const prop = getActiveProperty();
    const t = prop.tenants.find(x => x.id === tenantId);
    document.getElementById('guarantee-tenant-id').value = t.id;
    document.getElementById('guarantee-amount').value = t.deposit;
    document.getElementById('modal-guarantee').classList.add('show');
}

function openExpensesModal(type) {
    currentExpenseType = type;
    document.getElementById('modal-expenses-title').textContent = type === 'fixed' ? 'Dépenses Fixes' : 'Dépenses Variables';
    renderExpensesList();
    document.getElementById('modal-expenses').classList.add('show');
}

function renderExpensesList() {
    const prop = getActiveProperty();
    const list = currentExpenseType === 'fixed' ? prop.fixedExpenses : prop.variableExpenses;
    const container = document.getElementById('expenses-list');
    container.innerHTML = '';

    list.forEach(exp => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.innerHTML = `
            <span class="expense-name">${exp.name}</span>
            <div>
                <span class="expense-amount">${exp.amount.toFixed(2).replace('.', ',')} €</span>
                <button class="btn-delete-icon" onclick="deleteExpense('${exp.id}')">&times;</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Réinitialiser les champs d'ajout
    document.getElementById('new-expense-name').value = '';
    document.getElementById('new-expense-amount').value = '';

    const addBtn = document.getElementById('add-expense-btn');
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);

    newBtn.onclick = () => {
        const name = document.getElementById('new-expense-name').value;
        const amount = parseFloat(document.getElementById('new-expense-amount').value) || 0;
        if (!name || amount <= 0) return;

        list.push({ id: 'exp_' + Date.now(), name, amount });
        saveGlobalData();
        renderExpensesList();
        renderActiveProperty();
    };
}

window.deleteExpense = function(id) {
    const prop = getActiveProperty();
    if (currentExpenseType === 'fixed') {
        prop.fixedExpenses = prop.fixedExpenses.filter(e => e.id !== id);
    } else {
        prop.variableExpenses = prop.variableExpenses.filter(e => e.id !== id);
    }
    saveGlobalData();
    renderExpensesList();
    renderActiveProperty();
};

window.deleteProperty = async function(id) {
    if (confirm("Voulez-vous vraiment supprimer ce bien et toutes ses données ?")) {
        if (currentUser) {
            const { error } = await supabase.from('properties').delete().eq('id', id);
            if (error) {
                console.error("Erreur suppression:", error);
                return alert("Erreur lors de la suppression.");
            }
        }
        
        appState.properties = appState.properties.filter(p => p.id !== id);
        if (appState.properties.length > 0) {
            appState.activePropertyId = appState.properties[0].id;
        } else {
            appState.activePropertyId = null;
        }
        saveGlobalData();
        renderTabs();
        
        if (appState.properties.length > 0) {
            renderActiveProperty();
        } else {
            document.getElementById('property-title').textContent = "Aucun bien";
            document.getElementById('locataires-container').innerHTML = '';
            document.getElementById('garanties-container').innerHTML = '';
            document.getElementById('kpi-revenus').textContent = '0 €';
            document.getElementById('kpi-depenses').textContent = '0 €';
            document.getElementById('kpi-depenses-var').textContent = '0 €';
            document.getElementById('kpi-cashflow').textContent = '0 €';
            document.getElementById('kpi-taux').textContent = '0 %';
            document.getElementById('kpi-progress').style.width = '0%';
        }
    }
};
