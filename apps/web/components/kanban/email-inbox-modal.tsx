"use client";

import { useEffect, useState } from "react";
import {
  EmailInteraction,
  fetchRecentEmails,
  simulateIncomingEmail,
  triggerEmailSync,
  JobOffer,
} from "@/lib/api";
import {
  Mail,
  X,
  RefreshCw,
  Sparkles,
  CalendarCheck,
  XCircle,
  CheckCircle2,
  Building2,
  Clock,
  Send,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobOffer[];
  onEmailProcessed?: () => void;
}

export function EmailInboxModal({
  isOpen,
  onClose,
  jobs,
  onEmailProcessed,
}: EmailInboxModalProps) {
  const [emails, setEmails] = useState<EmailInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [showCustomSim, setShowCustomSim] = useState(false);

  // Formulaire simulation personnalisée
  const [sender, setSender] = useState("recrutement@entreprise.com");
  const [subject, setSubject] = useState("Convocation à un entretien technique stage PFE");
  const [body, setBody] = useState(
    "Bonjour, suite à votre candidature, nous souhaitons vous rencontrer en visioconférence pour un échange technique."
  );
  const [companyHint, setCompanyHint] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const data = await fetchRecentEmails(50);
      setEmails(data);
    } catch (err: any) {
      console.error("Erreur chargement emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEmails();
      // Pré-remplir le hint avec la première entreprise soumise si dispo
      const submittedJob = jobs.find((j) => j.status === "SUBMITTED" || j.status === "READY");
      if (submittedJob) {
        setCompanyHint(submittedJob.company);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSync = async () => {
    try {
      setSyncing(true);
      await triggerEmailSync();
      await loadEmails();
      onEmailProcessed?.();
    } catch (err: any) {
      setNotification(err.message || "Erreur de synchronisation.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSimulate = async (customPayload?: {
    sender: string;
    subject: string;
    body: string;
    company_hint?: string;
  }) => {
    try {
      setSimulating(true);
      setNotification(null);
      const payload = customPayload || {
        sender,
        subject,
        body,
        company_hint: companyHint || undefined,
      };
      const res = await simulateIncomingEmail(payload);
      setNotification(
        `Email ingéré avec succès ! Classé en [${res.category}] ${
          res.company_name ? `pour ${res.company_name}` : ""
        }.`
      );
      await loadEmails();
      onEmailProcessed?.();
    } catch (err: any) {
      setNotification(err.message || "Erreur lors de la simulation de l'email.");
    } finally {
      setSimulating(false);
    }
  };

  // Raccourcis de simulation basés sur les offres actuelles
  const activeCompany =
    jobs.find((j) => j.status === "SUBMITTED")?.company ||
    jobs.find((j) => j.status === "READY")?.company ||
    "Airbus";

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "INTERVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-xs">
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            Entretien décroché
          </span>
        );
      case "REJECTION":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
            Non retenu
          </span>
        );
      case "ACKNOWLEDGEMENT":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            Accusé réception
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            Autre
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[90vh] rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4 bg-stone-50/70 dark:bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-display">
                  Boîte de réception des recruteurs
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
                  Synchronisation active
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-serif italic">
                Détection automatique des réponses et mise à jour de vos candidatures.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-stone-500 dark:text-stone-400 ${syncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Synchroniser</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification banner */}
        {notification && (
          <div className="px-6 py-2.5 bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200 dark:border-orange-800 flex items-center justify-between text-xs text-orange-950 dark:text-orange-200 font-medium">
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded text-orange-800 dark:text-orange-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Simulator Sandbox */}
        <div className="p-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 font-mono">
                Ajouter ou tester un email reçu
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomSim(!showCustomSim)}
              className="text-xs text-primary hover:text-orange-700 dark:hover:text-orange-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showCustomSim ? "Masquer le formulaire" : "Saisir un email manuellement"}</span>
              {showCustomSim ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick presets buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={simulating}
              onClick={() =>
                handleSimulate({
                  sender: `recrutement@${activeCompany.toLowerCase().replace(/\s+/g, "")}.com`,
                  subject: `Convocation entretien technique stage PFE - ${activeCompany}`,
                  body: `Bonjour, suite à l'examen attentif de votre candidature pour le stage chez ${activeCompany}, nous avons le plaisir de vous inviter à un premier entretien technique en visio Teams.`,
                  company_hint: activeCompany,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Exemple Entretien ({activeCompany})</span>
            </button>

            <button
              type="button"
              disabled={simulating}
              onClick={() =>
                handleSimulate({
                  sender: `careers@${activeCompany.toLowerCase().replace(/\s+/g, "")}.com`,
                  subject: `Suite candidature stage PFE - ${activeCompany}`,
                  body: `Bonjour, nous vous remercions pour l'intérêt porté à ${activeCompany}. Malgré la qualité de votre profil, nous ne pouvons donner suite favorablement car nous avons choisi un autre profil.`,
                  company_hint: activeCompany,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
              <span>Exemple Réponse Négative ({activeCompany})</span>
            </button>

            <button
              type="button"
              disabled={simulating}
              onClick={() =>
                handleSimulate({
                  sender: "notifications@jobteaser.com",
                  subject: "Candidature transmise avec succès",
                  body: "Votre dossier de candidature a bien été reçu et transmis à l'équipe des ressources humaines.",
                })
              }
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>Exemple Accusé Réception</span>
            </button>
          </div>

          {/* Collapsible custom simulation form */}
          {showCustomSim && (
            <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Expéditeur (Email)
                </label>
                <input
                  type="email"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Entreprise cible (Indice)
                </label>
                <input
                  type="text"
                  value={companyHint}
                  onChange={(e) => setCompanyHint(e.target.value)}
                  placeholder="ex: Airbus, Thales, Instadeep"
                  className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Objet du message
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Corps du message recruteur
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary resize-none font-sans"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => handleSimulate()}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Enregistrer et analyser ce message</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emails List */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span>Historique des messages reçus ({emails.length})</span>
            <span className="font-mono text-[11px]">Plus récents d'abord</span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">Recherche des nouveaux messages...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-12 border border-dashed border-border/60 rounded-xl text-center space-y-2">
              <Mail className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-semibold text-foreground">Aucun message de recruteur pour le moment</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Vos réponses de recruteurs apparaîtront ici et mettront à jour vos candidatures automatiquement.
              </p>
            </div>
          ) : (
            emails.map((email) => {
              const formattedDate = new Date(email.received_at || email.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={email.id}
                  className="p-3.5 rounded-xl border border-border bg-card/90 hover:border-border/80 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(email.category)}
                      {email.company_name && (
                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          {email.company_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-foreground">{email.subject}</h5>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      De : <span className="font-mono">{email.sender}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground leading-relaxed italic">
                    « {email.snippet} »
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
