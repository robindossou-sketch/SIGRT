const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

const DATA_FILE = path.join(__dirname, "data", "sigrt-data.json");

function sauvegarderDonnees() {
    const donnees = {
        collaborateurs,
        utilisateurs,
        talents,
        evaluations,
        formations,
        retention,
        audit
    };

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(donnees, null, 2),
        "utf-8"
    );
}

function chargerDonnees() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return;
        }

        const donnees = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf-8")
        );

        if (Array.isArray(donnees.collaborateurs)) {
            collaborateurs = donnees.collaborateurs;
        }

        if (Array.isArray(donnees.utilisateurs)) {
            utilisateurs = donnees.utilisateurs;
        }

        if (Array.isArray(donnees.talents)) {
            talents = donnees.talents;
        }

        if (Array.isArray(donnees.evaluations)) {
            evaluations = donnees.evaluations;
        }

        if (Array.isArray(donnees.formations)) {
            formations = donnees.formations;
        }

        if (Array.isArray(donnees.retention)) {
            retention = donnees.retention;
        }

        if (Array.isArray(donnees.audit)) {
            audit = donnees.audit;
        }

        console.log("SIGRT — données locales chargées.");
    } catch (erreur) {
        console.error(
            "SIGRT — impossible de charger les données locales :",
            erreur.message
        );
    }
}

app.use(cors());
app.use(express.json());

/*
 * Données temporaires
 * Elles seront remplacées par PostgreSQL plus tard.
 */
let talents = [];
let evaluations = [];
let formations = [];
let retention = [];
let utilisateurs = [];
let audit = [];

let collaborateurs = [
    {
        matricule: "COL-0001",
        name: "Exemple Collaborateur",
        birth: "",
        sex: "Non renseigné",
        phone: "",
        email: "",
        dept: "Ressources Humaines",
        post: "Assistant RH",
        contract: "CDI",
        hire: "2024-01-15",
        status: "Actif",
        manager: "Direction RH",
        skills: "Administration RH, Excel, reporting",
        potential: "À évaluer",
        notes: ""
    }
];

/*
 * Test de fonctionnement de l'API
 */
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "API SIGRT opérationnelle",
        date: new Date().toISOString()
    });
});

/*
 * GET — Liste des collaborateurs
 */
app.get("/api/collaborateurs", (req, res) => {
    res.json(collaborateurs);
});

/*
 * POST — Créer un collaborateur
 */
app.post("/api/collaborateurs", (req, res) => {
    const nouveauCollaborateur = req.body;

    if (!nouveauCollaborateur.matricule) {
        return res.status(400).json({
            message: "Le matricule est obligatoire."
        });
    }

    const existe = collaborateurs.some(
        collaborateur =>
            collaborateur.matricule === nouveauCollaborateur.matricule
    );

    if (existe) {
        return res.status(409).json({
            message: `Le matricule ${nouveauCollaborateur.matricule} existe déjà.`
        });
    }

    collaborateurs.push(nouveauCollaborateur);
    sauvegarderDonnees();

    res.status(201).json(nouveauCollaborateur);
});

/*
 * PUT — Modifier un collaborateur
 */
app.put("/api/collaborateurs/:matricule", (req, res) => {
    const matricule = req.params.matricule;

    const index = collaborateurs.findIndex(
        collaborateur => collaborateur.matricule === matricule
    );

    if (index === -1) {
        return res.status(404).json({
            message: "Collaborateur introuvable."
        });
    }

    collaborateurs[index] = {
        ...collaborateurs[index],
        ...req.body
    };

    sauvegarderDonnees();

    res.json(collaborateurs[index]);
});

/*
 * PUT — Synchroniser toute la collection des collaborateurs
 */
app.get("/api/audit", (req, res) => {
    res.json(audit);
});

app.post("/api/audit", (req, res) => {
    const entree = req.body;

    if (!entree || typeof entree !== "object") {
        return res.status(400).json({
            success: false,
            message: "Entrée d'audit invalide."
        });
    }

    const nouvelleEntree = {
        id: Date.now(),
        date: new Date().toISOString(),
        utilisateur: entree.utilisateur || "Système",
        role: entree.role || "",
        action: entree.action || "",
        module: entree.module || "",
        cible: entree.cible || "",
        details: entree.details || ""
    };

    audit.push(nouvelleEntree);
    sauvegarderDonnees();

    res.status(201).json({
        success: true,
        data: nouvelleEntree
    });
});

app.put("/api/collaborateurs", (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({
            success: false,
            message: "Les données des collaborateurs doivent être un tableau."
        });
    }

    collaborateurs = req.body;
    sauvegarderDonnees();

    res.json({
        success: true,
        data: collaborateurs,
        count: collaborateurs.length
    });
});

/*
 * DELETE — Supprimer un collaborateur
 */
app.delete("/api/collaborateurs/:matricule", (req, res) => {
    const matricule = req.params.matricule;

    const existe = collaborateurs.some(
        collaborateur => collaborateur.matricule === matricule
    );

    if (!existe) {
        return res.status(404).json({
            message: "Collaborateur introuvable."
        });
    }

    collaborateurs = collaborateurs.filter(
        collaborateur => collaborateur.matricule !== matricule
    );

    sauvegarderDonnees();

    res.json({
        success: true,
        message: "Collaborateur supprimé."
    });
});


/*
 * Routes API — Modules RH
 */

const modules = {
    talents: () => talents,
    evaluations: () => evaluations,
    formations: () => formations,
    retention: () => retention,
    utilisateurs: () => utilisateurs
};

Object.entries(modules).forEach(([nom, getDonnees]) => {
    app.get(`/api/${nom}`, (req, res) => {
        res.json(getDonnees());
    });

    app.put(`/api/${nom}`, (req, res) => {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: `Les données de ${nom} doivent être un tableau.`
            });
        }

        if (nom === "talents") talents = req.body;
        if (nom === "evaluations") evaluations = req.body;
        if (nom === "formations") formations = req.body;
        if (nom === "retention") retention = req.body;
        if (nom === "utilisateurs") utilisateurs = req.body;

        sauvegarderDonnees();

        res.json({
            success: true,
            data: getDonnees()
        });
    });
});

/*
 * Chargement des données persistantes
 */
chargerDonnees();

/*
 * Démarrage du serveur
 */
app.listen(PORT, () => {
    console.log(`SIGRT API démarrée sur http://localhost:${PORT}`);
});
