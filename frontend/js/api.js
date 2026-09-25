/* SIGRT — Couche d'accès aux données
 * Version 1
 * Mode local : stockage dans localStorage
 * Mode API : prévu pour Node.js + PostgreSQL
 */

window.SIGRT_API_STATUS = {
    disponible: false,
    derniereVerification: null,
    erreur: null
};

export async function verifierAPI() {
    try {
        const response = await fetch(SIGRT_CONFIG.baseUrl + "/health", {
            method: "GET",
            cache: "no-store"
        });

        SIGRT_API_STATUS.disponible = response.ok;
        SIGRT_API_STATUS.derniereVerification = new Date().toISOString();
        SIGRT_API_STATUS.erreur = response.ok ? null : "HTTP " + response.status;

        return response.ok;
    } catch (error) {
        SIGRT_API_STATUS.disponible = false;
        SIGRT_API_STATUS.derniereVerification = new Date().toISOString();
        SIGRT_API_STATUS.erreur = error.message;
        return false;
    }
}

window.verifierAPI = verifierAPI;

const SIGRT_CONFIG = {
	mode: "local",
	baseUrl: "http://localhost:4000/api"
};

const STORAGE_KEYS = {
	collaborateurs: "sigrt_collaborateurs",
	utilisateurs: "sigrt_users",
	talents: "sigrt_talents",
	evaluations: "sigrt_evaluations",
	formations: "sigrt_formations",
	retention: "sigrt_retention"
};

function lireLocalStorage(cle) {
	try {
		return JSON.parse(localStorage.getItem(cle)) || [];
	} catch (erreur) {
		console.error(`Erreur de lecture : ${cle}`, erreur);
		return [];
	}
}

function ecrireLocalStorage(cle, donnees) {
	localStorage.setItem(cle, JSON.stringify(donnees));
}

export const Collaborateurs = {
	async lister() {
		if (SIGRT_CONFIG.mode === "local") {
			return lireLocalStorage(STORAGE_KEYS.collaborateurs);
		}

		const response = await fetch(`${SIGRT_CONFIG.baseUrl}/collaborateurs`);
		if (!response.ok) throw new Error("Impossible de récupérer les collaborateurs.");
		return await response.json();
	},

	async creer(collaborateur) {
		if (SIGRT_CONFIG.mode === "local") {
			const liste = lireLocalStorage(STORAGE_KEYS.collaborateurs);
			if (liste.some(c => c.matricule === collaborateur.matricule)) {
				throw new Error(`Le matricule ${collaborateur.matricule} existe déjà.`);
			}
			liste.push(collaborateur);
			ecrireLocalStorage(STORAGE_KEYS.collaborateurs, liste);
			return collaborateur;
		}

		const response = await fetch(`${SIGRT_CONFIG.baseUrl}/collaborateurs`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(collaborateur)
		});
		if (!response.ok) throw new Error("Impossible d'ajouter le collaborateur.");
		return await response.json();
	},

	async modifier(matricule, donnees) {
		if (SIGRT_CONFIG.mode === "local") {
			const liste = lireLocalStorage(STORAGE_KEYS.collaborateurs);
			const index = liste.findIndex(c => c.matricule === matricule);
			if (index === -1) throw new Error("Collaborateur introuvable.");
			liste[index] = { ...liste[index], ...donnees };
			ecrireLocalStorage(STORAGE_KEYS.collaborateurs, liste);
			return liste[index];
		}

		const response = await fetch(`${SIGRT_CONFIG.baseUrl}/collaborateurs/${matricule}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(donnees)
		});
		if (!response.ok) throw new Error("Impossible de modifier le collaborateur.");
		return await response.json();
	},

	async supprimer(matricule) {
		if (SIGRT_CONFIG.mode === "local") {
			const liste = lireLocalStorage(STORAGE_KEYS.collaborateurs);
			ecrireLocalStorage(STORAGE_KEYS.collaborateurs, liste.filter(c => c.matricule !== matricule));
			return true;
		}

		const response = await fetch(`${SIGRT_CONFIG.baseUrl}/collaborateurs/${matricule}`, {
			method: "DELETE"
		});
		if (!response.ok) throw new Error("Impossible de supprimer le collaborateur.");
		return true;
	}
};

function creerModule(cle) {
        const endpoint = SIGRT_CONFIG.baseUrl + "/" + cle;

        return {
                lister() {
                        return lireLocalStorage(STORAGE_KEYS[cle]);
                },

                enregistrer(donnees) {
                        ecrireLocalStorage(STORAGE_KEYS[cle], donnees);
                },

                async synchroniser(donnees) {
                        const response = await fetch(endpoint, {
                                method: "PUT",
                                headers: {
                                        "Content-Type": "application/json"
                                },
                                body: JSON.stringify(donnees)
                        });

                        if (!response.ok) {
                                throw new Error(
                                        "Impossible de synchroniser " + cle + " avec l'API."
                                );
                        }

                        return await response.json();
                }
        };
}
export const Talents = creerModule("talents");
export const Evaluations = creerModule("evaluations");
export const Formations = creerModule("formations");
export const Retention = creerModule("retention");
export const Utilisateurs = creerModule("utilisateurs");


/* =========================================================
   SYNCHRONISATION SIGRT
   Le localStorage reste la source locale principale.
   L'API reçoit une copie lorsque le serveur est disponible.
   ========================================================= */

export async function synchroniserToutesLesDonnees() {
    const collections = [
        "collaborateurs",
        "utilisateurs",
        "talents",
        "evaluations",
        "formations",
        "retention"
    ];

    const resultats = {};

    for (const collection of collections) {
        try {
            const endpoint = SIGRT_CONFIG.baseUrl + "/" + collection;

            const response = await fetch(endpoint, {
                method: "GET",
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(
                    "Impossible de récupérer " +
                    collection +
                    " depuis l'API (HTTP " +
                    response.status +
                    ")."
                );
            }

            const donneesAPI = await response.json();

            const donnees =
                Array.isArray(donneesAPI)
                    ? donneesAPI
                    : Array.isArray(donneesAPI.data)
                        ? donneesAPI.data
                        : [];

            ecrireLocalStorage(
                STORAGE_KEYS[collection],
                donnees
            );

            resultats[collection] = {
                success: true,
                count: donnees.length,
                source: "api"
            };

        } catch (error) {

            resultats[collection] = {
                success: false,
                message: error.message,
                source: "local"
            };
        }
    }

    return resultats;
}

window.synchroniserToutesLesDonnees = synchroniserToutesLesDonnees;
