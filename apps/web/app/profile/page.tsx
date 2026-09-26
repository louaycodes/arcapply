"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fetchProfile,
  updateProfile,
  fetchProfileStatus,
  verifyGenerationEligibility,
  MasterProfile,
  ProfileCompletenessStatus,
  Education,
  Experience,
  Project,
  Skill,
} from "@/lib/api";
import {
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Code2,
  User,
  Plus,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [status, setStatus] = useState<ProfileCompletenessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [testGenResult, setTestGenResult] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [profileData, statusData] = await Promise.all([
        fetchProfile(),
        fetchProfileStatus(),
      ]);
      setProfile(profileData);
      setStatus(statusData);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Erreur de connexion avec le moteur backend.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      const updated = await updateProfile(profile);
      const newStatus = await fetchProfileStatus();
      setProfile(updated);
      setStatus(newStatus);
      setNotification({
        type: "success",
        message: "Master Profile synchronisé et sauvegardé avec succès en base SQLite souveraine.",
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Échec de la sauvegarde.",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleTestGeneration = async () => {
    try {
      setTestGenResult("Vérification en cours...");
      const result = await verifyGenerationEligibility();
      setTestGenResult(`✓ Succès : ${result.message} (${result.completion_percentage}%)`);
    } catch (err: any) {
      setTestGenResult(`✕ Bloqué (CAP-1) : ${err.message}`);
    }
  };

  const populateDemoProfile = () => {
    if (!profile) return;
    const demo: MasterProfile = {
      ...profile,
      full_name: "Yassine Ben Salem",
      email: "yassine.bensalem@insat.u-carthage.tn",
      phone: "+33 6 42 18 90 12",
      location: "Paris, France / Tunis, Tunisie",
      headline: "Élève-Ingénieur Systèmes Distribués & Cloud | Recherche PFE Janvier 2027",
      bio: "Futur ingénieur diplômé passionné par la scalabilité, les architectures hexagonales et le DevOps moderne. Expérience concrète sur FastAPI, Go, Docker et Kubernetes.",
      linkedin_url: "https://linkedin.com/in/yassine-bensalem",
      github_url: "https://github.com/yassine-bs",
      website_url: "https://yassine.dev",
      educations: [
        {
          school: "INSAT (Institut National des Sciences Appliquées et de Technologie)",
          degree: "Diplôme National d'Ingénieur",
          field_of_study: "Génie Logiciel & Informatique",
          start_date: "Septembre 2022",
          end_date: "Juin 2027",
          description: "Formation d'excellence en génie logiciel, réseaux, bases de données avancées et systèmes distribués.",
        },
      ],
      experiences: [
        {
          company: "CloudScale Technologies",
          role: "Stagiaire Ingénieur Backend",
          location: "Tunis / Hybride",
          start_date: "Juin 2025",
          end_date: "Août 2025",
          description: "Développement de microservices de traitement asynchrone d'événements à haut débit. Optimisation du temps de réponse de 35%.",
          technologies: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
        },
      ],
      projects: [
        {
          title: "ArcApply Local Copilot",
          role: "Architecte & Développeur Principal",
          description: "Copilote de candidature haute performance avec matching d'offres déterministe et adaptation de CV sans hallucination.",
          url: "https://github.com/yassine-bs/arcapply",
          technologies: ["FastAPI", "SQLModel", "Next.js", "Tailwind CSS"],
        },
      ],
      skills: [
        { name: "Python", category: "Languages", level: "Avancé" },
        { name: "FastAPI", category: "Frameworks", level: "Avancé" },
        { name: "TypeScript", category: "Languages", level: "Intermédiaire" },
        { name: "Next.js", category: "Frameworks", level: "Intermédiaire" },
        { name: "Docker", category: "DevOps", level: "Avancé" },
        { name: "SQL / SQLite", category: "Database", level: "Avancé" },
      ],
    };
    setProfile(demo);
    setNotification({
      type: "info",
      message: "Modèle de profil PFE injecté ! Cliquez sur 'Sauvegarder les modifications' pour valider la complétude.",
    });
  };

  // Education Helpers
  const addEducation = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      educations: [
        ...profile.educations,
        {
          school: "",
          degree: "",
          field_of_study: "",
          start_date: "",
          end_date: "",
          description: "",
        },
      ],
    });
  };

  const removeEducation = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      educations: profile.educations.filter((_, i) => i !== index),
    });
  };

  // Experience Helpers
  const addExperience = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      experiences: [
        ...profile.experiences,
        {
          company: "",
          role: "",
          location: "",
          start_date: "",
          end_date: "",
          description: "",
          technologies: [],
        },
      ],
    });
  };

  const removeExperience = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      experiences: profile.experiences.filter((_, i) => i !== index),
    });
  };

  // Project Helpers
  const addProject = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      projects: [
        ...profile.projects,
        {
          title: "",
          role: "",
          description: "",
          url: "",
          technologies: [],
        },
      ],
    });
  };

  const removeProject = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, i) => i !== index),
    });
  };

  // Skill Helpers
  const addSkill = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      skills: [
        ...profile.skills,
        { name: "", category: "Technologies", level: "Intermédiaire" },
      ],
    });
  };

  const removeSkill = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">Chargement du Master Profile souverain...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive">
          <h2 className="text-lg font-bold mb-2">Erreur de chargement</h2>
          <p className="text-sm mb-4">Impossible de joindre le moteur local SQLite (`~/.arcapply/arcapply.db`). Assurez-vous que le backend FastAPI est actif.</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-md bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const isComplete = status?.is_complete ?? false;
  const percentage = status?.completion_percentage ?? 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Master Profile
            </h1>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Socle Immuable
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Source unique et souveraine de vérité. Aucune compétence en dehors de ce profil ne sera générée.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={populateDemoProfile}
            className="px-3.5 py-2 rounded-md border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-2 transition-colors"
            title="Remplir avec des données de test réalistes pour valider immédiatement le profil"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Exemple PFE</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-lg border text-sm flex items-center gap-3 transition-all ${
            notification.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : notification.type === "error"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-primary/10 border-primary/30 text-primary"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Guard Status Banner (CAP-1 Complétude) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-xl border border-border bg-card/80 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isComplete ? (
                <div className="w-10 h-10 rounded-lg bg-success/20 border border-success/40 flex items-center justify-center text-success">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-warning/20 border border-warning/40 flex items-center justify-center text-warning">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Garde-fou Zéro-Hallucination (CAP-1)</span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      isComplete
                        ? "bg-success/15 text-success border border-success/30"
                        : "bg-warning/15 text-warning border border-warning/30"
                    }`}
                  >
                    {isComplete ? "Débloqué (Prêt)" : "Bloqué (Incomplet)"}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isComplete
                    ? "Toutes les conditions de validation sont remplies. La génération de CV et de lettre est autorisée."
                    : "La génération de candidatures est strictement verrouillée tant que le profil n'est pas exhaustif."}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-foreground">{percentage}%</span>
              <p className="text-[11px] text-muted-foreground font-mono">Complétude</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/40">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                percentage === 100
                  ? "bg-success shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : percentage > 50
                  ? "bg-warning"
                  : "bg-destructive"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Missing fields list */}
          {!isComplete && status && status.missing_fields.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Éléments requis manquants pour débloquer la génération :
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {status.missing_fields.map((field, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-warning/90 bg-warning/5 px-2.5 py-1.5 rounded border border-warning/20"
                  >
                    <ArrowRight className="w-3 h-3 text-warning flex-shrink-0" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Verification Trigger Card */}
        <div className="p-6 rounded-xl border border-border bg-card/80 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span>Test du Garde-Fou CAP-1</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Interroge l'endpoint moteur <code className="font-mono text-primary text-[11px]">POST /api/profile/can-generate</code> pour certifier le blocage ou le déblocage en direct.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleTestGeneration}
              className="w-full py-2 px-3 rounded-md border border-border bg-muted/70 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              Tester l'autorisation de génération
            </button>

            {testGenResult && (
              <div
                className={`p-2.5 rounded text-[11px] font-mono border ${
                  testGenResult.startsWith("✓")
                    ? "bg-success/10 border-success/30 text-success"
                    : testGenResult.startsWith("✕")
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-muted border-border text-foreground"
                }`}
              >
                {testGenResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form Sections */}
      <div className="space-y-8">
        {/* Section 1: Identité & Coordonnées */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center gap-3 border-b border-border/50 pb-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Identité & Coordonnées</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Nom complet *
              </label>
              <input
                type="text"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="ex: Alexandre Dupont"
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Email de contact *
              </label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="ex: contact@etudiant.fr"
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="ex: +33 6 12 34 56 78"
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Localisation (Cible PFE) *
              </label>
              <input
                type="text"
                value={profile.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="ex: Paris, France / Tunis, Tunisie"
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Titre professionnel / Accroche
              </label>
              <input
                type="text"
                value={profile.headline || ""}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                placeholder="ex: Élève-ingénieur Systèmes Distribués & Cloud | Recherche Stage PFE 2027"
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Bio / Synthèse de parcours
              </label>
              <textarea
                rows={3}
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Présentation synthétique et factuelle de vos objectifs d'ingénierie..."
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Lien LinkedIn
              </label>
              <input
                type="url"
                value={profile.linkedin_url || ""}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Lien GitHub
              </label>
              <input
                type="url"
                value={profile.github_url || ""}
                onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                placeholder="https://github.com/..."
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Formations */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Formations Académiques</h2>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une formation</span>
            </button>
          </div>

          {profile.educations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucune formation enregistrée. Au moins une formation est requise pour valider le profil.
            </p>
          ) : (
            <div className="space-y-4">
              {profile.educations.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-primary">Formation #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeEducation(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Établissement / École *"
                      value={edu.school}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].school = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Diplôme préparé *"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].degree = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Filière / Spécialité"
                      value={edu.field_of_study}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].field_of_study = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Année début"
                      value={edu.start_date}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].start_date = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Année fin (ou prévision PFE)"
                      value={edu.end_date || ""}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].end_date = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Détails académiques"
                      value={edu.description || ""}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].description = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Expériences Professionnelles */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Expériences & Stages</h2>
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une expérience</span>
            </button>
          </div>

          {profile.experiences.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucune expérience renseignée.
            </p>
          ) : (
            <div className="space-y-4">
              {profile.experiences.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-primary">Expérience #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Entreprise *"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...profile.experiences];
                        updated[idx].company = e.target.value;
                        setProfile({ ...profile, experiences: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Poste / Rôle *"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...profile.experiences];
                        updated[idx].role = e.target.value;
                        setProfile({ ...profile, experiences: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Ville, Pays"
                      value={exp.location || ""}
                      onChange={(e) => {
                        const updated = [...profile.experiences];
                        updated[idx].location = e.target.value;
                        setProfile({ ...profile, experiences: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Date début"
                      value={exp.start_date}
                      onChange={(e) => {
                        const updated = [...profile.experiences];
                        updated[idx].start_date = e.target.value;
                        setProfile({ ...profile, experiences: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Date fin"
                      value={exp.end_date || ""}
                      onChange={(e) => {
                        const updated = [...profile.experiences];
                        updated[idx].end_date = e.target.value;
                        setProfile({ ...profile, experiences: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Technologies (séparées par des virgules)"
                      value={exp.technologies ? exp.technologies.join(", ") : ""}
                      onChange={(e) => {
                        const updated = [...profile.experiences];
                        updated[idx].technologies = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        setProfile({ ...profile, experiences: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description concrète des réalisations d'ingénierie et impact mesurable *"
                    value={exp.description}
                    onChange={(e) => {
                      const updated = [...profile.experiences];
                      updated[idx].description = e.target.value;
                      setProfile({ ...profile, experiences: updated });
                    }}
                    className="w-full px-3 py-2 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Projets Techniques */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Projets Techniques Significatifs</h2>
            </div>
            <button
              type="button"
              onClick={addProject}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un projet</span>
            </button>
          </div>

          {profile.projects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucun projet enregistré.
            </p>
          ) : (
            <div className="space-y-4">
              {profile.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-primary">Projet #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeProject(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Titre du projet *"
                      value={proj.title}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].title = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Lien / Dépôt (URL)"
                      value={proj.url || ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].url = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Technologies clés (ex: Docker, Python)"
                      value={proj.technologies ? proj.technologies.join(", ") : ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].technologies = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description de l'architecture, de la problématique résolue et des performances *"
                    value={proj.description}
                    onChange={(e) => {
                      const updated = [...profile.projects];
                      updated[idx].description = e.target.value;
                      setProfile({ ...profile, projects: updated });
                    }}
                    className="w-full px-3 py-2 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Compétences Techniques */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Compétences Techniques Réelles</h2>
            </div>
            <button
              type="button"
              onClick={addSkill}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une compétence</span>
            </button>
          </div>

          {profile.skills.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucune compétence renseignée. Au moins 3 compétences techniques sont requises.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {profile.skills.map((skill, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/70 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nom (ex: Python) *"
                    value={skill.name}
                    onChange={(e) => {
                      const updated = [...profile.skills];
                      updated[idx].name = e.target.value;
                      setProfile({ ...profile, skills: updated });
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <select
                    value={skill.category}
                    onChange={(e) => {
                      const updated = [...profile.skills];
                      updated[idx].category = e.target.value;
                      setProfile({ ...profile, skills: updated });
                    }}
                    className="px-2 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Languages">Languages</option>
                    <option value="Frameworks">Frameworks</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Database">Database</option>
                    <option value="Tools">Outils</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
