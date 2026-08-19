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

function saveCollaborateur(){

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

    if(i < 0){

        SIGRT.collaborateurs.push(c);

    }else{

        SIGRT.collaborateurs[i] = c;
    }

    saveCollaborateurs();

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


function deleteCollaborateur(matricule){

    const i = findCollabIndexByMatricule(matricule);

    if(i < 0) return;

    if(confirm("Supprimer définitivement ce collaborateur du prototype ?")){

        SIGRT.collaborateurs.splice(i, 1);

        saveCollaborateurs();
        renderCollaborateurs();

        document.getElementById("collabDetail").style.display = "none";
    }
}

        renderCollaborateurs();

        document.getElementById("collabDetail").style.display = "none";
    }
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
    <button onclick="showPage('settings',this)">Paramètres du système</button>
    <button onclick="showPage('audit',this)">Journal d’audit</button>
  </div>
</aside>
<main class="main">
<header class="topbar"><strong id="pageTitle">Tableau de bord</strong>
<div class="user">Connecté : <strong>Administrateur RH</strong> <button class="btn secondary" onclick="logout()">Déconnexion</button></div></header>
<section class="content">
<div class="page active" id="dashboard">
<h1>Tableau de bord</h1><div class="muted">Vue synthétique du socle du SIGRT.</div>
<div class="cards">
<div class="card"><div class="muted">Collaborateurs</div><div class="value"id="collabCount">0</div></div>
<div class="card"><div class="muted">Utilisateurs</div><div class="value" id="userCount">3</div></div>
<div class="card"><div class="muted">Rôles</div><div class="value">3</div></div>
<div class="card"><div class="muted">Alertes système</div><div class="value">0</div></div>
</div>
<div class="panel"><h3>Architecture fonctionnelle du socle</h3>
<table><tr><th>Composant</th><th>État</th><th>Finalité</th></tr>
<tr><td>Authentification</td><td><span class="badge">Actif</span></td><td>Contrôler l'accès</td></tr>
<tr><td>Utilisateurs</td><td><span class="badge">Actif</span></td><td>Gérer les comptes</td></tr>
<tr><td>Rôles & permissions</td><td><span class="badge">Actif</span></td><td>Gérer les habilitations</td></tr>
<tr><td>Tableau de bord</td><td><span class="badge">Actif</span></td><td>Présenter les indicateurs</td></tr>
<tr><td>Journal d'audit</td><td><span class="badge">Actif</span></td><td>Tracer les opérations</td></tr>
</table></div></div>

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
 const u=document.getElementById("loginUser").value.trim(), p=document.getElementById("loginPass").value;
 if(u==="admin" && p==="sigrt123"){document.getElementById("loginScreen").style.display="none";document.getElementById("auditDate").textContent=new Date().toLocaleString("fr-FR");}
 else document.getElementById("loginError").style.display="block";
}
function logout(){document.getElementById("loginScreen").style.display="flex";}
function showPage(id,btn){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active")); document.getElementById(id).classList.add("active");
 document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
 document.getElementById("pageTitle").textContent={dashboard:"Tableau de bord",users:"Utilisateurs & rôles",collaborateurs:"Gestion des collaborateurs",performance:"Gestion de la performance",settings:"Paramètres du système",audit:"Journal d’audit"}[id];
 if(id==="users")renderUsers(); if(id==="collaborateurs")renderCollaborateurs();
}
function escapeHtml(value){
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function saveUsers(){
    localStorage.setItem(
        "sigrt_users",
        JSON.stringify(SIGRT.users)
    );
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

renderApp();
const collabCount = document.getElementById("collabCount");

if(collabCount){
    collabCount.textContent = SIGRT.collaborateurs.length;
}
