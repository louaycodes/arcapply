// Utilitaires de traduction sans dépendance React : utilisables depuis lib/api.ts et les composants.

export type Language = "fr" | "en";

export const LANGUAGE_STORAGE_KEY = "arcapply_lang";

/** Renvoie le texte correspondant à la langue. */
export function tr(lang: Language, fr: string, en: string): string {
  return lang === "en" ? en : fr;
}

/** Langue d'interface courante lue depuis le stockage local (repli : français). */
export function getStoredLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "fr";
  } catch {
    return "fr";
  }
}

/** Traduction selon la langue d'interface stockée (code non-React). */
export function trStored(fr: string, en: string): string {
  return tr(getStoredLanguage(), fr, en);
}

// Messages renvoyés en français par le moteur (HTTPException, validation, progression SSE).
// Traduits côté interface en mode anglais ; un message inconnu est affiché tel quel.
const SERVER_MESSAGES_EN: Record<string, string> = {
  "Master Profile introuvable.": "Master Profile not found.",
  "Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.":
    "The AI model ran into a problem. Please try again later.",
  "Directive introuvable": "Directive not found",
  "Complétez votre profil pour générer la lettre.": "Complete your profile to generate the letter.",
  "Le contenu HTML est requis pour la compilation PDF.": "HTML content is required for PDF compilation.",
  "Le fichier transmis est vide.": "The uploaded file is empty.",
  "Utilisateur non identifié": "Unidentified user",
  "Un compte existe déjà avec cette adresse email": "An account already exists with this email address",
  "Session non authentifiée": "Unauthenticated session",
  "Offre introuvable": "Offer not found",
  "Nom d'utilisateur ou mot de passe incorrect": "Incorrect username or password",
  "Le titre de la règle est requis": "The rule title is required",
  "Le mot de passe doit comporter au moins 4 caractères": "The password must be at least 4 characters long",
  "La condition de déclenchement est requise": "The trigger condition is required",
  "La clé d'API Groq ne peut pas être vide.": "The Groq API key cannot be empty.",
  "L'instruction d'action est requise": "The action instruction is required",
  "Dossier d'enquête introuvable pour cette offre": "No investigation file found for this offer",
  "Adresse email invalide": "Invalid email address",
  "Le Master Profile est incomplet. Renseignez vos projets et formations pour générer une lettre factuelle.":
    "The Master Profile is incomplete. Add your projects and education to generate a factual letter.",
  "Le Master Profile est incomplet. Complétez vos formations, expériences et compétences pour générer un CV.":
    "The Master Profile is incomplete. Complete your education, experience and skills to generate a CV.",
  "Le Master Profile est incomplet (CAP-1). Complétez vos informations avant de générer un CV.":
    "The Master Profile is incomplete (CAP-1). Complete your information before generating a CV.",
  "Le Master Profile est incomplet. Complétez les champs obligatoires avant de générer une candidature.":
    "The Master Profile is incomplete. Complete the required fields before generating an application.",
  "Master Profile complet et validé. Génération autorisée.": "Master Profile complete and validated. Generation allowed.",
  "Clé Groq opérationnelle et validée avec succès !": "Groq key working and validated successfully!",
  "Directive supprimée": "Directive deleted",
  // Champs manquants du profil (validation.py)
  "Nom complet (full_name)": "Full name (full_name)",
  "Email valide (email)": "Valid email (email)",
  "Localisation ou numéro de téléphone": "Location or phone number",
  "Au moins une formation avec établissement et diplôme": "At least one education entry with institution and degree",
  "Au moins une expérience ou un projet technique avec description":
    "At least one experience or technical project with a description",
};

const SERVER_PATTERNS_EN: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Offre (.+) introuvable\.$/, (m) => `Offer ${m[1]} not found.`],
  [/^Lettre pour l'offre (.+) introuvable\.$/, (m) => `Letter for offer ${m[1]} not found.`],
  [
    /^Format '(.+)' non supporté\. Choisissez parmi: (.+)\.$/,
    (m) => `Format '${m[1]}' is not supported. Choose from: ${m[2]}.`,
  ],
  [/^Échec de validation de la clé Groq : (.*)$/s, (m) => `Groq key validation failed: ${m[1]}`],
  [
    /^Au moins 3 compétences techniques \(actuellement: (\d+)\)$/,
    (m) => `At least 3 technical skills (currently: ${m[1]})`,
  ],
  [/^Un crawl est déjà en cours d'exécution pour (.+)\.$/, (m) => `A crawl is already running for ${m[1]}.`],
  [/^Scan en cours sur (.+)\.\.\.$/, (m) => `Scanning ${m[1]}...`],
  [/^Démarrage de la collecte sur (.+)\.\.\.$/, (m) => `Starting collection on ${m[1]}...`],
  [/^Collecte achevée sur (.+)\.$/, (m) => `Collection completed on ${m[1]}.`],
  [
    /^(\d+) nouvelle\(s\) opportunité\(s\) découverte\(s\)\.$/,
    (m) => `${m[1]} new opportunit${m[1] === "1" ? "y" : "ies"} discovered.`,
  ],
  [
    /^Collecte multi-sources achevée : (\d+) nouvelles offres intégrées\.$/,
    (m) => `Multi-source collection completed: ${m[1]} new offers added.`,
  ],
  [/^Boîte de réception synchronisée avec succès pour (.+)\.$/, (m) => `Inbox synchronized successfully for ${m[1]}.`],
  [/^Agent Deep Recon déployé sur l'offre '(.+)' chez (.+)$/, (m) => `Deep Recon agent deployed on '${m[1]}' at ${m[2]}`],
  [
    /^Toutes les offres de (.+?) (?:et documents associés )?ont été supprimées avec succès\.$/,
    (m) => `All offers of ${m[1]} were deleted successfully.`,
  ],
];

/** Traduit un message du moteur en anglais si l'interface est en anglais. */
export function localizeServerMessage<T extends string | null | undefined>(message: T): T {
  if (!message || typeof message !== "string" || getStoredLanguage() !== "en") return message;
  const exact = SERVER_MESSAGES_EN[message];
  if (exact) return exact as T;
  for (const [pattern, build] of SERVER_PATTERNS_EN) {
    const match = message.match(pattern);
    if (match) return build(match) as T;
  }
  return message;
}
