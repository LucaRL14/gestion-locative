// --- Configuration & Données Initiales ---
const DEPENSES_FIXES = 900; // Exemple: Crédit 900€

// Locataires fictifs
const LOCATAIRES_INITIAUX = [
    { id: '1', nom: 'Alice Martin', loyer: 750, jourPaiement: 1, statut: 'pending' }, // pending, paid, unpaid
    { id: '2', nom: 'Bob Dupont', loyer: 680, jourPaiement: 1, statut: 'pending' },
    { id: '3', nom: 'Charlie Rousseau', loyer: 550, jourPaiement: 5, statut: 'pending' }
];

// --- Gestion de l'état (State) ---
let state = {
    moisActuel: '',
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
    
    document.getElementById('current-month-display').textContent = `Mois en cours : ${state.moisActuel}`;

    // Charger les données du LocalStorage ou initialiser
    chargerDonnees();
    
    // Mettre en place les écouteurs d'événements
    document.getElementById('reset-data-btn').addEventListener('click', reinitialiserDonnees);

    // Premier rendu
    render();
}

// --- Fonctions Métier ---

function chargerDonnees() {
    const savedData = localStorage.getItem(`gestion_loc_${state.moisActuel}`);
    
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
    localStorage.setItem(`gestion_loc_${state.moisActuel}`, JSON.stringify(state.locataires));
}

function reinitialiserDonnees() {
    if(confirm('Voulez-vous vraiment réinitialiser les paiements pour ce mois-ci ?')) {
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

    const cashFlow = revenusReels - DEPENSES_FIXES;
    const tauxPaiement = state.locataires.length > 0 
        ? Math.round((locatairesPayes / state.locataires.length) * 100) 
        : 0;

    return { revenusAttendus, revenusReels, cashFlow, tauxPaiement };
}

// --- Rendu UI (Affichage) ---

function render() {
    const kpis = calculerKPI();
    
    // Rendu KPIs
    document.getElementById('kpi-revenus').textContent = `${kpis.revenusReels} €`;
    document.getElementById('kpi-revenus-attendu').textContent = `sur ${kpis.revenusAttendus} € attendus`;
    
    // Cash Flow avec couleur dynamique
    const kpiCashFlow = document.getElementById('kpi-cashflow');
    const signe = kpis.cashFlow > 0 ? '+' : '';
    kpiCashFlow.textContent = `${signe}${kpis.cashFlow} €`;
    if (kpis.cashFlow > 0) {
        kpiCashFlow.style.color = 'var(--accent-success)';
    } else if (kpis.cashFlow < 0) {
        kpiCashFlow.style.color = 'var(--accent-danger)';
    } else {
        kpiCashFlow.style.color = 'var(--text-primary)';
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
        `;

        container.appendChild(card);
    });
}
