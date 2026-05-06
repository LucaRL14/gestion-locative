// --- Configuration & Données Initiales ---
const CHARGES_PROVISION = 125; // Provision pour charges par locataire
const DEPENSES_VARIABLES = 484.99; // Eau, elec, gaz, netflix, etc.
const FRAIS_ANNUELS_MENSUALISES = 171.26; // Assurances, taxes / 12

function getDepensesFixes(cleMois) {
    const [annee, mois] = cleMois.split('-').map(Number);
    let credit = 614;
    // À partir de septembre 2026, le crédit passe à 1010
    if (annee > 2026 || (annee === 2026 && mois >= 9)) {
        credit = 1010;
    }
    return FRAIS_ANNUELS_MENSUALISES + credit;
}

// Locataires fictifs
const LOCATAIRES_INITIAUX = [
    { id: '1', nom: 'Chambre 1 - Jules', loyer: 585, jourPaiement: 1, statut: 'pending' }, // pending, paid, unpaid
    { id: '2', nom: 'Chambre 2 - Thomas', loyer: 585, jourPaiement: 1, statut: 'pending' },
    { id: '3', nom: 'Chambre 3 - Maxime', loyer: 570, jourPaiement: 5, statut: 'pending' },
    { id: '4', nom: 'Chambre 4 - Sarah', loyer: 570, jourPaiement: 1, statut: 'pending' }

];

// --- Gestion de l'état (State) ---
let state = {
    moisActuel: '',
    cleMois: '', // Format YYYY-MM pour faciliter le tri
    locataires: []
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Déterminer le mois actuel (ex: "Mai 2026")
    const now = new Date();
    const optionsMois = { month: 'long', year: 'numeric' };
    const moisFormat = now.toLocaleDateString('fr-FR', optionsMois);
    // Majuscule sur la première lettre du mois
    state.moisActuel = moisFormat.charAt(0).toUpperCase() + moisFormat.slice(1);

    // Format YYYY-MM
    const moisNum = String(now.getMonth() + 1).padStart(2, '0');
    state.cleMois = `${now.getFullYear()}-${moisNum}`;

    document.getElementById('current-month-display').textContent = `Mois en cours : ${state.moisActuel}`;

    // Injecter l'historique initial si ce n'est pas déjà fait
    seedHistorique();

    // Charger les données du LocalStorage ou initialiser
    chargerDonnees();

    // Mettre en place les écouteurs d'événements
    document.getElementById('reset-data-btn').addEventListener('click', reinitialiserDonnees);

    // Premier rendu
    render();
}

// --- Fonctions Métier ---

function seedHistorique() {
    if (localStorage.getItem('seeded_v1_ransart')) return;

    const histData = {
        'gestion_loc_2026-02': [
            { id: '1', nom: 'Chambre 1 - Jules', loyer: 585, jourPaiement: 1, statut: 'paid' },
            { id: '2', nom: 'Chambre 2 - Thomas', loyer: 585, jourPaiement: 1, statut: 'paid' },
            { id: '3', nom: 'Chambre 3 - Maxime', loyer: 142.5, jourPaiement: 5, statut: 'paid' }
        ],
        'gestion_loc_2026-03': [
            { id: '1', nom: 'Chambre 1 - Jules', loyer: 585, jourPaiement: 1, statut: 'paid' },
            { id: '2', nom: 'Chambre 2 - Thomas', loyer: 585, jourPaiement: 1, statut: 'paid' },
            { id: '3', nom: 'Chambre 3 - Maxime', loyer: 570, jourPaiement: 5, statut: 'paid' },
            { id: '4', nom: 'Chambre 4 - Sarah', loyer: 427.5, jourPaiement: 1, statut: 'paid' }
        ],
        'gestion_loc_2026-04': [
            { id: '1', nom: 'Chambre 1 - Jules', loyer: 585, jourPaiement: 1, statut: 'paid' },
            { id: '2', nom: 'Chambre 2 - Thomas', loyer: 585, jourPaiement: 1, statut: 'paid' },
            { id: '3', nom: 'Chambre 3 - Maxime', loyer: 570, jourPaiement: 5, statut: 'paid' },
            { id: '4', nom: 'Chambre 4 - Sarah', loyer: 570, jourPaiement: 1, statut: 'paid' }
        ],
        'gestion_loc_2026-05': [
            { id: '1', nom: 'Chambre 1 - Jules', loyer: 585, jourPaiement: 1, statut: 'pending' },
            { id: '2', nom: 'Chambre 2 - Thomas', loyer: 585, jourPaiement: 1, statut: 'paid' },
            { id: '3', nom: 'Chambre 3 - Maxime', loyer: 570, jourPaiement: 5, statut: 'paid' },
            { id: '4', nom: 'Chambre 4 - Sarah', loyer: 570, jourPaiement: 1, statut: 'paid' }
        ]
    };

    for (let key in histData) {
        localStorage.setItem(key, JSON.stringify(histData[key]));
    }
    localStorage.setItem('seeded_v1_ransart', 'true');
}

function chargerDonnees() {
    const savedData = localStorage.getItem(`gestion_loc_${state.cleMois}`);

    if (savedData) {
        state.locataires = JSON.parse(savedData);
    } else {
        // Pas de données pour ce mois, on initialise avec les locataires par défaut
        // en remettant tout le monde en attente
        state.locataires = JSON.parse(JSON.stringify(LOCATAIRES_INITIAUX));
        sauvegarderDonnees();
    }
}

function sauvegarderDonnees() {
    localStorage.setItem(`gestion_loc_${state.cleMois}`, JSON.stringify(state.locataires));
}

function reinitialiserDonnees() {
    if (confirm('Voulez-vous vraiment réinitialiser les paiements pour ce mois-ci ?')) {
        state.locataires = JSON.parse(JSON.stringify(LOCATAIRES_INITIAUX));
        sauvegarderDonnees();
        render();
    }
}

function setStatut(id, nouveauStatut) {
    const locataire = state.locataires.find(l => l.id === id);
    if (locataire) {
        locataire.statut = nouveauStatut;
        sauvegarderDonnees();
        render(); // Re-render partiel ou total
    }
}

// --- Calculs KPI ---

function calculerKPI() {
    let revenusAttendus = 0;
    let revenusReels = 0;
    let locatairesPayes = 0;

    state.locataires.forEach(l => {
        revenusAttendus += l.loyer;
        if (l.statut === 'paid') {
            revenusReels += l.loyer;
            locatairesPayes++;
        }
    });

    const depensesFixes = getDepensesFixes(state.cleMois);
    const provisionsRecues = locatairesPayes * CHARGES_PROVISION;
    const loyersNets = revenusReels - provisionsRecues;
    
    // Cash flow = Loyers nets - Dépenses fixes mensuelles
    const cashFlow = loyersNets - depensesFixes;
    
    // Delta sur charges variables
    const deltaCharges = provisionsRecues - DEPENSES_VARIABLES;
    
    const tauxPaiement = state.locataires.length > 0
        ? Math.round((locatairesPayes / state.locataires.length) * 100)
        : 0;

    return { revenusAttendus, revenusReels, cashFlow, depensesFixes, deltaCharges, tauxPaiement };
}

function getHistorique(id) {
    let historique = [];
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        // On récupère toutes les clés qui commencent par gestion_loc_ mais qui ne sont pas le mois en cours
        // et on évite les anciennes clés (ex: gestion_loc_Mai 2026) en filtrant par le format
        if (key.startsWith('gestion_loc_2') && key !== `gestion_loc_${state.cleMois}`) {
            let monthKey = key.replace('gestion_loc_', ''); // e.g. 2026-04
            try {
                let data = JSON.parse(localStorage.getItem(key));
                let locataire = data.find(l => l.id === id);
                if (locataire) {
                    historique.push({
                        monthLabel: monthKey.split('-').reverse().join('/'), // 04/2026
                        monthKey: monthKey,
                        statut: locataire.statut
                    });
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }
    // Tri chronologique
    historique.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    // On garde uniquement les 4 derniers mois
    return historique.slice(-4);
}

// --- Rendu UI (Affichage) ---

function render() {
    const kpis = calculerKPI();

    // Rendu KPIs
    document.getElementById('kpi-revenus').textContent = `${kpis.revenusReels} €`;
    document.getElementById('kpi-revenus-attendu').textContent = `sur ${kpis.revenusAttendus} € attendus`;
    
    document.getElementById('kpi-depenses').textContent = `${kpis.depensesFixes.toFixed(2).replace('.', ',')} €`;
    if (document.getElementById('kpi-depenses-var')) {
        document.getElementById('kpi-depenses-var').textContent = `${DEPENSES_VARIABLES.toFixed(2).replace('.', ',')} €`;
    }

    // Cash Flow avec couleur dynamique
    const kpiCashFlow = document.getElementById('kpi-cashflow');
    const signeCf = kpis.cashFlow > 0 ? '+' : '';
    kpiCashFlow.textContent = `${signeCf}${kpis.cashFlow.toFixed(2).replace('.', ',')} €`;
    if (kpis.cashFlow > 0) {
        kpiCashFlow.style.color = 'var(--accent-success)';
    } else if (kpis.cashFlow < 0) {
        kpiCashFlow.style.color = 'var(--accent-danger)';
    } else {
        kpiCashFlow.style.color = 'var(--text-primary)';
    }

    // Delta Charges
    const kpiDelta = document.getElementById('kpi-delta-charges');
    if (kpiDelta) {
        const signeDelta = kpis.deltaCharges > 0 ? '+' : '';
        kpiDelta.textContent = `Delta charges: ${signeDelta}${kpis.deltaCharges.toFixed(2).replace('.', ',')} €`;
        if (kpis.deltaCharges > 0) {
            kpiDelta.style.color = 'var(--accent-success)';
        } else if (kpis.deltaCharges < 0) {
            kpiDelta.style.color = 'var(--accent-danger)';
        } else {
            kpiDelta.style.color = 'inherit';
        }
    }

    document.getElementById('kpi-taux').textContent = `${kpis.tauxPaiement} %`;
    document.getElementById('kpi-progress').style.width = `${kpis.tauxPaiement}%`;

    // Rendu Liste Locataires
    const container = document.getElementById('locataires-container');
    container.innerHTML = ''; // Clear

    state.locataires.forEach((locataire, index) => {
        // Déterminer les classes du badge et du texte
        let badgeClass = 'pending';
        let badgeText = '⏱️ En attente';

        if (locataire.statut === 'paid') {
            badgeClass = 'paid';
            badgeText = '✅ Payé';
        } else if (locataire.statut === 'unpaid') {
            badgeClass = 'unpaid';
            badgeText = '❌ Impayé / Retard';
        }

        const card = document.createElement('div');
        card.className = 'locataire-card';
        card.style.animationDelay = `${index * 0.1}s`;

        // Récupérer l'historique
        const histo = getHistorique(locataire.id);
        let historiqueHtml = '';
        if (histo.length > 0) {
            const dotsHtml = histo.map(h => `
                <div class="history-month" title="${h.monthLabel}">
                    <div class="history-dot ${h.statut}"></div>
                    <span>${h.monthLabel.substring(0, 2)}</span>
                </div>
            `).join('');

            historiqueHtml = `
                <div class="locataire-history">
                    <div class="history-title">Historique récent</div>
                    <div class="history-dots">
                        ${dotsHtml}
                    </div>
                </div>
            `;
        } else {
            historiqueHtml = `
                <div class="locataire-history">
                    <div class="history-title">Historique récent</div>
                    <div class="history-dots">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Pas d'historique</span>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="locataire-header">
                <div class="locataire-info">
                    <h3>${locataire.nom}</h3>
                    <div class="locataire-meta">
                        <span>📅 Attendu le ${locataire.jourPaiement} du mois</span>
                    </div>
                </div>
                <div class="locataire-amount">${locataire.loyer} €</div>
            </div>
            
            <div class="status-badge ${badgeClass}">
                ${badgeText}
            </div>

            <div class="locataire-actions">
                <button class="btn-action btn-success ${locataire.statut === 'paid' ? 'active' : ''}" 
                        onclick="setStatut('${locataire.id}', 'paid')">
                    ✅ Reçu
                </button>
                <button class="btn-action btn-danger ${locataire.statut === 'unpaid' ? 'active' : ''}" 
                        onclick="setStatut('${locataire.id}', 'unpaid')">
                    ❌ Non reçu
                </button>
            </div>
            
            ${historiqueHtml}
        `;

        container.appendChild(card);
    });
}
