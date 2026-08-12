const SIGRT = {
  users: [
    {name:"Administrateur RH",login:"admin",role:"Administrateur RH",status:"Actif"},
    {name:"Gestionnaire RH",login:"rh.manager",role:"Gestionnaire RH",status:"Actif"},
    {name:"Manager",login:"manager",role:"Manager",status:"Actif"}
  ]
};

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
<div class="card"><div class="muted">Collaborateurs</div><div class="value">0</div></div>
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
 document.getElementById("pageTitle").textContent={dashboard:"Tableau de bord",users:"Utilisateurs & rôles",settings:"Paramètres du système",audit:"Journal d’audit"}[id];
 if(id==="users")renderUsers();
}
function renderUsers(){
 const q=(document.getElementById("userSearch")?.value||"").toLowerCase(), tbody=document.getElementById("userTable");
 if(!tbody)return;
 tbody.innerHTML=SIGRT.users.filter(u=>(u.name+" "+u.login+" "+u.role).toLowerCase().includes(q)).map((u,i)=>
 `<tr><td>${u.name}</td><td>${u.login}</td><td>${u.role}</td><td><span class="badge">${u.status}</span></td><td><button class="btn secondary" onclick="removeUser(${i})">Supprimer</button></td></tr>`).join("");
 document.getElementById("userCount").textContent=SIGRT.users.length;
}
function openUserForm(){document.getElementById("userForm").style.display="block"}
function closeUserForm(){document.getElementById("userForm").style.display="none"}
function addUser(){
 const name=document.getElementById("newName").value.trim(), login=document.getElementById("newLogin").value.trim();
 if(!name||!login){alert("Veuillez renseigner le nom et l'identifiant.");return}
 SIGRT.users.push({name,login,role:document.getElementById("newRole").value,status:document.getElementById("newStatus").value});
 closeUserForm();renderUsers();
}
function removeUser(i){if(confirm("Supprimer cet utilisateur du prototype ?")){SIGRT.users.splice(i,1);renderUsers()}}
renderApp();
