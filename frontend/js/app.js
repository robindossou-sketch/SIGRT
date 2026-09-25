
import {
    Collaborateurs,
    Talents,
    Evaluations,
    Formations,
    Retention,
    Utilisateurs,
    Audit,
    verifierAPI,
    synchroniserToutesLesDonnees
} from "./api.js";

/* =========================================================
   JOURNAL D'AUDIT SIGRT
========================================================= */

async function enregistrerAudit({
    utilisateur = "Système",
    role = "",
    action = "",
    module = "",
    cible = "",
    details = ""
} = {}) {

    const entree = {
        utilisateur,
        role,
        action,
        module,
        cible,
        details
    };

    try {

        if (
            typeof Audit !== "undefined" &&
            typeof Audit.ajouter === "function"
        ) {
            const resultat = await Audit.ajouter(entree);

            console.log(
                "SIGRT — action auditée :",
                action,
                module,
                cible
            );

            return resultat;
        }

        console.warn(
            "SIGRT — module Audit indisponible."
        );

    } catch (erreur) {

        console.warn(
            "SIGRT — impossible d'enregistrer l'audit :",
            erreur.message
        );
    }

    return null;
}

window.enregistrerAudit = enregistrerAudit;

const SIGRT = {
  collaborateurs: [
    {matricule:"COL-0001",name:"Exemple Collaborateur",birth:"",sex:"Non renseigné",phone:"",email:"",dept:"Ressources Humaines",post:"Assistant RH",contract:"CDI",hire:"2024-01-15",status:"Actif",manager:"Direction RH",skills:"Administration RH, Excel, reporting",potential:"À évaluer",notes:""},
  ],
  users: [
    {name:"Administrateur RH",login:"admin",role:"Administrateur RH",status:"Actif"},
    {name:"Gestionnaire RH",login:"rh.manager",role:"Gestionnaire RH",status:"Actif"},
    {name:"Manager",login:"manager",role:"Manager",status:"Actif"}
  ]
};const savedCollaborateurs = localStorage.getItem("sigrt_collaborateurs");

if (savedCollaborateurs) {
    SIGRT.collaborateurs = JSON.parse(savedCollaborateurs);
}
const savedUsers = localStorage.getItem("sigrt_users");

if (savedUsers) {
    SIGRT.users = JSON.parse(savedUsers);
}
const savedTalents = localStorage.getItem("sigrt_talents");

if (savedTalents) {
    SIGRT.talents = JSON.parse(savedTalents);
} else {
    SIGRT.talents = [];
}

const savedEvaluations = localStorage.getItem("sigrt_evaluations");

if (savedEvaluations) {
    SIGRT.evaluations = JSON.parse(savedEvaluations);
} else {
    SIGRT.evaluations = [];
}

const savedFormations = localStorage.getItem("sigrt_formations");

if (savedFormations) {
    SIGRT.formations = JSON.parse(savedFormations);
} else {
    SIGRT.formations = [];
}

const savedRetention = localStorage.getItem("sigrt_retention");

if (savedRetention) {
    SIGRT.retention = JSON.parse(savedRetention);
} else {
    SIGRT.retention = [];
}

function saveTalents(){
    Talents.enregistrer(SIGRT.talents);

    enregistrerAudit({
        action: "Création",
        module: "Talents",
        cible: "",
        details: "Talent enregistré ou mis à jour dans le référentiel."
    });

}
async function saveCollaborateur(){

    const required = [
        "cMatricule",
        "cName",
        "cDept",
        "cPost",
        "cContract",
        "cHire"
    ];

    if(required.some(id =>
        !document.getElementById(id).value.trim()
    )){
        alert(
            "Veuillez renseigner le matricule, le nom, le département, le poste, le contrat et la date d'embauche."
        );
        return;
    }

    const matricule = document.getElementById("cMatricule").value.trim();
    const email = document.getElementById("cEmail").value.trim();

    const i = Number(
        document.getElementById("editCollabIndex").value
    );

    const conflitIndex =
        findCollabIndexByMatricule(matricule);

    if(conflitIndex >= 0 && conflitIndex !== i){

        alert(
            "Ce matricule est déjà utilisé par un autre collaborateur."
        );

        return;
    }

    if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){

        alert("L'adresse email n'est pas valide.");

        return;
    }

    const c = {

        matricule: matricule,

        name: document.getElementById("cName").value.trim(),

        birth: document.getElementById("cBirth").value,

        sex: document.getElementById("cSex").value,

        phone: document.getElementById("cPhone").value.trim(),

        email: email,

        dept: document.getElementById("cDept").value,

        post: document.getElementById("cPost").value.trim(),

        contract: document.getElementById("cContract").value,

        hire: document.getElementById("cHire").value,

        status: document.getElementById("cStatus").value,

        manager: document.getElementById("cManager").value.trim(),

        skills: document.getElementById("cSkills").value.trim(),

        potential: document.getElementById("cPotential").value,

        notes: document.getElementById("cNotes").value.trim()
    };

      try{

        if(i < 0){

            await Collaborateurs.creer(c);

        }else{

            const ancienMatricule =
                SIGRT.collaborateurs[i].matricule;

            await Collaborateurs.modifier(
                ancienMatricule,
                c
            );
        }

        SIGRT.collaborateurs =
            await Collaborateurs.lister();

            await enregistrerAudit({
                action: "Modification",
                module: "Collaborateurs",
                cible: c.matricule || "",
                details: "Fiche collaborateur enregistrée."
            });

    }catch(erreur){

        alert(erreur.message);

        return;
    }

    closeCollabForm();

    renderCollaborateurs();
}

function renderCollaborateurs(){
    const q = (document.getElementById("collabSearch")?.value || "").toLowerCase();
    const dept = document.getElementById("collabDept")?.value || "";

    const rows = SIGRT.collaborateurs.filter(c =>
        (!dept || c.dept === dept) &&
        (c.matricule + " " + c.name + " " + c.post + " " + c.dept)
            .toLowerCase()
            .includes(q)
    );

    const counter = document.getElementById("collabCount");

    if(counter){
        counter.textContent = SIGRT.collaborateurs.length;
    }

    const tbody = document.getElementById("collabTable");

    if(!tbody) return;

    tbody.innerHTML = rows.map(c => {

        return `
        <tr>
            <td>${escapeHtml(c.matricule)}</td>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.dept)}</td>
            <td>${escapeHtml(c.post)}</td>
            <td>${escapeHtml(c.contract)}</td>
            <td>
                <span class="badge">${escapeHtml(c.status)}</span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn secondary"
                        onclick="viewCollaborateur('${c.matricule}')">
                        Voir
                    </button>

                    <button class="btn secondary"
                        onclick="editCollaborateur('${c.matricule}')">
                        Modifier
                    </button>

                    <button class="btn secondary"
                        onclick="deleteCollaborateur('${c.matricule}')">
                        Supprimer
                    </button>
                </div>
            </td>
        </tr>`;
    }).join("");
}

function closeCollabForm(){document.getElementById("collabForm").style.display="none";}

function findCollabIndexByMatricule(matricule){
    return SIGRT.collaborateurs.findIndex(
        c => c.matricule === matricule
    );
}
function viewCollaborateur(matricule){

    const i = findCollabIndexByMatricule(matricule);

    if(i < 0) return;

    const c = SIGRT.collaborateurs[i];

    document.getElementById("collabDetail").style.display = "block";

    document.getElementById("detailContent").innerHTML = `
        <div class="formgrid">

            <div>
                <strong>Matricule</strong><br>
                ${escapeHtml(c.matricule)}
            </div>

            <div>
                <strong>Nom</strong><br>
                ${escapeHtml(c.name)}
            </div>

            <div>
                <strong>Département</strong><br>
                ${escapeHtml(c.dept)}
            </div>

            <div>
                <strong>Poste</strong><br>
                ${escapeHtml(c.post)}
            </div>

            <div>
                <strong>Contrat</strong><br>
                ${escapeHtml(c.contract)}
            </div>

            <div>
                <strong>Date d'embauche</strong><br>
                ${escapeHtml(c.hire)}
            </div>

            <div>
                <strong>Statut</strong><br>
                ${escapeHtml(c.status)}
            </div>

            <div>
                <strong>Manager</strong><br>
                ${escapeHtml(c.manager || "—")}
            </div>

            <div>
                <strong>Téléphone</strong><br>
                ${escapeHtml(c.phone || "—")}
            </div>

            <div>
                <strong>Email</strong><br>
                ${escapeHtml(c.email || "—")}
            </div>

            <div>
                <strong>Compétences</strong><br>
                ${escapeHtml(c.skills || "—")}
            </div>

            <div>
                <strong>Potentiel</strong><br>
                ${escapeHtml(c.potential)}
            </div>

        </div>

        <div class="panel">
            <strong>Observations</strong>
            <p>${escapeHtml(c.notes || "Aucune observation.")}</p>
        </div>
    `;
}
function editCollaborateur(matricule){

    const i = findCollabIndexByMatricule(matricule);

    if(i < 0) return;

    openCollabForm(i);
}


async function deleteCollaborateur(matricule){

    const i = findCollabIndexByMatricule(matricule);

    if(i < 0) return;

    if(confirm("Supprimer définitivement ce collaborateur du prototype ?")){

        try {

            await Collaborateurs.supprimer(matricule);

            SIGRT.collaborateurs =
                await Collaborateurs.lister();

            renderCollaborateurs();

            document.getElementById("collabDetail").style.display = "none";

        }catch(erreur){

            alert(erreur.message);

            return;
        }
    }
}
function saveCollaborateurs(){
    Collaborateurs.enregistrer(SIGRT.collaborateurs);
}

function openCollabForm(index = -1){

    const form = document.getElementById("collabForm");

    if(!form) return;

    document.getElementById("editCollabIndex").value = index;

    if(index >= 0){

        const c = SIGRT.collaborateurs[index];

        document.getElementById("collabFormTitle").textContent =
            "Modifier le collaborateur";

        document.getElementById("cMatricule").value = c.matricule || "";
        document.getElementById("cName").value = c.name || "";
        document.getElementById("cBirth").value = c.birth || "";
        document.getElementById("cSex").value = c.sex || "Non renseigné";
        document.getElementById("cPhone").value = c.phone || "";
        document.getElementById("cEmail").value = c.email || "";
        document.getElementById("cDept").value = c.dept || "Ressources Humaines";
        document.getElementById("cPost").value = c.post || "";
        document.getElementById("cContract").value = c.contract || "CDI";
        document.getElementById("cHire").value = c.hire || "";
        document.getElementById("cStatus").value = c.status || "Actif";
        document.getElementById("cManager").value = c.manager || "";
        document.getElementById("cSkills").value = c.skills || "";
        document.getElementById("cPotential").value = c.potential || "À évaluer";
        document.getElementById("cNotes").value = c.notes || "";

    }else{

        document.getElementById("collabFormTitle").textContent =
            "Nouveau collaborateur";

        document.getElementById("editCollabIndex").value = "-1";

        document.getElementById("cMatricule").value = "";
        document.getElementById("cName").value = "";
        document.getElementById("cBirth").value = "";
        document.getElementById("cSex").value = "Non renseigné";
        document.getElementById("cPhone").value = "";
        document.getElementById("cEmail").value = "";
        document.getElementById("cDept").value = "Ressources Humaines";
        document.getElementById("cPost").value = "";
        document.getElementById("cContract").value = "CDI";
        document.getElementById("cHire").value = "";
        document.getElementById("cStatus").value = "Actif";
        document.getElementById("cManager").value = "";
        document.getElementById("cSkills").value = "";
        document.getElementById("cPotential").value = "À évaluer";
        document.getElementById("cNotes").value = "";
    }

    form.style.display = "block";

    document.getElementById("cMatricule").focus();
}
function renderTalents(){

    const search =
        (document.getElementById("talentSearch")?.value || "")
        .toLowerCase();

    const potentiel =
        document.getElementById("talentPotentiel")?.value || "";

    const table =
        document.getElementById("talentTable");

    if(!table) return;

    const talents = SIGRT.talents.filter(t => {

        const collaborateur =
            SIGRT.collaborateurs.find(
                c => c.matricule === t.matricule
            );

        if(!collaborateur) return false;

        const matchSearch =
            collaborateur.name.toLowerCase().includes(search) ||
            collaborateur.matricule.toLowerCase().includes(search);

        const matchPotentiel =
            !potentiel || t.potentiel === potentiel;

        return matchSearch && matchPotentiel;
    });

     const evaluations =
        Evaluations.lister();

    table.innerHTML = talents.map(t => {

        const c =
            SIGRT.collaborateurs.find(
                x => x.matricule === t.matricule
            );

        const historique =
            evaluations
                .filter(e => e.matricule === t.matricule)
                .sort(
                    (a, b) =>
                        new Date(a.date) - new Date(b.date)
                );

        const derniere =
            historique.length
                ? Number(historique[historique.length - 1].score)
                : null;

        const premiere =
            historique.length
                ? Number(historique[0].score)
                : null;

        let ecart = null;
        let tendance = "Non évalué";

        if(historique.length > 1){

            ecart =
                derniere - premiere;

            if(ecart > 0){
                tendance = "En progression";
            }else if(ecart < 0){
                tendance = "En baisse";
            }else{
                tendance = "Stable";
            }
        }else if(historique.length === 1){
            tendance = "Première évaluation";
        }

        const scoreText =
            derniere !== null
                ? derniere.toFixed(2) + "/5"
                : "Non évalué";

        const ecartText =
            ecart !== null
                ? (ecart > 0 ? "+" : "") +
                  ecart.toFixed(2) + " pt"
                : "—";

        return `
        <tr>
            <td>${escapeHtml(c?.name || "")}</td>

            <td>${escapeHtml(c?.post || "")}</td>

            <td>${escapeHtml(t.potentiel || "")}</td>

            <td>
                <strong>${scoreText}</strong>
            </td>

            <td>${ecartText}</td>

            <td>
                <span class="badge">
                    ${escapeHtml(tendance)}
                </span>
            </td>

            <td>${escapeHtml(t.posteCible || "À définir")}</td>

            <td>
                <span class="badge">
                    ${escapeHtml(t.statut || "À développer")}
                </span>
            </td>

            <td>
                <button class="btn secondary"
                    onclick="editTalent('${t.matricule}')">
                    Modifier
                </button>
            </td>
        </tr>
        `;
    }).join("");

    if(!talents.length){
        table.innerHTML = `
        <tr>
            <td colspan="9" style="text-align:center;padding:20px">
                Aucun talent enregistré.
            </td>
        </tr>
        `;
    }
}
function openTalentForm(matricule = ""){

    let form = document.getElementById("talentForm");

    if(!form){
        form = document.createElement("div");
        form.className = "panel";
        form.id = "talentForm";
        form.style.marginTop = "18px";

        form.innerHTML = `
            <h3 id="talentFormTitle">Ajouter un talent</h3>

            <div class="formgrid">

                <label>
                    Collaborateur
                    <select id="talentCollaborateur">
                        <option value="">Sélectionner un collaborateur</option>
                        ${SIGRT.collaborateurs.map(c => `
                            <option value="${escapeHtml(c.matricule)}">
                                ${escapeHtml(c.name)} — ${escapeHtml(c.matricule)}
                            </option>
                        `).join("")}
                    </select>
                </label>

                <label>
                    Potentiel
                    <select id="talentPotentielForm">
                        <option value="">Sélectionner</option>
                        <option>Potentiel élevé</option>
                        <option>Potentiel moyen</option>
                        <option>Potentiel à développer</option>
                    </select>
                </label>

                <label>
                    Poste cible
                    <input id="talentPosteCible"
                           placeholder="Ex. Responsable RH">
                </label>

                <label>
                    Statut
                    <select id="talentStatut">
                        <option>À développer</option>
                        <option>En développement</option>
                        <option>Prêt pour évolution</option>
                        <option>Promu</option>
                    </select>
                </label>

            </div>

            <label style="display:block;margin-top:14px">
                Observations
                <textarea id="talentNotes"
                    rows="4"
                    style="width:100%;margin-top:6px;padding:10px;border:1px solid #d1d5db;border-radius:7px"
                    placeholder="Observations, compétences à développer, projet professionnel..."></textarea>
            </label>

            <div class="actions" style="margin-top:15px">
                <button class="btn" onclick="saveTalent()">
                    Enregistrer
                </button>

                <button class="btn secondary" onclick="closeTalentForm()">
                    Annuler
                </button>
            </div>
        `;

        document.querySelector("#talents .panel").after(form);
    }

    form.style.display = "block";

    const select = document.getElementById("talentCollaborateur");

    if(matricule){
        select.value = matricule;
    }else{
        select.value = "";
    }

    document.getElementById("talentPotentielForm").value = "";
    document.getElementById("talentPosteCible").value = "";
    document.getElementById("talentStatut").value = "À développer";
    document.getElementById("talentNotes").value = "";

    document.getElementById("talentFormTitle").textContent =
        matricule ? "Modifier le talent" : "Ajouter un talent";
}


function closeTalentForm(){

    const form = document.getElementById("talentForm");

    if(form){
        form.style.display = "none";
    }
}


function saveTalent(){

    const matricule =
        document.getElementById("talentCollaborateur").value;

    const potentiel =
        document.getElementById("talentPotentielForm").value;

    const posteCible =
        document.getElementById("talentPosteCible").value.trim();

    const statut =
        document.getElementById("talentStatut").value;

    const notes =
        document.getElementById("talentNotes").value.trim();

    if(!matricule){
        alert("Veuillez sélectionner un collaborateur.");
        return;
    }

    if(!potentiel){
        alert("Veuillez sélectionner le potentiel du collaborateur.");
        return;
    }

    const existant =
        SIGRT.talents.findIndex(
            t => t.matricule === matricule
        );

    const talent = {
        matricule: matricule,
        potentiel: potentiel,
        posteCible: posteCible,
        statut: statut,
        notes: notes
    };

    if(existant >= 0){

        SIGRT.talents[existant] = talent;

    }else{

        SIGRT.talents.push(talent);

    }

    saveTalents();

    closeTalentForm();

    renderTalents();

    alert("Talent enregistré avec succès.");
}


function editTalent(matricule){

    const talent =
        SIGRT.talents.find(
            t => t.matricule === matricule
        );

    if(!talent){
        alert("Talent introuvable.");
        return;
    }

    openTalentForm(matricule);

    document.getElementById("talentPotentielForm").value =
        talent.potentiel || "";

    document.getElementById("talentPosteCible").value =
        talent.posteCible || "";

    document.getElementById("talentStatut").value =
        talent.statut || "À développer";

    document.getElementById("talentNotes").value =
        talent.notes || "";
}


function deleteTalent(matricule){

    const index =
        SIGRT.talents.findIndex(
            t => t.matricule === matricule
        );

    if(index < 0){
        alert("Talent introuvable.");
        return;
    }

    const collaborateur =
        SIGRT.collaborateurs.find(
            c => c.matricule === matricule
        );

    const nom =
        collaborateur?.name || matricule;

    if(!confirm(
        `Voulez-vous retirer ${nom} du référentiel des talents ?`
    )){
        return;
    }

    SIGRT.talents.splice(index, 1);

    saveTalents();

    renderTalents();
}
function renderApp(){
document.getElementById("app").innerHTML = `
<div class="login" id="loginScreen">
  <div class="loginbox">
    <div class="logo">SIGRT</div>
    <div class="muted">Système Intégré de Gestion des Ressources et des Talents</div>
    <h2>Connexion</h2>
    <label>Identifiant<input id="loginUser" value="admin"></label>
    <label style="display:block;margin-top:12px">Mot de passe<input id="loginPass" type="password" value="sigrt123"></label>
    <button class="btn" onclick="login()">Se connecter</button>
    <div class="error" id="loginError">Identifiants incorrects.</div>
    <p class="muted" style="font-size:12px;margin-top:14px">Prototype : admin / sigrt123</p>
  </div>
</div>
<div class="app">
<aside class="sidebar">
  <div class="logo">SIGRT</div><div class="subtitle">RH • Talents • Performance</div>
  <div class="nav">
    <button class="active" onclick="showPage('dashboard',this)">Tableau de bord</button>
    <button onclick="showPage('users',this)">Utilisateurs & rôles</button>
    <button onclick="showPage('collaborateurs',this)">Collaborateurs</button>
    <button onclick="showPage('performance',this)">Performance</button>
    <button onclick="showPage('talents',this)">Talents</button>
    <button onclick="showPage('formation',this)">Formation</button>
    <button onclick="showPage('retention',this)">Rétention / Fidélisation</button>
    <button onclick="showPage('kpi',this)">KPI / Reporting</button>
    <button onclick="showPage('decision',this)">Aide à la décision RH</button>
    <button onclick="showPage('settings',this)">Paramètres du système</button>
    <button onclick="showPage('audit',this)">Journal d’audit</button>
  </div>
</aside>
<main class="main">
<header class="topbar"><strong id="pageTitle">Tableau de bord</strong>
<div class="user">Connecté : <strong>Administrateur RH</strong> <button class="btn secondary" onclick="logout()">Déconnexion</button></div></header>
<section class="content">
<div class="page active" id="dashboard">

<h1>Tableau de bord RH</h1>
<div class="muted">Vue synthétique des principaux indicateurs du SIGRT.</div>

<div class="cards">

<div class="card">
<div class="muted">Effectif total</div>
<div class="value" id="dashEffectif">0</div>
</div>

<div class="card">
<div class="muted">Utilisateurs</div>
<div class="value" id="dashUsers">0</div>
</div>

<div class="card">
<div class="muted">Talents identifiés</div>
<div class="value" id="dashTalents">0</div>
</div>

<div class="card">
<div class="muted">Évaluations</div>
<div class="value" id="dashEvaluations">0</div>
</div>

<div class="card">
<div class="muted">Formations</div>
<div class="value" id="dashFormations">0</div>
</div>

<div class="card">
<div class="muted">Suivis de rétention</div>
<div class="value" id="dashRetention">0</div>
</div>

</div>

<div class="panel" style="margin-top:20px">

<h3>KPI RH</h3>

<div class="cards">

<div class="card">
<div class="muted">Taux d'activité</div>
<div class="value" id="dashActivityRate">0%</div>
</div>

<div class="card">
<div class="muted">Collaborateurs en CDI</div>
<div class="value" id="dashCDI">0</div>
</div>

<div class="card">
<div class="muted">CDD / autres contrats</div>
<div class="value" id="dashOtherContracts">0</div>
</div>

<div class="card">
<div class="muted">Potentiel à évaluer</div>
<div class="value" id="dashPotential">0</div>
</div>

</div>

</div>

<div class="panel" style="margin-top:20px">

<h3>Alertes RH</h3>

<div id="dashboardAlerts">
<div class="muted">Aucune alerte RH.</div>
</div>

</div>

<div class="panel" style="margin-top:20px">

<h3>Répartition des collaborateurs par département</h3>

<div id="dashboardDepartments" class="cards">
<div class="muted">Aucune donnée disponible.</div>
</div>

</div>

<div class="panel" style="margin-top:20px">

<h3>Répartition des collaborateurs par statut</h3>

<div id="dashboardStatuses" class="cards">
<div class="muted">Aucune donnée disponible.</div>
</div>

</div>

</div>
<div class="page" id="users"><h1>Utilisateurs & rôles</h1>
<div class="muted">Gestion du contrôle d'accès au SIGRT.</div>
<div class="panel"><div class="actions">
<input class="search" id="userSearch" placeholder="Rechercher..." oninput="renderUsers()">
<button class="btn" onclick="openUserForm()">+ Ajouter un utilisateur</button></div>
<table style="margin-top:18px"><thead><tr><th>Nom</th><th>Identifiant</th><th>Rôle</th><th>Statut</th><th>Action</th></tr></thead>
<tbody id="userTable"></tbody></table></div>
<div class="panel" id="userForm" style="display:none"><h3>Créer un utilisateur</h3>
<div class="formgrid"><label>Nom<input id="newName"></label><label>Identifiant<input id="newLogin"></label>
<label>Rôle<select id="newRole"><option>Administrateur RH</option><option>Gestionnaire RH</option><option>Manager</option></select></label>
<label>Statut<select id="newStatus"><option>Actif</option><option>Inactif</option></select></label></div>
<div class="actions" style="margin-top:15px"><button class="btn" onclick="addUser()">Enregistrer</button><button class="btn secondary" onclick="closeUserForm()">Annuler</button></div>
</div></div>


<div class="page" id="collaborateurs">
<h1>Gestion des collaborateurs</h1>
<div class="muted">Référentiel central des collaborateurs du SIGRT.</div>
<div class="panel">
<div class="actions">
<input class="search" id="collabSearch" placeholder="Rechercher nom, matricule, poste..." oninput="renderCollaborateurs()">
<select id="collabDept" style="max-width:190px" onchange="renderCollaborateurs()">
<option value="">Tous les départements</option><option>Ressources Humaines</option><option>Housekeeping</option><option>Finance</option><option>Commercial</option><option>Direction</option>
</select>
<button class="btn" onclick="openCollabForm()">+ Ajouter un collaborateur</button>
</div>
<table style="margin-top:18px"><thead><tr><th>Matricule</th><th>Nom complet</th><th>Département</th><th>Poste</th><th>Contrat</th><th>Statut</th><th>Action</th></tr></thead>
<tbody id="collabTable"></tbody></table>
</div>

<div class="panel" id="collabForm" style="display:none">
<h3 id="collabFormTitle">Nouveau collaborateur</h3>
<input type="hidden" id="editCollabIndex" value="-1">
<div class="formgrid">
<label>Matricule<input id="cMatricule" placeholder="COL-0001"></label>
<label>Nom complet<input id="cName"></label>
<label>Date de naissance<input id="cBirth" type="date"></label>
<label>Sexe<select id="cSex"><option>Non renseigné</option><option>Femme</option><option>Homme</option></select></label>
<label>Téléphone<input id="cPhone"></label>
<label>Email<input id="cEmail" type="email"></label>
<label>Département<select id="cDept"><option>Ressources Humaines</option><option>Housekeeping</option><option>Finance</option><option>Commercial</option><option>Direction</option></select></label>
<label>Poste<input id="cPost"></label>
<label>Type de contrat<select id="cContract"><option>CDI</option><option>CDD</option><option>Stage</option><option>Consultant</option></select></label>
<label>Date d'embauche<input id="cHire" type="date"></label>
<label>Statut<select id="cStatus"><option>Actif</option><option>Inactif</option><option>En congé</option></select></label>
<label>Manager<input id="cManager"></label>
<label>Compétences clés<input id="cSkills" placeholder="Excel, recrutement, reporting..."></label>
<label>Niveau / potentiel<select id="cPotential"><option>À évaluer</option><option>Potentiel élevé</option><option>Potentiel moyen</option><option>Potentiel à développer</option></select></label>
</div>
<label style="display:block;margin-top:14px">Observations<textarea id="cNotes" rows="4" style="width:100%;margin-top:6px;padding:10px;border:1px solid #d1d5db;border-radius:7px"></textarea></label>
<div class="actions" style="margin-top:15px"><button class="btn" onclick="saveCollaborateur()">Enregistrer</button><button class="btn secondary" onclick="closeCollabForm()">Annuler</button></div>
</div>

<div class="panel" id="collabDetail" style="display:none">
<h3>Fiche collaborateur</h3>
<div id="detailContent"></div>
</div>

</div>

<div class="page" id="performance">
<h1>Gestion de la performance</h1>
<div class="muted">Suivi et évaluation de la performance des collaborateurs.</div>

<div class="panel">
<h3>Évaluations des collaborateurs</h3>

<div class="actions">
<select id="performanceCollaborateur" style="max-width:260px">
<option value="">Sélectionner un collaborateur</option>
</select>

<select id="performancePeriode" style="max-width:180px">
<option value="">Période</option>
<option>2026 - S1</option>
<option>2026 - S2</option>
</select>

<button class="btn" onclick="openPerformanceForm()">+ Nouvelle évaluation</button>
</div>

<table style="margin-top:18px">
<thead>
<tr>
<th>Collaborateur</th>
<th>Période</th>
<th>Score</th>
<th>Statut</th>
<th>Action</th>
</tr>
</thead>

<tbody id="performanceTable"></tbody>
</table>
</div>
<div class="panel" id="performanceForm" style="display:none">
<h3 id="performanceFormTitle">Nouvelle évaluation</h3>

<div class="formgrid">

<label>
Collaborateur
<select id="evalCollaborateur"></select>
</label>

<label>
Période
<select id="evalPeriode">
<option value="">Sélectionner</option>
<option>2026 - S1</option>
<option>2026 - S2</option>
</select>
</label>

<label>
Qualité du travail
<select id="evalQualite">
<option value="">Sélectionner</option>
<option value="1">1 - Insuffisant</option>
<option value="2">2 - À améliorer</option>
<option value="3">3 - Satisfaisant</option>
<option value="4">4 - Très satisfaisant</option>
<option value="5">5 - Excellent</option>
</select>
</label>

<label>
Productivité
<select id="evalProductivite">
<option value="">Sélectionner</option>
<option value="1">1 - Insuffisant</option>
<option value="2">2 - À améliorer</option>
<option value="3">3 - Satisfaisant</option>
<option value="4">4 - Très satisfaisant</option>
<option value="5">5 - Excellent</option>
</select>
</label>

<label>
Respect des procédures
<select id="evalProcedures">
<option value="">Sélectionner</option>
<option value="1">1 - Insuffisant</option>
<option value="2">2 - À améliorer</option>
<option value="3">3 - Satisfaisant</option>
<option value="4">4 - Très satisfaisant</option>
<option value="5">5 - Excellent</option>
</select>
</label>

<label>
Comportement professionnel
<select id="evalComportement">
<option value="">Sélectionner</option>
<option value="1">1 - Insuffisant</option>
<option value="2">2 - À améliorer</option>
<option value="3">3 - Satisfaisant</option>
<option value="4">4 - Très satisfaisant</option>
<option value="5">5 - Excellent</option>
</select>
</label>

<label>
Compétences
<select id="evalCompetences">
<option value="">Sélectionner</option>
<option value="1">1 - Insuffisant</option>
<option value="2">2 - À améliorer</option>
<option value="3">3 - Satisfaisant</option>
<option value="4">4 - Très satisfaisant</option>
<option value="5">5 - Excellent</option>
</select>
</label>

<label>
Potentiel d'évolution
<select id="evalPotentiel">
<option value="">Sélectionner</option>
<option>Faible</option>
<option>Moyen</option>
<option>Élevé</option>
</select>
</label>

</div>

<label style="display:block;margin-top:14px">
Commentaire du manager
<textarea id="evalCommentaire"
rows="4"
style="width:100%;margin-top:6px;padding:10px;border:1px solid #d1d5db;border-radius:7px">
</textarea>
</label>

<div class="actions" style="margin-top:15px">

<button class="btn" onclick="savePerformance()">
Enregistrer
</button>

<button class="btn secondary" onclick="closePerformanceForm()">
Annuler
</button>

</div>

</div>
</div>
<div class="page" id="talents">
<h1>Gestion des talents</h1>
<div class="muted">Identification, suivi et développement des talents du SIGRT.</div>

<div class="panel">
<h3>Référentiel des talents</h3>

<div class="actions">
<input class="search" id="talentSearch" placeholder="Rechercher un collaborateur...">
<select id="talentPotentiel" style="max-width:200px">
<option value="">Tous les potentiels</option>
<option>Potentiel élevé</option>
<option>Potentiel moyen</option>
<option>Potentiel à développer</option>
</select>
<button class="btn" onclick="openTalentForm()">+ Ajouter un talent</button>
</div>

<table style="margin-top:18px">
<thead>
<tr>
<th>Collaborateur</th>
<th>Poste actuel</th>
<th>Potentiel</th>
<th>Dernier score</th>
<th>Écart</th>
<th>Tendance</th>
<th>Poste cible</th>
<th>Statut</th>
<th>Action</th>
</tr>
</thead>
<tbody id="talentTable"></tbody>
</table>
</div>
</div>
<div class="page" id="formation">
<h1>Gestion de la formation</h1>
<div class="muted">
Planification, suivi et évaluation des actions de formation.
</div>

<div class="panel">

<h3>Suivi des formations</h3>

<div class="actions">

<select id="formationCollaborateur" style="max-width:260px">
<option value="">Tous les collaborateurs</option>
</select>

<select id="formationStatut" style="max-width:200px">
<option value="">Tous les statuts</option>
<option>Planifiée</option>
<option>En cours</option>
<option>Réalisée</option>
<option>Annulée</option>
</select>

<button class="btn" onclick="openFormationForm()">
+ Nouvelle formation
</button>

</div>

<table style="margin-top:18px">

<thead>
<tr>
<th>Collaborateur</th>
<th>Formation</th>
<th>Organisme</th>
<th>Date</th>
<th>Durée</th>
<th>Coût</th>
<th>Statut</th>
<th>Action</th>
</tr>
</thead>

<tbody id="formationTable"></tbody>

</table>

</div>

<div class="panel" id="formationForm" style="display:none">

<h3 id="formationFormTitle">
Nouvelle formation
</h3>

<div class="formgrid">

<label>
Collaborateur
<select id="formCollab"></select>
</label>

<label>
Intitulé de la formation
<input id="formTitre">
</label>

<label>
Organisme de formation
<input id="formOrganisme">
</label>

<label>
Date
<input id="formDate" type="date">
</label>

<label>
Durée (heures)
<input id="formDuree" type="number" min="1">
</label>

<label>
Coût
<input id="formCout" type="number" min="0" step="0.01">
</label>

<label>
Statut
<select id="formStatut">
<option>Planifiée</option>
<option>En cours</option>
<option>Réalisée</option>
<option>Annulée</option>
</select>
</label>

<label>
Évaluation
<select id="formEvaluation">
<option value="">Non évaluée</option>
<option>Insatisfaisante</option>
<option>Satisfaisante</option>
<option>Très satisfaisante</option>
<option>Excellente</option>
</select>
</label>

</div>

<label style="display:block;margin-top:14px">
Observations
<textarea
id="formNotes"
rows="4"
style="width:100%;margin-top:6px;padding:10px;border:1px solid #d1d5db;border-radius:7px">
</textarea>
</label>

<div class="actions" style="margin-top:15px">

<button class="btn" onclick="saveFormation()">
Enregistrer
</button>

<button
class="btn secondary"
onclick="closeFormationForm()">
Annuler
</button>

</div>

</div>

</div>
<div class="page" id="retention">
<h1>Rétention / Fidélisation</h1>
<div class="muted">Suivi des risques de départ et des actions de fidélisation des collaborateurs.</div>

<div class="panel">
<h3>Suivi de la fidélisation</h3>

<div class="actions">
<input class="search" id="retentionSearch"
placeholder="Rechercher un collaborateur..."
oninput="renderRetention()">

<select id="retentionRisque"
style="max-width:200px"
onchange="renderRetention()">
<option value="">Tous les niveaux de risque</option>
<option>Faible</option>
<option>Moyen</option>
<option>Élevé</option>
</select>

<button class="btn" onclick="openRetentionForm()">
+ Nouveau suivi
</button>
</div>

<table style="margin-top:18px">
<thead>
<tr>
<th>Collaborateur</th>
<th>Ancienneté</th>
<th>Risque de départ</th>
<th>Motif potentiel</th>
<th>Dernier entretien</th>
<th>Action de rétention</th>
<th>Statut</th>
<th>Action</th>
</tr>
</thead>

<tbody id="retentionTable"></tbody>
</table>
</div>

<div class="panel" id="retentionForm" style="display:none">

<h3 id="retentionFormTitle">Nouveau suivi de fidélisation</h3>

<div class="formgrid">

<label>
Collaborateur
<select id="retentionCollaborateur"></select>
</label>

<label>
Risque de départ
<select id="retentionRisqueForm">
<option value="">Sélectionner</option>
<option>Faible</option>
<option>Moyen</option>
<option>Élevé</option>
</select>
</label>

<label>
Motif potentiel de départ
<select id="retentionMotif">
<option value="">Sélectionner</option>
<option>Rémunération</option>
<option>Évolution de carrière</option>
<option>Conditions de travail</option>
<option>Management</option>
<option>Charge de travail</option>
<option>Mobilité externe</option>
<option>Autre</option>
</select>
</label>

<label>
Dernier entretien
<input id="retentionEntretien" type="date">
</label>

<label>
Action de rétention
<input id="retentionAction"
placeholder="Ex. entretien, formation, mobilité interne...">
</label>

<label>
Responsable du suivi
<input id="retentionResponsable">
</label>

<label>
Échéance
<input id="retentionEcheance" type="date">
</label>

<label>
Statut
<select id="retentionStatut">
<option>À traiter</option>
<option>En cours</option>
<option>Réalisé</option>
<option>Clôturé</option>
</select>
</label>

</div>

<label style="display:block;margin-top:14px">
Observations
<textarea
id="retentionNotes"
rows="4"
style="width:100%;margin-top:6px;padding:10px;border:1px solid #d1d5db;border-radius:7px">
</textarea>
</label>

<div class="actions" style="margin-top:15px">

<button class="btn" onclick="saveRetention()">
Enregistrer
</button>

<button class="btn secondary" onclick="closeRetentionForm()">
Annuler
</button>

</div>

</div>
</div>
<div class="page" id="kpi">

<h1>KPI / Reporting RH</h1>

<div class="muted">
Tableau de bord des indicateurs clés de performance des ressources humaines.
</div>

<div class="panel">

<h3>Indicateurs clés</h3>

<div class="formgrid">

<div class="panel kpi-card kpi-effectif">
<strong>Effectif total</strong>
<h2 id="kpiEffectifTotal">0</h2>
</div>

<div class="panel kpi-card kpi-actif">
<strong>Effectif actif</strong>
<h2 id="kpiEffectifActif">0</h2>
</div>

<div class="panel kpi-card kpi-evalues">
<strong>Collaborateurs évalués</strong>
<h2 id="kpiCollaborateursEvalues">0</h2>
</div>

<div class="panel kpi-card kpi-performance">
<strong>Score moyen de performance</strong>
<h2 id="kpiScoreMoyen">0 / 5</h2>
</div>

<div class="panel kpi-card kpi-talents">
<strong>Talents identifiés</strong>
<h2 id="kpiTalents">0</h2>
</div>

<div class="panel kpi-card kpi-formation">
<strong>Formations enregistrées</strong>
<h2 id="kpiFormations">0</h2>
</div>

<div class="panel kpi-card kpi-risque">
<strong>Collaborateurs à risque</strong>
<h2 id="kpiRisque">0</h2>
</div>

<div class="panel kpi-card kpi-taux-risque">
<strong>Taux de collaborateurs à risque</strong>
<h2 id="kpiRetention">0 %</h2>
</div>

</div>

</div>

<div class="panel">

<h3>Synthèse RH</h3>

<table>

<thead>
<tr>
<th>Indicateur</th>
<th>Valeur</th>
<th>Lecture</th>
</tr>
</thead>

<tbody>

<tr>
<td>Effectif actif</td>
<td id="kpiSyntheseActif">0</td>
<td>Nombre de collaborateurs actuellement actifs</td>
</tr>

<tr>
<td>Performance moyenne</td>
<td id="kpiSynthesePerformance">0 / 5</td>
<td>Score moyen des évaluations enregistrées</td>
</tr>

<tr>
<td>Talents identifiés</td>
<td id="kpiSyntheseTalents">0</td>
<td>Collaborateurs intégrés au référentiel des talents</td>
</tr>

<tr>
<td>Risque de départ</td>
<td id="kpiSyntheseRisque">0</td>
<td>Collaborateurs présentant un risque de départ</td>
</tr>

</tbody>

</table>

</div>

</div>
<div class="page" id="decision">

<h1>Aide à la décision RH</h1>

<div class="muted">
Analyse automatique des données RH et identification des situations nécessitant une action.
</div>

<div class="panel">

<h3>Diagnostic RH</h3>

<div id="decisionSummary" class="muted">
Analyse en cours...
</div>

<div id="decisionNiveau"
     style="margin-top:12px;font-weight:700">
Situation RH : Analyse en cours...
</div>
<div id="decisionExplication"
     class="muted"
     style="margin-top:10px">
Analyse des principaux facteurs...
</div>
</div>

<div class="panel">

<h3>Alertes et recommandations</h3>

<table>

<thead>
<tr>
<th>Priorité</th>
<th>Domaine</th>
<th>Constat</th>
<th>Recommandation</th>
</tr>
</thead>

<tbody id="decisionTable">

<tr>
<td colspan="4" style="text-align:center;padding:20px">
Aucune analyse disponible.
</td>
</tr>

</tbody>

</table>

</div>

<div class="panel">

<h3>Indicateurs nécessitant une attention</h3>

<div class="formgrid">

<div class="panel">
<strong>Performance en baisse</strong>
<h2 id="decisionPerformanceBaisse">0</h2>
</div>

<div class="panel">
<strong>Talents à développer</strong>
<h2 id="decisionTalentsDevelopper">0</h2>
</div>

<div class="panel">
<strong>Risque de départ</strong>
<h2 id="decisionRisqueDepart">0</h2>
</div>

<div class="panel">
<strong>Besoins de formation</strong>
<h2 id="decisionFormation">0</h2>
</div>

</div>

</div>

</div>
<div class="page" id="settings"><h1>Paramètres du système</h1>
<div class="panel"><h3>Configuration générale</h3><div class="formgrid">
<label>Nom du système<input value="SIGRT"></label><label>Version<input value="1.0 – Prototype"></label>
<label>Organisation<input placeholder="À renseigner"></label><label>Fuseau horaire<input value="Africa/Porto-Novo"></label></div>
<button class="btn" style="margin-top:16px" onclick="alert('Paramètres enregistrés dans le prototype.')">Enregistrer</button></div>
<div class="panel"><h3>Modules prévus</h3><table><tr><th>Module</th><th>Priorité</th><th>État</th></tr>
<tr><td>Collaborateurs</td><td>1</td><td>Prochaine étape</td></tr><tr><td>Talents</td><td>2</td><td>À développer</td></tr>
<tr><td>Performance</td><td>2</td><td>À développer</td></tr><tr><td>Formation</td><td>2</td><td>À développer</td></tr>
<tr><td>Rétention / fidélisation</td><td>2</td><td>À développer</td></tr><tr><td>KPI / Reporting</td><td>3</td><td>À développer</td></tr>
<tr><td>Aide à la décision IA</td><td>4</td><td>À développer</td></tr></table></div></div>


<div class="page" id="audit"><h1>Journal d’audit</h1><div class="muted">Prototype de traçabilité.</div>
<div class="panel"><table><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Résultat</th></tr>
<tr><td id="auditDate">—</td><td>Administrateur RH</td><td>Connexion</td><td><span class="badge">Réussie</span></td></tr></table></div></div>
</section></main></div>`;
renderUsers();
}

function login(){

    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value;

    if(u === "admin" && p === "sigrt123"){

        localStorage.setItem("sigrt_session", "admin");

        document.getElementById("loginScreen").style.display = "none";

        document.getElementById("auditDate").textContent =
            new Date().toLocaleString("fr-FR");

    }else{

        document.getElementById("loginError").style.display = "block";
    }
}
window.login = login;
function logout(){

    localStorage.removeItem("sigrt_session");

    document.getElementById("loginScreen").style.display = "flex";
}
function restoreSession(){

    const session = localStorage.getItem("sigrt_session");

    if(session === "admin"){

        document.getElementById("loginScreen").style.display = "none";

        const auditDate = document.getElementById("auditDate");

        if(auditDate){
            auditDate.textContent =
                new Date().toLocaleString("fr-FR");
        }
    }
}
function renderRetention(){

    const table =
        document.getElementById("retentionTable");

    if(!table) return;

    const search =
        (document.getElementById("retentionSearch")?.value || "")
        .toLowerCase();

    const risque =
        document.getElementById("retentionRisque")?.value || "";

    const suivis =
        Retention.lister();

    const filtres = suivis.filter(s => {

        const collaborateur =
            SIGRT.collaborateurs.find(
                c => c.matricule === s.matricule
            );

        if(!collaborateur) return false;

        const matchSearch =
            collaborateur.name.toLowerCase().includes(search) ||
            collaborateur.matricule.toLowerCase().includes(search);

        const matchRisque =
            !risque || s.risque === risque;

        return matchSearch && matchRisque;
    });

    table.innerHTML = filtres.map(s => {

        const collaborateur =
            SIGRT.collaborateurs.find(
                c => c.matricule === s.matricule
            );

        let anciennete = "—";

        if(collaborateur?.hire){

            const debut =
                new Date(collaborateur.hire);

            const aujourdHui =
                new Date();

            let annees =
                aujourdHui.getFullYear() -
                debut.getFullYear();

            let mois =
                aujourdHui.getMonth() -
                debut.getMonth();

            if(mois < 0){
                annees--;
                mois += 12;
            }

            anciennete =
                annees + " an(s) " +
                mois + " mois";
        }

        return `
        <tr>

            <td>
                ${escapeHtml(
                    collaborateur?.name || ""
                )}
            </td>

            <td>
                ${escapeHtml(anciennete)}
            </td>

            <td>
                <span class="badge">
                    ${escapeHtml(s.risque || "")}
                </span>
            </td>

            <td>
                ${escapeHtml(s.motif || "")}
            </td>

            <td>
                ${escapeHtml(s.entretien || "—")}
            </td>

            <td>
                ${escapeHtml(s.action || "—")}
            </td>

            <td>
                <span class="badge">
                    ${escapeHtml(s.statut || "À traiter")}
                </span>
            </td>

            <td>
                <button
                    class="btn secondary"
                    onclick="viewRetention('${s.id}')">
                    Voir
                </button>
            </td>

        </tr>
        `;

    }).join("");

    if(!filtres.length){

        table.innerHTML = `
        <tr>
            <td
                colspan="8"
                style="text-align:center;padding:20px">
                Aucun suivi de fidélisation enregistré.
            </td>
        </tr>
        `;
    }
}
function openRetentionForm(){

    const form =
        document.getElementById("retentionForm");

    if(!form) return;

    const select =
        document.getElementById(
            "retentionCollaborateur"
        );

    if(select){

        select.innerHTML =
            '<option value="">Sélectionner un collaborateur</option>' +
            SIGRT.collaborateurs
                .filter(c => c.status === "Actif")
                .map(c =>
                    `<option value="${escapeHtml(c.matricule)}">
                        ${escapeHtml(c.name)}
                    </option>`
                )
                .join("");
    }

    form.style.display = "block";

    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeRetentionForm(){

    const form =
        document.getElementById("retentionForm");

    if(form){
        form.style.display = "none";
    }
}
function saveRetention(){

    const matricule =
        document.getElementById(
            "retentionCollaborateur"
        ).value;

    const risque =
        document.getElementById(
            "retentionRisqueForm"
        ).value;

    const motif =
        document.getElementById(
            "retentionMotif"
        ).value;

    const entretien =
        document.getElementById(
            "retentionEntretien"
        ).value;

    const action =
        document.getElementById(
            "retentionAction"
        ).value.trim();

    const responsable =
        document.getElementById(
            "retentionResponsable"
        ).value.trim();

    const echeance =
        document.getElementById(
            "retentionEcheance"
        ).value;

    const statut =
        document.getElementById(
            "retentionStatut"
        ).value;

    const notes =
        document.getElementById(
            "retentionNotes"
        ).value.trim();


    if(!matricule || !risque){

        alert(
            "Veuillez sélectionner un collaborateur et renseigner le niveau de risque de départ."
        );

        return;
    }


    const suivis =
        Retention.lister();


    const suivi = {

        id:
            Date.now().toString(),

        matricule:
            matricule,

        risque:
            risque,

        motif:
            motif,

        entretien:
            entretien,

        action:
            action,

        responsable:
            responsable,

        echeance:
            echeance,

        statut:
            statut,

        notes:
            notes,

        dateCreation:
            new Date().toISOString()
    };


    suivis.push(suivi);


    Retention.enregistrer(suivis);

    enregistrerAudit({
        action: "Création",
        module: "Rétention",
        cible: "",
        details: "Suivi de fidélisation enregistré ou mis à jour."
    });



    renderRetention();

    closeRetentionForm();


    alert(
        "Suivi de fidélisation enregistré avec succès."
    );
}
function viewRetention(id){

    const suivis =
        Retention.lister();

    const suivi =
        suivis.find(
            s => s.id === id
        );

    if(!suivi) return;


    const collaborateur =
        SIGRT.collaborateurs.find(
            c => c.matricule === suivi.matricule
        );


    const nom =
        collaborateur
            ? collaborateur.name
            : suivi.matricule;


    let message =
        "SUIVI DE FIDÉLISATION" +
        "\n------------------------------" +
        "\nCollaborateur : " + nom +
        "\nMatricule : " + suivi.matricule +
        "\n\nRisque de départ : " +
        (suivi.risque || "Non renseigné") +
        "\nMotif potentiel : " +
        (suivi.motif || "Non renseigné") +
        "\nDernier entretien : " +
        (suivi.entretien || "Non renseigné") +
        "\nAction de rétention : " +
        (suivi.action || "Non renseignée") +
        "\nResponsable : " +
        (suivi.responsable || "Non renseigné") +
        "\nÉchéance : " +
        (suivi.echeance || "Non renseignée") +
        "\nStatut : " +
        (suivi.statut || "À traiter") +
        "\n\nObservations : " +
        (suivi.notes || "Aucune observation.");


    alert(message);
}
function renderKPI(){

    const collaborateurs = SIGRT.collaborateurs || [];
    const talents = SIGRT.talents || [];

    const evaluations =
        Evaluations.lister();

    const formations =
        Formations.lister();

    const retention =
        Retention.lister();

    /* =========================
       EFFECTIFS
    ========================= */

    const effectifTotal =
        collaborateurs.length;

    const effectifActif =
        collaborateurs.filter(
            c => c.status === "Actif"
        ).length;


    /* =========================
       PERFORMANCE
    ========================= */

    const collaborateursEvalues =
        new Set(
            evaluations.map(
                e => e.matricule
            )
        ).size;

    const scores =
        evaluations
            .map(e => Number(e.score))
            .filter(
                score => !isNaN(score)
            );

    const scoreMoyen =
        scores.length
            ? (
                scores.reduce(
                    (a,b) => a + b,
                    0
                ) / scores.length
              ).toFixed(2)
            : "0.00";


    /* =========================
       TALENTS
    ========================= */

    const talentsIdentifies =
        talents.length;


    /* =========================
       FORMATION
    ========================= */

    const formationsEnregistrees =
        formations.length;


    /* =========================
       RETENTION
    ========================= */

    const risques =
        retention.filter(r =>
            r.risque === "Élevé" ||
            r.risque === "Critique"
        ).length;

    const retentionTaux =
    effectifActif > 0
        ? (
            risques / effectifActif * 100
          ).toFixed(1)
        : "0.0";

    /* =========================
       AFFICHAGE
    ========================= */

    const values = {

        kpiEffectifTotal:
            effectifTotal,

        kpiEffectifActif:
            effectifActif,

        kpiCollaborateursEvalues:
            collaborateursEvalues,

        kpiScoreMoyen:
            scoreMoyen + " / 5",

        kpiTalents:
            talentsIdentifies,

        kpiFormations:
            formationsEnregistrees,

        kpiRisque:
            risques,

        kpiRetention:
            retentionTaux + " %",

        kpiSyntheseActif:
            effectifActif,

        kpiSynthesePerformance:
            scoreMoyen + " / 5",

        kpiSyntheseTalents:
            talentsIdentifies,

        kpiSyntheseRisque:
            risques
    };


    Object.keys(values).forEach(id => {

        const element =
            document.getElementById(id);

        if(element){
            element.textContent =
                values[id];
        }

    });

}
function renderDecision(){

    const collaborateurs = SIGRT.collaborateurs || [];
    const talents = SIGRT.talents || [];

    const evaluations =
        Evaluations.lister();

    const formations =
        Formations.lister();

    const retention =
        Retention.lister();


    let performanceBaisse = 0;
    let talentsDevelopper = 0;
    let risqueDepart = 0;
    let besoinsFormation = 0;

    const recommandations = [];


    /* =========================
       ANALYSE PERFORMANCE
    ========================= */

    collaborateurs.forEach(c => {

        const historique =
            evaluations
                .filter(e =>
                    e.matricule === c.matricule
                )
                .sort((a,b) =>
                    new Date(a.date || 0) -
                    new Date(b.date || 0)
                );

        if(historique.length >= 2){

            const premiere =
                Number(historique[0].score);

            const derniere =
                Number(
                    historique[historique.length - 1].score
                );

            if(
                !isNaN(premiere) &&
                !isNaN(derniere) &&
                derniere < premiere
            ){

                performanceBaisse++;

                recommandations.push({
                    priorite:"Élevée",
                    domaine:"Performance",
                    constat:
                        c.name +
                        " présente une baisse de performance.",
                    recommandation:
                        "Prévoir un entretien de suivi et identifier les causes de la baisse."
                });
            }
        }
    });


    /* =========================
       ANALYSE TALENTS
    ========================= */

    talents.forEach(t => {

        const potentiel =
            String(t.potentiel || "")
                .toLowerCase();

        if(
            potentiel.includes("fort") ||
            potentiel.includes("élevé")
        ){

            talentsDevelopper++;

            const c =
                collaborateurs.find(
                    x => x.matricule === t.matricule
                );

            recommandations.push({
                priorite:"Moyenne",
                domaine:"Talent",
                constat:
                    (c?.name || t.matricule) +
                    " présente un potentiel élevé.",
                recommandation:
                    "Élaborer un plan de développement et étudier une évolution professionnelle."
            });
        }
    });


    /* =========================
       ANALYSE RÉTENTION
    ========================= */

    retention.forEach(r => {

        const risque =
            String(r.risque || "")
                .toLowerCase();

        if(
            risque.includes("élevé") ||
            risque.includes("critique")
        ){

            risqueDepart++;

            const c =
                collaborateurs.find(
                    x => x.matricule === r.matricule
                );

            recommandations.push({
                priorite:"Critique",
                domaine:"Rétention",
                constat:
                    (c?.name || r.matricule) +
                    " présente un niveau de risque de départ important.",
                recommandation:
                    "Organiser un entretien de fidélisation et analyser les facteurs de risque."
            });
        }
    });


    /* =========================
       ANALYSE FORMATION
    ========================= */

    formations.forEach(f => {

        const statut =
            String(f.statut || "")
                .toLowerCase();

        if(
            statut.includes("à planifier") ||
            statut.includes("besoin") ||
            statut.includes("en attente")
        ){

            besoinsFormation++;

            recommandations.push({
                priorite:"Moyenne",
                domaine:"Formation",
                constat:
                    f.intitule ||
                    f.formation ||
                    "Besoin de formation identifié.",
                recommandation:
                    "Planifier l'action de formation et assurer son suivi."
            });
        }
    });


    /* =========================
       AFFICHAGE DES INDICATEURS
    ========================= */

    const elements = {

        decisionPerformanceBaisse:
            performanceBaisse,

        decisionTalentsDevelopper:
            talentsDevelopper,

        decisionRisqueDepart:
            risqueDepart,

        decisionFormation:
            besoinsFormation
    };


    Object.keys(elements).forEach(id => {

        const element =
            document.getElementById(id);

        if(element){
            element.textContent =
                elements[id];
        }

    });


    /* =========================
       TABLEAU DES RECOMMANDATIONS
    ========================= */

    const table =
        document.getElementById("decisionTable");

    if(table){

        if(!recommandations.length){

            table.innerHTML = `
                <tr>
                    <td colspan="4"
                        style="text-align:center;padding:20px">
                        Aucun point nécessitant une action immédiate.
                    </td>
                </tr>
            `;

        }else{

            table.innerHTML =
                recommandations.map(r => `

                    <tr class="decision-${String(r.priorite).toLowerCase().replace("é","e")}">

                        <td>
                            <span class="badge priorite-${String(r.priorite).toLowerCase().replace("é","e")}">
                                ${escapeHtml(r.priorite)}
                            </span>
                        </td>

                        <td>
                            ${escapeHtml(r.domaine)}
                        </td>

                        <td>
                            ${escapeHtml(r.constat)}
                        </td>

                        <td>
                            ${escapeHtml(r.recommandation)}
                        </td>

                    </tr>

                `).join("");
        }
    }


    /* =========================
       SYNTHÈSE
    ========================= */

    const summary =
        document.getElementById("decisionSummary");

    if(summary){

        const totalAlertes =
            recommandations.length;

        if(totalAlertes === 0){

            summary.textContent =
                "La situation RH analysée ne présente actuellement aucun signal nécessitant une action prioritaire.";

        }else{

            summary.textContent =
                totalAlertes +
                " point(s) nécessitent une attention RH. " +
                "Les recommandations sont classées selon leur niveau de priorité.";
        }
    }
const niveau =
        document.getElementById("decisionNiveau");

    if(niveau){

       let texte = "Situation RH : Maîtrisée";
let classe = "diagnostic-maitrisee";

if(risqueDepart > 0){

    texte = "Situation RH : Priorité RH";
    classe = "diagnostic-priorite";

}else if(
    performanceBaisse > 0 ||
    besoinsFormation > 0
){

    texte = "Situation RH : Attention";
    classe = "diagnostic-attention";

}else if(
    talentsDevelopper > 0
){

    texte = "Situation RH : Vigilance";
    classe = "diagnostic-vigilance";
}

niveau.textContent = texte;
niveau.className = classe;
    }
const explication =
    document.getElementById("decisionExplication");

if(explication){

    const facteurs = [];

    if(risqueDepart > 0){
        facteurs.push(
    risqueDepart +
    (risqueDepart > 1
        ? " risques de départ identifiés"
        : " risque de départ identifié")
);
    }

    if(performanceBaisse > 0){
        facteurs.push(
    performanceBaisse +
    (performanceBaisse > 1
        ? " situations de baisse de performance"
        : " situation de baisse de performance")
);
    }

    if(talentsDevelopper > 0){
        facteurs.push(
    talentsDevelopper +
    (talentsDevelopper > 1
        ? " talents nécessitant un développement"
        : " talent nécessitant un développement")
);
    }

    if(besoinsFormation > 0){
        facteurs.push(
    besoinsFormation +
    (besoinsFormation > 1
        ? " besoins de formation"
        : " besoin de formation")
);
    }

    if(facteurs.length === 0){

        explication.textContent =
            "Aucun facteur RH majeur ne nécessite actuellement une intervention.";

    }else{

        explication.textContent =
            facteurs.join(" • ") +
            ".";
    }
}
}

function renderDashboard(){
    console.log("SIGRT DASHBOARD - collaborateurs :", SIGRT.collaborateurs.length);

    const collaborateurs = SIGRT.collaborateurs || [];
    const utilisateurs = SIGRT.users || [];
    const talents = SIGRT.talents || [];
    const evaluations = SIGRT.evaluations || [];
    const formations = SIGRT.formations || [];
    const retention = SIGRT.retention || [];

    const effectifEl = document.getElementById("dashEffectif");
    const usersEl = document.getElementById("dashUsers");
    const talentsEl = document.getElementById("dashTalents");
    const evaluationsEl = document.getElementById("dashEvaluations");
    const formationsEl = document.getElementById("dashFormations");
    const retentionEl = document.getElementById("dashRetention");

    if(effectifEl) effectifEl.textContent = collaborateurs.length;
    if(usersEl) usersEl.textContent = utilisateurs.length;
    if(talentsEl) talentsEl.textContent = talents.length;
    if(evaluationsEl) evaluationsEl.textContent = evaluations.length;
    if(formationsEl) formationsEl.textContent = formations.length;
    if(retentionEl) retentionEl.textContent = retention.length;


    /* KPI RH */

    const total = collaborateurs.length;

    const actifs = collaborateurs.filter(c =>
        String(c.status || "").toLowerCase() === "actif"
    ).length;

    const cdi = collaborateurs.filter(c =>
        String(c.contract || "").toUpperCase() === "CDI"
    ).length;

    const autresContrats = total - cdi;

    const potentielAevaluer = collaborateurs.filter(c =>
        String(c.potential || "").toLowerCase() === "à évaluer"
    ).length;

    const activityRate = total > 0
        ? Math.round((actifs / total) * 100)
        : 0;

    const activityEl =
        document.getElementById("dashActivityRate");

    const cdiEl =
        document.getElementById("dashCDI");

    const otherContractsEl =
        document.getElementById("dashOtherContracts");

    const potentialEl =
        document.getElementById("dashPotential");

    if(activityEl)
        activityEl.textContent = activityRate + "%";

    if(cdiEl)
        cdiEl.textContent = cdi;

    if(otherContractsEl)
        otherContractsEl.textContent = autresContrats;

    if(potentialEl)
        potentialEl.textContent = potentielAevaluer;


    /* Alertes RH */

    const alerts = [];

    const potentielCount = collaborateurs.filter(c =>
        String(c.potential || "").toLowerCase() === "à évaluer"
    ).length;

    if(potentielCount > 0){
        alerts.push(
            `Potentiel : ${potentielCount} collaborateur${potentielCount > 1 ? "s" : ""} à évaluer.`
        );
    }

    const inactifs = collaborateurs.filter(c =>
        String(c.status || "").toLowerCase() !== "actif"
    ).length;

    if(inactifs > 0){
        alerts.push(
            `Statut : ${inactifs} collaborateur${inactifs > 1 ? "s" : ""} avec un statut différent de « Actif ».`
        );
    }

    const aujourdHui = new Date();

    const recents = collaborateurs.filter(c => {

        if(!c.hire) return false;

        const dateEmbauche = new Date(c.hire);

        if(Number.isNaN(dateEmbauche.getTime())) return false;

        const difference =
            (aujourdHui - dateEmbauche) / (1000 * 60 * 60 * 24);

        return difference >= 0 && difference <= 90;

    }).length;

    if(recents > 0){
        alerts.push(
            `Intégration : ${recents} collaborateur${recents > 1 ? "s" : ""} recruté${recents > 1 ? "s" : ""} au cours des 90 derniers jours.`
        );
    }

    const alertsContainer =
        document.getElementById("dashboardAlerts");

    if(alertsContainer){

        if(alerts.length === 0){

            alertsContainer.innerHTML =
                '<div class="muted">✓ Aucune alerte RH détectée.</div>';

        }else{

            alertsContainer.innerHTML =
                alerts.map(alert => `
                    <div class="card" style="margin-bottom:10px">
                        <div>${escapeHtml(alert)}</div>
                    </div>
                `).join("");

        }

    }


    /* Répartition par département */

    const departments = {};

    collaborateurs.forEach(c => {

        const dept = c.dept || "Non renseigné";

        departments[dept] =
            (departments[dept] || 0) + 1;

    });

    const departmentContainer =
        document.getElementById("dashboardDepartments");

    if(departmentContainer){

        const entries =
            Object.entries(departments)
                .sort((a,b) => b[1] - a[1]);

        if(entries.length === 0){

            departmentContainer.innerHTML =
                '<div class="muted">Aucune donnée disponible.</div>';

        }else{

            departmentContainer.innerHTML =
                entries.map(([dept,count]) => `
                    <div class="card">
                        <div class="muted">${escapeHtml(dept)}</div>
                        <div class="value">${count}</div>
                        <div class="muted">
                            ${collaborateurs.length
                                ? Math.round((count / collaborateurs.length) * 100)
                                : 0}% de l'effectif
                        </div>
                    </div>
                `).join("");

        }

    }


    /* Répartition par statut */

    const statuses = {};

    collaborateurs.forEach(c => {

        const status = c.status || "Non renseigné";

        statuses[status] =
            (statuses[status] || 0) + 1;

    });

    const statusContainer =
        document.getElementById("dashboardStatuses");

    if(statusContainer){

        const entries =
            Object.entries(statuses)
                .sort((a,b) => b[1] - a[1]);

        if(entries.length === 0){

            statusContainer.innerHTML =
                '<div class="muted">Aucune donnée disponible.</div>';

        }else{

            statusContainer.innerHTML =
                entries.map(([status,count]) => `
                    <div class="card">
                        <div class="muted">${escapeHtml(status)}</div>
                        <div class="value">${count}</div>
                        <div class="muted">
                            ${collaborateurs.length
                                ? Math.round((count / collaborateurs.length) * 100)
                                : 0}% de l'effectif
                        </div>
                    </div>
                `).join("");

        }

    }

    /* =========================
       PILOTAGE RH - KPI
    ========================= */

    const dashboardScores = evaluations
        .map(e => Number(e.score))
        .filter(score => !Number.isNaN(score));

    const dashboardScoreMoyen =
        dashboardScores.length
            ? (
                dashboardScores.reduce(
                    (a, b) => a + b,
                    0
                ) / dashboardScores.length
              ).toFixed(2)
            : "0.00";

    const dashboardCollaborateursEvalues =
        new Set(
            evaluations
                .map(e => e.matricule)
                .filter(Boolean)
        ).size;

    const dashboardRisques =
        retention.filter(r =>
            r.risque === "Élevé" ||
            r.risque === "Critique"
        ).length;

    const dashboardTauxRisque =
        actifs > 0
            ? ((dashboardRisques / actifs) * 100).toFixed(1)
            : "0.0";

    const dashScoreMoyen =
        document.getElementById("dashScoreMoyen");

    const dashCollaborateursEvalues =
        document.getElementById("dashCollaborateursEvalues");

    const dashTalentsPilotage =
        document.getElementById("dashTalentsPilotage");

    const dashRisques =
        document.getElementById("dashRisques");

    const dashTauxRisque =
        document.getElementById("dashTauxRisque");

    if(dashScoreMoyen)
        dashScoreMoyen.textContent =
            dashboardScoreMoyen + " / 5";

    if(dashCollaborateursEvalues)
        dashCollaborateursEvalues.textContent =
            dashboardCollaborateursEvalues;

    if(dashTalentsPilotage)
        dashTalentsPilotage.textContent =
            talents.length;

    if(dashRisques)
        dashRisques.textContent =
            dashboardRisques;

    if(dashTauxRisque)
        dashTauxRisque.textContent =
            dashboardTauxRisque + "%";

}

function showPage(id,btn){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active")); document.getElementById(id).classList.add("active");
 document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
 document.getElementById("pageTitle").textContent={
    dashboard:"Tableau de bord",
    users:"Utilisateurs & rôles",
    collaborateurs:"Gestion des collaborateurs",
    performance:"Gestion de la performance",
    talents:"Gestion des talents",
    formation:"Gestion de la formation",
    retention:"Rétention / Fidélisation",
    decision:"Aide à la décision RH",
    settings:"Paramètres du système",
    audit:"Journal d’audit"
}[id];
 if(id==="dashboard")renderDashboard();
 if(id==="users")renderUsers();
if(id==="collaborateurs")renderCollaborateurs();
if(id==="performance")renderPerformance();
if(id==="talents")renderTalents();
if(id==="formation") renderFormations();
if(id==="retention")renderRetention();
if(id==="kpi")renderKPI();
if(id==="decision")renderDecision();
}

window.showPage = showPage;
  function escapeHtml(value){
      return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
  }

function saveUsers(){
    Utilisateurs.enregistrer(SIGRT.users);
}
function renderUsers(){
    const q = (document.getElementById("userSearch")?.value || "").toLowerCase();
    const tbody = document.getElementById("userTable");

    if(!tbody) return;

    tbody.innerHTML = SIGRT.users
        .filter(u =>
            (u.name + " " + u.login + " " + u.role)
            .toLowerCase()
            .includes(q)
        )
        .map((u,i) =>
            `<tr>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.login)}</td>
                <td>${escapeHtml(u.role)}</td>
                <td><span class="badge">${escapeHtml(u.status)}</span></td>
                <td>
                    <button class="btn secondary" onclick="removeUser(${i})">
                        Supprimer
                    </button>
                </td>
            </tr>`
        )
        .join("");

    const countEl = document.getElementById("userCount");

    if(countEl){
        countEl.textContent = SIGRT.users.length;
    }
}

function openUserForm(){
    document.getElementById("userForm").style.display = "block";
}

function closeUserForm(){
    document.getElementById("userForm").style.display = "none";
}

function addUser(){
    const name = document.getElementById("newName").value.trim();
    const login = document.getElementById("newLogin").value.trim();

    if(!name || !login){
        alert("Veuillez renseigner le nom et l'identifiant.");
        return;
    }

    SIGRT.users.push({
        name: name,
        login: login,
        role: document.getElementById("newRole").value,
        status: document.getElementById("newStatus").value
    });

    saveUsers();

    closeUserForm();
    renderUsers();
}

function removeUser(i){
    if(confirm("Supprimer cet utilisateur du prototype ?")){
        SIGRT.users.splice(i,1);
        saveUsers();
        renderUsers();
    }
}
function openPerformanceForm(){

    const form = document.getElementById("performanceForm");
    const select = document.getElementById("evalCollaborateur");

    select.innerHTML = `
        <option value="">Sélectionner un collaborateur</option>
        ${SIGRT.collaborateurs.map(c =>
            `<option value="${escapeHtml(c.matricule)}">
                ${escapeHtml(c.name)} - ${escapeHtml(c.matricule)}
            </option>`
        ).join("")}
    `;

    form.style.display = "block";
}


function closePerformanceForm(){

    document.getElementById("performanceForm").style.display = "none";
}


function savePerformance(){

    const matricule =
        document.getElementById("evalCollaborateur").value;

    const periode =
        document.getElementById("evalPeriode").value;

    const qualite =
        document.getElementById("evalQualite").value;

    const productivite =
        document.getElementById("evalProductivite").value;

    const procedures =
        document.getElementById("evalProcedures").value;

    const comportement =
        document.getElementById("evalComportement").value;

    const competences =
        document.getElementById("evalCompetences").value;

    const potentiel =
        document.getElementById("evalPotentiel").value;

    const commentaire =
        document.getElementById("evalCommentaire").value.trim();


    if(!matricule || !periode){

        alert("Veuillez sélectionner le collaborateur et la période.");

        return;
    }


    if(!qualite ||
       !productivite ||
       !procedures ||
       !comportement ||
       !competences){

        alert("Veuillez renseigner tous les critères d'évaluation.");

        return;
    }


    const score = (
        Number(qualite) +
        Number(productivite) +
        Number(procedures) +
        Number(comportement) +
        Number(competences)
    ) / 5;


    const evaluation = {

        id: Date.now(),

        matricule: matricule,

        periode: periode,

        qualite: Number(qualite),

        productivite: Number(productivite),

        procedures: Number(procedures),

        comportement: Number(comportement),

        competences: Number(competences),

        potentiel: potentiel,

        commentaire: commentaire,

        score: Number(score.toFixed(2)),

        statut: "Évaluée",

        date: new Date().toISOString()

    };


    let evaluations =
        Evaluations.lister();


    evaluations.push(evaluation);

    Evaluations.enregistrer(evaluations);

    enregistrerAudit({
        action: "Création",
        module: "Performance",
        cible: evaluation.matricule || "",
        details:
            "Évaluation " +
            (evaluation.periode || "") +
            " enregistrée — score " +
            evaluation.score +
            "/5"
    });


    Evaluations.synchroniser(evaluations).catch(erreur => {
        console.error("Erreur de synchronisation des évaluations :", erreur);
    });

    proposerTalentDepuisEvaluation(evaluation);

    renderPerformance();

    closePerformanceForm();

    alert("Évaluation enregistrée avec succès.");
}
function proposerTalentDepuisEvaluation(evaluation){

    const collaborateur =
        SIGRT.collaborateurs.find(
            c => c.matricule === evaluation.matricule
        );

    if(!collaborateur){
        return;
    }

    let potentiel = "";

    if(evaluation.score >= 4){
        potentiel = "Potentiel élevé";
    }else if(evaluation.score >= 3){
        potentiel = "Potentiel moyen";
    }else{
        potentiel = "Potentiel à développer";
    }

    const existe =
        SIGRT.talents.find(
            t => t.matricule === evaluation.matricule
        );

    if(existe){
        return;
    }

    const confirmer = confirm(
        `${collaborateur.name} a obtenu une moyenne de ${evaluation.score}/5.\n\n` +
        `Potentiel proposé : ${potentiel}.\n\n` +
        `Voulez-vous ajouter ce collaborateur au référentiel des talents ?`
    );

    if(!confirmer){
        return;
    }

    SIGRT.talents.push({
        matricule: evaluation.matricule,
        potentiel: potentiel,
        posteCible: "",
        statut: "À développer",
        notes:
            `Ajouté automatiquement à partir de l'évaluation ${evaluation.periode}. ` +
            `Score moyen : ${evaluation.score}/5.`
    });

    saveTalents();

    if(
        document.getElementById("talentTable")
    ){
        renderTalents();
    }

}    
function renderPerformance(){

    const tbody =
        document.getElementById("performanceTable");

    if(!tbody) return;

    const evaluations =
        Evaluations.lister();

    tbody.innerHTML = evaluations.map(evaluation => {

        const collaborateur =
            SIGRT.collaborateurs.find(
                c => c.matricule === evaluation.matricule
            );

        const nom =
            collaborateur
                ? collaborateur.name
                : evaluation.matricule;

        let niveau = "";

        if(evaluation.score >= 4){
            niveau = "Très bonne performance";
        }else if(evaluation.score >= 3){
            niveau = "Performance satisfaisante";
        }else if(evaluation.score >= 2){
            niveau = "Performance à améliorer";
        }else{
            niveau = "Performance insuffisante";
        }

        return `
            <tr>

                <td>${escapeHtml(nom)}</td>

                <td>${escapeHtml(evaluation.periode)}</td>

                <td>
                    <strong>${evaluation.score}/5</strong>
                </td>

                <td>
                    ${escapeHtml(niveau)}
                </td>

                <td>
                    <span class="badge">
                        ${escapeHtml(evaluation.statut)}
                    </span>
                </td>

                <td>

                    <button
                        class="btn secondary"
                        onclick="viewPerformance(${evaluation.id})">
                        Voir
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}
function viewPerformance(id){

    const evaluations =
        Evaluations.lister();

    const evaluation =
        evaluations.find(e => e.id === id);

    if(!evaluation) return;

    const collaborateur =
        SIGRT.collaborateurs.find(
            c => c.matricule === evaluation.matricule
        );

    const nom =
        collaborateur
            ? collaborateur.name
            : evaluation.matricule;

    const historique =
        evaluations
            .filter(
                e => e.matricule === evaluation.matricule
            )
            .sort(
                (a,b) =>
                    new Date(a.date) - new Date(b.date)
            );

    let message =
        "COLLABORATEUR : " + nom +
        "\nMatricule : " + evaluation.matricule +
        "\n\n";

    message +=
        "ÉVALUATION SÉLECTIONNÉE" +
        "\n------------------------------" +
        "\nPériode : " + evaluation.periode +
        "\nScore : " + evaluation.score + "/5" +
        "\nQualité : " + evaluation.qualite + "/5" +
        "\nProductivité : " + evaluation.productivite + "/5" +
        "\nProcédures : " + evaluation.procedures + "/5" +
        "\nComportement : " + evaluation.comportement + "/5" +
        "\nCompétences : " + evaluation.competences + "/5" +
        "\nPotentiel : " +
        (evaluation.potentiel || "Non renseigné") +
        "\n\nCommentaire : " +
        (evaluation.commentaire || "Aucun commentaire.");

    message +=
        "\n\n\nHISTORIQUE DES ÉVALUATIONS" +
        "\n------------------------------";

    historique.forEach((e, index) => {

        message +=
            "\n" +
            (index + 1) +
            ". " +
            e.periode +
            " → " +
            e.score +
            "/5";
    });

    if(historique.length > 1){

        const somme =
            historique.reduce(
                (total, e) =>
                    total + Number(e.score || 0),
                0
            );

        const moyenne =
            somme / historique.length;

        const premiere =
            Number(historique[0].score);

        const derniere =
            Number(
                historique[historique.length - 1].score
            );

         const ecartPoints =
            Number((derniere - premiere).toFixed(2));

        let tendance = "Stable";

        if(ecartPoints > 0){
            tendance = "En progression";
        }else if(ecartPoints < 0){
            tendance = "En baisse";
        }

          message +=
            "\n\nMoyenne historique : " +
            moyenne.toFixed(2) +
            "/5" +
            "\nPremière évaluation : " +
            premiere +
            "/5" +
            "\nDernière évaluation : " +
            derniere +
            "/5" +
            "\nÉcart de performance : " +
            (ecartPoints > 0 ? "+" : "") +
            ecartPoints +
            " point(s)" +
            "\nTendance : " +
            tendance;
    }

    alert(message);
}
let formations =
    Formations.lister();

function saveFormations(){
    Formations.enregistrer(formations);

    enregistrerAudit({
        action: "Création",
        module: "Formation",
        cible: "",
        details: "Formation enregistrée ou mise à jour."
    });

}

function renderFormations(){

    const table =
        document.getElementById("formationTable");

    if(!table) return;

    const collaborateurFilter =
        document.getElementById("formationCollaborateur")?.value || "";

    const statutFilter =
        document.getElementById("formationStatut")?.value || "";

    const liste = formations.filter(f => {

        const matchCollaborateur =
            !collaborateurFilter ||
            f.matricule === collaborateurFilter;

        const matchStatut =
            !statutFilter ||
            f.statut === statutFilter;

        return matchCollaborateur && matchStatut;
    });

    table.innerHTML = liste.map(f => {

        const collaborateur =
            SIGRT.collaborateurs.find(
                c => c.matricule === f.matricule
            );

        return `
        <tr>

            <td>
                ${escapeHtml(
                    collaborateur?.name || f.matricule
                )}
            </td>

            <td>
                ${escapeHtml(f.titre || "")}
            </td>

            <td>
                ${escapeHtml(f.organisme || "")}
            </td>

            <td>
                ${escapeHtml(f.date || "")}
            </td>

            <td>
                ${escapeHtml(String(f.duree || 0))} h
            </td>

            <td>
                ${Number(f.cout || 0).toLocaleString("fr-FR")}
            </td>

            <td>
                <span class="badge">
                    ${escapeHtml(f.statut || "")}
                </span>
            </td>

            <td>
                <button
                    class="btn secondary"
                    onclick="viewFormation('${f.id}')">
                    Voir
                </button>
            </td>

        </tr>
        `;

    }).join("");

    if(!liste.length){

        table.innerHTML = `
        <tr>
            <td colspan="8"
                style="text-align:center;padding:20px">
                Aucune formation enregistrée.
            </td>
        </tr>
        `;
    }
}

function remplirCollaborateursFormation(){

    const selects = [
        document.getElementById("formationCollaborateur"),
        document.getElementById("formCollab")
    ];

    selects.forEach(select => {

        if(!select) return;

        const valeurActuelle = select.value;

        select.innerHTML =
            select.id === "formationCollaborateur"
            ? `<option value="">Tous les collaborateurs</option>`
            : `<option value="">Sélectionner un collaborateur</option>`;

        SIGRT.collaborateurs.forEach(c => {

            const option =
                document.createElement("option");

            option.value = c.matricule;

            option.textContent =
                `${c.name} (${c.matricule})`;

            select.appendChild(option);
        });

        select.value = valeurActuelle;
    });
}

function openFormationForm(){

    const form =
        document.getElementById("formationForm");

    if(!form) return;

    document.getElementById("formCollab").value = "";
    document.getElementById("formTitre").value = "";
    document.getElementById("formOrganisme").value = "";
    document.getElementById("formDate").value = "";
    document.getElementById("formDuree").value = "";
    document.getElementById("formCout").value = "";
    document.getElementById("formStatut").value = "Planifiée";
    document.getElementById("formEvaluation").value = "";
    document.getElementById("formNotes").value = "";

    remplirCollaborateursFormation();

    form.style.display = "block";

    document.getElementById("formCollab").focus();
}

function closeFormationForm(){

    const form =
        document.getElementById("formationForm");

    if(form){
        form.style.display = "none";
    }
}

function saveFormation(){

    const matricule =
        document.getElementById("formCollab").value;

    const titre =
        document.getElementById("formTitre").value.trim();

    const organisme =
        document.getElementById("formOrganisme").value.trim();

    const date =
        document.getElementById("formDate").value;

    const duree =
        document.getElementById("formDuree").value;

    const cout =
        document.getElementById("formCout").value;

    const statut =
        document.getElementById("formStatut").value;

    const evaluation =
        document.getElementById("formEvaluation").value;

    const notes =
        document.getElementById("formNotes").value.trim();

    if(
        !matricule ||
        !titre ||
        !date ||
        !duree
    ){

        alert(
            "Veuillez renseigner le collaborateur, l'intitulé, la date et la durée de la formation."
        );

        return;
    }

    const formation = {

        id: Date.now().toString(),

        matricule: matricule,

        titre: titre,

        organisme: organisme,

        date: date,

        duree: Number(duree),

        cout: Number(cout || 0),

        statut: statut,

        evaluation: evaluation,

        notes: notes
    };

    formations.push(formation);

    saveFormations();

    renderFormations();

    closeFormationForm();

    alert(
        "Formation enregistrée avec succès."
    );
}

function viewFormation(id){

    const formation =
        formations.find(
            f => f.id === id
        );

    if(!formation) return;

    const collaborateur =
        SIGRT.collaborateurs.find(
            c => c.matricule === formation.matricule
        );

    const nom =
        collaborateur
            ? collaborateur.name
            : formation.matricule;

    alert(
        "FORMATION\n\n" +

        "Collaborateur : " + nom +

        "\nMatricule : " +
        formation.matricule +

        "\n\nIntitulé : " +
        formation.titre +

        "\nOrganisme : " +
        (formation.organisme || "Non renseigné") +

        "\nDate : " +
        formation.date +

        "\nDurée : " +
        formation.duree +
        " h" +

        "\nCoût : " +
        Number(formation.cout || 0)
            .toLocaleString("fr-FR") +

        "\nStatut : " +
        formation.statut +

        "\nÉvaluation : " +
        (formation.evaluation || "Non évaluée") +

        "\n\nObservations : " +
        (formation.notes || "Aucune observation.")
    );
}

document.addEventListener(
    "change",
    function(e){

        if(
            e.target.id === "formationCollaborateur" ||
            e.target.id === "formationStatut"
        ){

            renderFormations();
        }
    }
);

remplirCollaborateursFormation();
renderFormations();
renderApp();
renderDashboard();
restoreSession();

(async function initialiserSynchronisationAPI() {
    try {
        if (
            typeof verifierAPI !== "function" ||
            typeof synchroniserToutesLesDonnees !== "function"
        ) {
            console.warn("SIGRT — fonctions API non disponibles.");
            return;
        }

        const disponible = await verifierAPI();

        if (!disponible) {
            console.log("SIGRT — API indisponible, mode local conservé.");
            return;
        }

        const resultats = await synchroniserToutesLesDonnees();

        console.log(
            "SIGRT — synchronisation API terminée :",
            resultats
        );
    } catch (erreur) {
        console.warn(
            "SIGRT — synchronisation API ignorée :",
            erreur.message
        );
    }
})();

window.savePerformance = savePerformance;

window.logout = logout;
window.renderUsers = renderUsers;
window.openUserForm = openUserForm;
window.closeUserForm = closeUserForm;
window.addUser = addUser;
window.removeUser = removeUser;

window.renderCollaborateurs = renderCollaborateurs;
window.openCollabForm = openCollabForm;
window.saveCollaborateur = saveCollaborateur;
window.closeCollabForm = closeCollabForm;
window.viewCollaborateur = viewCollaborateur;
window.editCollaborateur = editCollaborateur;
window.deleteCollaborateur = deleteCollaborateur;

window.openPerformanceForm = openPerformanceForm;
window.closePerformanceForm = closePerformanceForm;
window.savePerformance = savePerformance;
window.viewPerformance = viewPerformance;

window.openTalentForm = openTalentForm;
window.closeTalentForm = closeTalentForm;
window.saveTalent = saveTalent;
window.editTalent = editTalent;

window.openFormationForm = openFormationForm;
window.closeFormationForm = closeFormationForm;
window.saveFormation = saveFormation;
window.viewFormation = viewFormation;

window.renderRetention = renderRetention;
window.openRetentionForm = openRetentionForm;
window.closeRetentionForm = closeRetentionForm;
window.saveRetention = saveRetention;
window.viewRetention = viewRetention;
