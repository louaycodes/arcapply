"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchProfile,
  updateProfile,
  fetchProfileStatus,
  verifyGenerationEligibility,
  downloadProfileCVPdf,
  testGroqKey,
  MasterProfile,
  ProfileCompletenessStatus,
  Education,
  Experience,
  Project,
  Skill,
  Language,
  Extracurricular,
  SKILL_CATEGORIES,
  skillCategoryLabel,
} from "@/lib/api";
import { useAppLanguage } from "@/lib/language-context";
import { localizeServerMessage } from "@/lib/i18n";
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
  Download,
  FileDown,
  Globe2,
  Award,
  Layers,
  ExternalLink,
  Check,
  X,
  Compass,
  Key,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

function StackInput({
  value = [],
  onChange,
  placeholder,
  className = "px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary",
}: {
  value?: string[];
  onChange: (techs: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useAppLanguage();
  const [text, setText] = useState<string>((value || []).join(", "));

  // Synchronise le texte lorsque la valeur externe change (ex: chargement API ou switch de profil)
  useEffect(() => {
    const currentParsed = text
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const incoming = value || [];
    if (JSON.stringify(currentParsed) !== JSON.stringify(incoming)) {
      setText(incoming.join(", "));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    const parsed = newText
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = text
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setText(parsed.join(", "));
  };

  return (
    <input
      type="text"
      placeholder={placeholder ?? t("Technologies / Stack (ex: Python, Docker, AWS)", "Technologies / Stack (e.g. Python, Docker, AWS)")}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

export default function ProfilePage() {
  const { language: appLanguage, t } = useAppLanguage();
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [status, setStatus] = useState<ProfileCompletenessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingCv, setIsDownloadingCv] = useState(false);
  const [cvDownloadLang, setCvDownloadLang] = useState<"fr" | "en">(appLanguage);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{ status: "idle" | "success" | "error"; message?: string }>({ status: "idle" });
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [testGenResult, setTestGenResult] = useState<string | null>(null);
  const [testGenKind, setTestGenKind] = useState<"pending" | "success" | "blocked">("pending");

  useEffect(() => {
    setCvDownloadLang(appLanguage);
  }, [appLanguage]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [profileData, statusData] = await Promise.all([
        fetchProfile(),
        fetchProfileStatus(),
      ]);
      setProfile({
        ...profileData,
        languages: profileData.languages || [],
        extracurriculars: profileData.extracurriculars || [],
        experiences: profileData.experiences || [],
        educations: profileData.educations || [],
        projects: profileData.projects || [],
        skills: profileData.skills || [],
      });
      setStatus(statusData);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || t("Erreur de connexion avec le moteur backend.", "Connection error with the backend engine."),
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
      const profileToSave: MasterProfile = {
        ...profile,
        headline: profile.headline || profile.headline_fr,
        headline_fr: profile.headline_fr || profile.headline,
        bio: profile.bio || profile.bio_fr,
        bio_fr: profile.bio_fr || profile.bio,
      };
      const updated = await updateProfile(profileToSave);
      const newStatus = await fetchProfileStatus();
      setProfile({
        ...updated,
        languages: updated.languages || [],
        extracurriculars: updated.extracurriculars || [],
        experiences: updated.experiences || [],
        educations: updated.educations || [],
        projects: updated.projects || [],
        skills: updated.skills || [],
      });
      setStatus(newStatus);
      setNotification({
        type: "success",
        message: t("Votre profil a été enregistré avec succès.", "Your profile was saved successfully."),
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || t("Échec de la sauvegarde.", "Save failed."),
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleTestGeneration = async () => {
    try {
      setTestGenKind("pending");
      setTestGenResult(t("Vérification en cours...", "Checking..."));
      const result = await verifyGenerationEligibility();
      setTestGenKind("success");
      setTestGenResult(
        t(
          `Succès : ${result.message} (${result.completion_percentage}%)`,
          `Success: ${localizeServerMessage(result.message)} (${result.completion_percentage}%)`
        )
      );
    } catch (err: any) {
      setTestGenKind("blocked");
      setTestGenResult(t(`Bloqué (CAP-1) : ${err.message}`, `Blocked (CAP-1): ${err.message}`));
    }
  };

  const handleDownloadCV = async () => {
    if (!profile) return;
    try {
      setIsDownloadingCv(true);
      // Sauvegarde automatique préalable pour garantir que tous les champs saisis sont pris en compte
      const profileToSave: MasterProfile = {
        ...profile,
        headline: profile.headline || profile.headline_fr,
        headline_fr: profile.headline_fr || profile.headline,
        bio: profile.bio || profile.bio_fr,
        bio_fr: profile.bio_fr || profile.bio,
      };
      await updateProfile(profileToSave);
      const blob = await downloadProfileCVPdf(cvDownloadLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (profile.full_name.trim() || "Candidat").replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, "_");
      a.download = `CV_${cleanName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setNotification({
        type: "success",
        message: t("Votre CV complet a été téléchargé avec succès (format PDF A4 vectoriel) !", "Your complete CV was downloaded successfully (A4 vector PDF)!"),
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || t("Échec du téléchargement du CV.", "CV download failed."),
      });
    } finally {
      setIsDownloadingCv(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const populateDemoProfile = () => {
    if (!profile) return;
    const demo: MasterProfile = {
      ...profile,
      search_mode: "PFE",
      full_name: "Yassine Ben Salem",
      email: "yassine.bensalem@insat.u-carthage.tn",
      phone: "+33 6 42 18 90 12",
      location: "Paris, France / Tunis, Tunisie",
      headline: "Élève-Ingénieur Systèmes Distribués & Cloud | Recherche PFE Janvier 2027",
      headline_fr: "Élève-Ingénieur Systèmes Distribués & Cloud | Recherche PFE Janvier 2027",
      headline_en: "Distributed Systems & Cloud Engineering Student | Seeking Final Internship Jan 2027",
      bio: "Futur ingénieur diplômé passionné par la scalabilité, les architectures hexagonales et le DevOps moderne. Expérience concrète sur FastAPI, Go, Docker et Kubernetes.",
      bio_fr: "Futur ingénieur diplômé passionné par la scalabilité, les architectures hexagonales et le DevOps moderne. Expérience concrète sur FastAPI, Go, Docker et Kubernetes.",
      bio_en: "Graduating software engineer passionate about distributed scalability, hexagonal architecture, and modern DevOps. Hands-on experience with FastAPI, Go, Docker, and Kubernetes.",
      linkedin_url: "https://linkedin.com/in/yassine-bensalem",
      github_url: "https://github.com/yassine-bs",
      website_url: "https://yassine.dev",
      educations: [
        {
          school: "INSAT (Institut National des Sciences Appliquées et de Technologie)",
          degree: "Diplôme National d'Ingénieur",
          degree_fr: "Diplôme National d'Ingénieur",
          degree_en: "Master of Science in Software Engineering",
          field_of_study: "Génie Logiciel & Informatique",
          field_of_study_fr: "Génie Logiciel & Informatique",
          field_of_study_en: "Software Engineering & Computer Science",
          start_date: "Septembre 2022",
          end_date: "Juin 2027",
          description: "Formation d'excellence en génie logiciel, réseaux, bases de données avancées et systèmes distribués.",
          description_fr: "Formation d'excellence en génie logiciel, réseaux, bases de données avancées et systèmes distribués.",
          description_en: "Elite engineering curriculum focusing on software architecture, computer networks, advanced databases, and distributed systems.",
        },
      ],
      experiences: [
        {
          company: "CloudScale Technologies",
          role: "Stagiaire Ingénieur Backend & Cloud",
          role_fr: "Stagiaire Ingénieur Backend & Cloud",
          role_en: "Backend & Cloud Engineering Intern",
          location: "Tunis / Hybride",
          start_date: "Juin 2025",
          end_date: "Août 2025",
          description: "Développement de microservices de traitement asynchrone d'événements à haut débit. Optimisation du temps de réponse de 35%.",
          description_fr: "Développement de microservices de traitement asynchrone d'événements à haut débit. Optimisation du temps de réponse de 35%.",
          description_en: "Built asynchronous event processing microservices handling high throughput. Improved average response latency by 35%.",
          technologies: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
          experience_type: "stage",
        },
        {
          company: "FinTech Innovation Lab",
          role: "Stagiaire Développeur Outils & DevOps",
          role_fr: "Stagiaire Développeur Outils & DevOps",
          role_en: "DevOps & Tools Engineering Intern",
          location: "Tunis, Tunisie",
          start_date: "Juin 2024",
          end_date: "Août 2024",
          description: "Automatisation des pipelines CI/CD sous Jenkins et conteneurisation des services financiers internes avec Docker.",
          description_fr: "Automatisation des pipelines CI/CD sous Jenkins et conteneurisation des services financiers internes avec Docker.",
          description_en: "Automated Jenkins CI/CD release pipelines and containerized internal financial services with Docker.",
          technologies: ["Docker", "Linux", "Bash", "Jenkins", "GitLab CI"],
          experience_type: "stage",
        },
        {
          company: "TechConsulting Freelance",
          role: "Développeur Backend & Automatisation",
          role_fr: "Développeur Backend & Automatisation",
          role_en: "Backend & Automation Engineer",
          location: "Télétravail / France & Tunisie",
          start_date: "Septembre 2024",
          end_date: "Présent",
          description: "Conception d'APIs REST modulaires et dashboards de monitoring pour des PME européennes.",
          description_fr: "Conception d'APIs REST modulaires et dashboards de monitoring pour des PME européennes.",
          description_en: "Architected modular REST APIs and automated observability dashboards for European scale-ups.",
          technologies: ["FastAPI", "TypeScript", "Next.js", "Docker"],
          experience_type: "job",
        },
      ],
      projects: [
        {
          title: "ArcApply Local Copilot",
          title_fr: "ArcApply Copilote Local",
          title_en: "ArcApply Local Copilot",
          role: "Architecte & Développeur Principal",
          role_fr: "Architecte & Développeur Principal",
          role_en: "Lead Architect & Developer",
          description: "Copilote de candidature haute performance avec matching d'offres déterministe et adaptation de CV sans hallucination.",
          description_fr: "Copilote de candidature haute performance avec matching d'offres déterministe et adaptation de CV sans hallucination.",
          description_en: "High-performance job application copilot featuring deterministic ATS matching and zero-hallucination CV tailoring.",
          url: "https://github.com/yassine-bs/arcapply",
          technologies: ["FastAPI", "SQLModel", "Next.js", "Tailwind CSS"],
        },
        {
          title: "Autonomous FinOps Agent",
          title_fr: "Agent FinOps Autonome",
          title_en: "Autonomous FinOps Agent",
          role: "Lead Developer",
          role_fr: "Lead Développeur",
          role_en: "Lead Developer",
          description: "Plateforme multi-agents pour la détection d'anomalies de coûts AWS et l'optimisation continue des ressources cloud.",
          description_fr: "Plateforme multi-agents pour la détection d'anomalies de coûts AWS et l'optimisation continue des ressources cloud.",
          description_en: "Multi-agent engine detecting AWS cost anomalies and dynamically optimizing cloud resources.",
          url: "https://github.com/yassine-bs/finops-agent",
          technologies: ["Python", "LangGraph", "Groq LLM", "ChromaDB"],
        },
      ],
      skills: [
        { name: "FastAPI", category: "Frameworks", level: "Avancé" },
        { name: "React / Next.js", category: "Frameworks", level: "Avancé" },
        { name: "Python", category: "Langages & Scripting", level: "Avancé" },
        { name: "TypeScript", category: "Langages & Scripting", level: "Intermédiaire" },
        { name: "Bash", category: "Langages & Scripting", level: "Avancé" },
        { name: "PostgreSQL", category: "Bases de données", level: "Avancé" },
        { name: "Redis", category: "Bases de données", level: "Intermédiaire" },
        { name: "Git", category: "Versioning & Méthodes", level: "Avancé" },
        { name: "Scrum / Agile", category: "Versioning & Méthodes", level: "Avancé" },
        { name: "Linux (Debian/Ubuntu)", category: "Systèmes & Réseaux", level: "Avancé" },
        { name: "TCP/IP & DNS", category: "Systèmes & Réseaux", level: "Intermédiaire" },
        { name: "Prometheus", category: "Monitoring & Observabilité", level: "Intermédiaire" },
        { name: "Grafana", category: "Monitoring & Observabilité", level: "Intermédiaire" },
        { name: "Terraform", category: "Infrastructure as Code", level: "Intermédiaire" },
        { name: "Ansible", category: "Infrastructure as Code", level: "Intermédiaire" },
        { name: "AWS (EC2, S3, RDS)", category: "Cloud & Infrastructure", level: "Intermédiaire" },
        { name: "Docker & Compose", category: "Conteneurisation & Orchestration", level: "Avancé" },
        { name: "Kubernetes", category: "Conteneurisation & Orchestration", level: "Intermédiaire" },
        { name: "OWASP Top 10", category: "Sécurité (DevSecOps)", level: "Intermédiaire" },
        { name: "Trivy / SonarQube", category: "Sécurité (DevSecOps)", level: "Intermédiaire" },
      ],
      extracurriculars: [
        {
          organization: "Club Robotique & IA INSAT",
          role: "Responsable Technique & Formateur",
          role_fr: "Responsable Technique & Formateur",
          role_en: "Technical Lead & Instructor",
          date: "2023 – 2024",
          description: "Animation d'ateliers d'initiation à Python et aux systèmes embarqués pour 60+ étudiants ; finaliste TuniRobots 2024.",
          description_fr: "Animation d'ateliers d'initiation à Python et aux systèmes embarqués pour 60+ étudiants ; finaliste TuniRobots 2024.",
          description_en: "Conducted hands-on robotics and Python workshops for 60+ engineering students; finalist at TuniRobots 2024.",
        },
        {
          organization: "Junior Entreprise INSAT",
          role: "Chef de Projet Digital",
          role_fr: "Chef de Projet Digital",
          role_en: "Digital Project Manager",
          date: "2022 – 2023",
          description: "Coordination d'une équipe de 5 développeurs pour la digitalisation de processus opérationnels d'entreprises partenaires.",
          description_fr: "Coordination d'une équipe de 5 développeurs pour la digitalisation de processus opérationnels d'entreprises partenaires.",
          description_en: "Managed a team of 5 student developers building digital tools and process automations for corporate partners.",
        },
      ],
      languages: [
        { name: "Français", level: "Courant / Bilingue (C2)" },
        { name: "Anglais", level: "Professionnel / Technique (C1 - TOEIC 945)" },
        { name: "Arabe", level: "Langue maternelle" },
      ],
    };
    setProfile(demo);
    setNotification({
      type: "info",
      message: t(
        "Modèle de profil complet et bilingue injecté ! Cliquez sur 'Sauvegarder' pour valider.",
        "Complete bilingual sample profile filled in! Click 'Save' to confirm."
      ),
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
          degree_fr: "",
          degree_en: "",
          field_of_study: "",
          field_of_study_fr: "",
          field_of_study_en: "",
          start_date: "",
          end_date: "",
          description: "",
          description_fr: "",
          description_en: "",
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

  // Stages & Expériences Helpers (séparation demandée par l'utilisateur)
  const stages = (profile?.experiences || []).filter(
    (exp) => (exp.experience_type || "stage") === "stage"
  );
  const jobs = (profile?.experiences || []).filter(
    (exp) => exp.experience_type === "job"
  );

  const addStage = () => {
    if (!profile) return;
    const newStage: Experience = {
      company: "",
      role: "",
      role_fr: "",
      role_en: "",
      location: "",
      start_date: "",
      end_date: "",
      description: "",
      description_fr: "",
      description_en: "",
      technologies: [],
      experience_type: "stage",
    };
    setProfile({
      ...profile,
      experiences: [...profile.experiences, newStage],
    });
  };

  const updateStage = (stageIdx: number, updatedStage: Experience) => {
    if (!profile) return;
    let count = 0;
    const newExperiences = profile.experiences.map((exp) => {
      if ((exp.experience_type || "stage") === "stage") {
        if (count === stageIdx) {
          count++;
          return updatedStage;
        }
        count++;
      }
      return exp;
    });
    setProfile({ ...profile, experiences: newExperiences });
  };

  const removeStage = (stageIdx: number) => {
    if (!profile) return;
    let count = 0;
    const newExperiences = profile.experiences.filter((exp) => {
      if ((exp.experience_type || "stage") === "stage") {
        const matches = count === stageIdx;
        count++;
        return !matches;
      }
      return true;
    });
    setProfile({ ...profile, experiences: newExperiences });
  };

  const addJob = () => {
    if (!profile) return;
    const newJob: Experience = {
      company: "",
      role: "",
      role_fr: "",
      role_en: "",
      location: "",
      start_date: "",
      end_date: "",
      description: "",
      description_fr: "",
      description_en: "",
      technologies: [],
      experience_type: "job",
    };
    setProfile({
      ...profile,
      experiences: [...profile.experiences, newJob],
    });
  };

  const updateJob = (jobIdx: number, updatedJob: Experience) => {
    if (!profile) return;
    let count = 0;
    const newExperiences = profile.experiences.map((exp) => {
      if (exp.experience_type === "job") {
        if (count === jobIdx) {
          count++;
          return updatedJob;
        }
        count++;
      }
      return exp;
    });
    setProfile({ ...profile, experiences: newExperiences });
  };

  const removeJob = (jobIdx: number) => {
    if (!profile) return;
    let count = 0;
    const newExperiences = profile.experiences.filter((exp) => {
      if (exp.experience_type === "job") {
        const matches = count === jobIdx;
        count++;
        return !matches;
      }
      return true;
    });
    setProfile({ ...profile, experiences: newExperiences });
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
          title_fr: "",
          title_en: "",
          role: "",
          role_fr: "",
          role_en: "",
          description: "",
          description_fr: "",
          description_en: "",
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

  // Skill Helpers (défaut sur 10 catégories)
  const addSkill = (category: string = "Frameworks") => {
    if (!profile) return;
    setProfile({
      ...profile,
      skills: [
        ...profile.skills,
        { name: "", category, level: "Intermédiaire" },
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

  // Activités Extra-Professionnelles Helpers
  const addExtracurricular = () => {
    if (!profile) return;
    const newExtra: Extracurricular = {
      organization: "",
      role: "",
      role_fr: "",
      role_en: "",
      date: "",
      description: "",
      description_fr: "",
      description_en: "",
    };
    setProfile({
      ...profile,
      extracurriculars: [...(profile.extracurriculars || []), newExtra],
    });
  };

  const updateExtracurricular = (index: number, updatedExtra: Extracurricular) => {
    if (!profile) return;
    const updated = [...(profile.extracurriculars || [])];
    updated[index] = updatedExtra;
    setProfile({ ...profile, extracurriculars: updated });
  };

  const removeExtracurricular = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      extracurriculars: (profile.extracurriculars || []).filter((_, i) => i !== index),
    });
  };

  // Langues Helpers
  const addLanguage = () => {
    if (!profile) return;
    const newLang: Language = {
      name: "",
      level: "Courant",
    };
    setProfile({
      ...profile,
      languages: [...(profile.languages || []), newLang],
    });
  };

  const updateLanguage = (index: number, updatedLang: Language) => {
    if (!profile) return;
    const updated = [...(profile.languages || [])];
    updated[index] = updatedLang;
    setProfile({ ...profile, languages: updated });
  };

  const removeLanguage = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      languages: (profile.languages || []).filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">{t("Chargement de votre profil...", "Loading your profile...")}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
          <h2 className="text-lg font-bold mb-2">{t("Erreur de chargement", "Loading error")}</h2>
          <p className="text-sm mb-4">{t("Impossible de récupérer votre profil. Veuillez vérifier la connexion ou actualiser la page.", "Unable to retrieve your profile. Please check the connection or refresh the page.")}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors shadow-xs"
          >
            {t("Réessayer", "Retry")}
          </button>
        </div>
      </div>
    );
  }

  const isComplete = status?.is_complete ?? false;
  const percentage = status?.completion_percentage ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
              {t("Mon Profil Professionnel", "My Professional Profile")}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
              {t("Certifié", "Verified")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Renseignez vos coordonnées, stages, expériences, compétences, activités extra-professionnelles et langues pour générer votre CV complet.", "Enter your contact details, internships, experience, skills, extracurricular activities and languages to generate your complete CV.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <Link
            href="/onboarding/step-1"
            className="px-3.5 py-2 rounded-md border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-xs font-semibold text-primary flex items-center gap-1.5 transition-colors shadow-xs"
            title={t("Lancer le walkthrough guidé étape par étape", "Start the step-by-step guided walkthrough")}
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>{t("Guide pas-à-pas", "Step-by-step guide")}</span>
          </Link>

          <button
            type="button"
            onClick={populateDemoProfile}
            className="px-3.5 py-2 rounded-md border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-2 transition-colors cursor-pointer"
            title={t("Remplir avec des données d'ingénieur réalistes (stages, projets, langues, activités)", "Fill with realistic engineering data (internships, projects, languages, activities)")}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{t("Exemple PFE", "PFE Example")}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t("Sauvegarde...", "Saving...") : t("Sauvegarder", "Save")}</span>
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
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-warning/20 border border-warning/40 flex items-center justify-center text-warning">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {isComplete ? t("Profil Complet & Vérifié", "Complete & Verified Profile") : t("Profil Incomplet", "Incomplete Profile")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isComplete
                    ? t("Toutes les conditions requises sont remplies pour générer des candidatures ciblées.", "All requirements are met to generate targeted applications.")
                    : t("Renseignez les champs manquants pour débloquer la génération automatique de CV et lettres.", "Fill in the missing fields to unlock automatic CV and letter generation.")}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-primary">
              {percentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                percentage === 100
                  ? "bg-emerald-600"
                  : percentage > 50
                  ? "bg-amber-600"
                  : "bg-rose-600"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Missing fields list */}
          {!isComplete && status && status.missing_fields.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                {t("Éléments recommandés pour optimiser votre profil :", "Recommended items to optimize your profile:")}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {status.missing_fields.map((field, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-amber-950 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 font-medium shadow-xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
                    <span>{localizeServerMessage(field)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Quality Check Card */}
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t("Garantie de qualité", "Quality guarantee")}</span>
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
              {t("Pour assurer l'impact de vos candidatures auprès des recruteurs, ArcApply vérifie que vos coordonnées, formations, expériences et compétences sont bien prêtes.", "To make sure your applications have impact with recruiters, ArcApply checks that your contact details, education, experience and skills are ready.")}
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleTestGeneration}
              className="w-full py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors shadow-xs cursor-pointer"
            >
              {t("Vérifier l'éligibilité de mon profil", "Check my profile eligibility")}
            </button>

            {testGenResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium border ${
                  testGenKind === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300"
                    : testGenKind === "blocked"
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-300"
                    : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200"
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
        {/* Section BYOK: Moteur IA & Clé d'API Groq Personnelle */}
        <div className="p-6 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <span>{t("Clé d'API Groq Personnelle (BYOK)", "Personal Groq API Key (BYOK)")}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                    {t("Multi-Tenant Isolé", "Isolated Multi-Tenant")}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("Chaque utilisateur peut renseigner sa propre clé Groq pour disposer de son quota journalier dédié (200 000 tokens/jour) sans dépendre du serveur.", "Each user can enter their own Groq key to get a dedicated daily quota (200,000 tokens/day) without depending on the server.")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-foreground flex items-center justify-between">
                <span>{t("Clé d'API Groq (gsk_...)", "Groq API key (gsk_...)")}</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-normal"
                >
                  <span>{t("Obtenir une clé gratuite sur console.groq.com", "Get a free key at console.groq.com")}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showGroqKey ? "text" : "password"}
                  value={profile?.groq_api_key || ""}
                  onChange={(e) => {
                    if (profile) setProfile({ ...profile, groq_api_key: e.target.value });
                    setGroqTestResult({ status: "idle" });
                  }}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full pr-12 pl-3.5 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs text-foreground placeholder:text-muted-foreground/40 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-2 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={showGroqKey ? t("Masquer la clé", "Hide key") : t("Afficher la clé", "Show key")}
                >
                  {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("Si laissé vide, le serveur utilise la clé par défaut de la plateforme. Vos clés sont strictement privées à votre session.", "If left empty, the server uses the platform's default key. Your keys are strictly private to your session.")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                {t("Modèle LLM Groq", "Groq LLM model")}
              </label>
              <select
                value={profile?.groq_model || "openai/gpt-oss-120b"}
                onChange={(e) => {
                  if (profile) setProfile({ ...profile, groq_model: e.target.value });
                }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-xs text-foreground shadow-xs cursor-pointer"
              >
                <option value="openai/gpt-oss-120b">{t("GPT OSS 120B (openai/gpt-oss-120b) [Recommandé — Quota élevé & Rapide]", "GPT OSS 120B (openai/gpt-oss-120b) [Recommended — High quota & Fast]")}</option>
                <option value="openai/gpt-oss-20b">{t("GPT OSS 20B (openai/gpt-oss-20b) [Ultra-rapide]", "GPT OSS 20B (openai/gpt-oss-20b) [Ultra-fast]")}</option>
                <option value="qwen/qwen3.8-27b">{t("Qwen 2.5 27B (qwen/qwen3.8-27b) [Plafond 1000 OTPM]", "Qwen 2.5 27B (qwen/qwen3.8-27b) [1000 OTPM cap]")}</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                {t("Modèle de raisonnement haute vitesse pour la rédaction du CV et de la lettre.", "High-speed reasoning model for writing the CV and the letter.")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-primary/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!profile?.groq_api_key?.trim()) {
                    setGroqTestResult({ status: "error", message: t("Veuillez d'abord saisir une clé d'API Groq (gsk_...).", "Please enter a Groq API key first (gsk_...).") });
                    return;
                  }
                  try {
                    setTestingGroq(true);
                    setGroqTestResult({ status: "idle" });
                    const res = await testGroqKey(profile.groq_api_key, profile.groq_model || undefined);
                    setGroqTestResult({ status: "success", message: localizeServerMessage(res.message) || t("Clé Groq validée avec succès !", "Groq key validated successfully!") });
                  } catch (err: any) {
                    setGroqTestResult({ status: "error", message: err.message || t("Échec de validation de la clé Groq.", "Groq key validation failed.") });
                  } finally {
                    setTestingGroq(false);
                  }
                }}
                disabled={testingGroq || !profile?.groq_api_key?.trim()}
                className="px-3.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {testingGroq ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("Test de connexion en cours...", "Testing connection...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t("Tester la clé Groq", "Test the Groq key")}</span>
                  </>
                )}
              </button>

              {groqTestResult.status === "success" && (
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{groqTestResult.message}</span>
                </span>
              )}

              {groqTestResult.status === "error" && (
                <span className="text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{groqTestResult.message}</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground">
              {t("Cliquez sur « Enregistrer les modifications » en haut pour sauvegarder la clé.", "Click “Save” at the top to save the key.")}
            </div>
          </div>
        </div>

        {/* Section 1: Identité & Coordonnées */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center gap-3 border-b border-border/50 pb-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">{t("Identité & Coordonnées", "Identity & Contact Details")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t("Nom complet *", "Full name *")}
              </label>
              <input
                type="text"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder={t("ex: Alexandre Dupont", "e.g. Alex Johnson")}
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t("Email de contact *", "Contact email *")}
              </label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder={t("ex: contact@etudiant.fr", "e.g. contact@student.edu")}
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t("Numéro de téléphone", "Phone number")}
              </label>
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder={t("ex: +33 6 12 34 56 78", "e.g. +33 6 12 34 56 78")}
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t("Localisation (Cible PFE) *", "Location (PFE target) *")}
              </label>
              <input
                type="text"
                value={profile.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder={t("ex: Paris, France / Tunis, Tunisie", "e.g. Paris, France / Tunis, Tunisia")}
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>{t("[FR] Titre professionnel / Accroche (Français) *", "[FR] Professional title / Headline (French) *")}</span>
                </label>
                <input
                  type="text"
                  value={profile.headline_fr ?? profile.headline ?? ""}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value, headline_fr: e.target.value })}
                  placeholder="ex: Élève-ingénieur Systèmes Distribués & Cloud | Recherche Stage PFE 2027"
                  className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>[EN] Professional Headline / Tagline (English)</span>
                </label>
                <input
                  type="text"
                  value={profile.headline_en ?? ""}
                  onChange={(e) => setProfile({ ...profile, headline_en: e.target.value })}
                  placeholder="ex: Distributed Systems & Cloud Engineering Student | Seeking Final Internship 2027"
                  className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>{t("[FR] Bio / Synthèse de parcours (Français)", "[FR] Bio / Background summary (French)")}</span>
                </label>
                <textarea
                  rows={3}
                  value={profile.bio_fr ?? profile.bio ?? ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value, bio_fr: e.target.value })}
                  placeholder="Présentation synthétique et factuelle de vos objectifs d'ingénierie..."
                  className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>[EN] Bio / Summary (English)</span>
                </label>
                <textarea
                  rows={3}
                  value={profile.bio_en ?? ""}
                  onChange={(e) => setProfile({ ...profile, bio_en: e.target.value })}
                  placeholder="Concise and factual overview of your engineering background and goals..."
                  className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t("Lien LinkedIn", "LinkedIn link")}
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
                {t("Lien GitHub", "GitHub link")}
              </label>
              <input
                type="url"
                value={profile.github_url || ""}
                onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                placeholder="https://github.com/..."
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t("Site Web / Portfolio", "Website / Portfolio")}
              </label>
              <input
                type="url"
                value={profile.website_url || ""}
                onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                placeholder={t("https://www.monportfolio.com", "https://www.myportfolio.com")}
                className="w-full px-3.5 py-2 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Formations Académiques */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">{t("Formations Académiques", "Academic Education")}</h2>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter une formation", "Add education")}</span>
            </button>
          </div>

          {profile.educations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              {t("Aucune formation enregistrée. Au moins une formation est requise pour valider le profil.", "No education saved. At least one education entry is required to validate the profile.")}
            </p>
          ) : (
            <div className="space-y-4">
              {profile.educations.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-primary">{t(`Formation #${idx + 1}`, `Education #${idx + 1}`)}</span>
                    <button
                      type="button"
                      onClick={() => removeEducation(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder={t("Établissement / École *", "Institution / School *")}
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
                      placeholder={t("Année début (ex: 2022)", "Start year (e.g. 2022)")}
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
                      placeholder={t("Année fin (ou prévision 2027)", "End year (or expected 2027)")}
                      value={edu.end_date || ""}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].end_date = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder={t("[FR] Diplôme préparé (ex: Diplôme National d'Ingénieur) *", "[FR] Degree pursued (e.g. Diplôme National d'Ingénieur) *")}
                      value={edu.degree_fr ?? edu.degree}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].degree = e.target.value;
                        updated[idx].degree_fr = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[EN] Degree (ex: Master of Science in Software Engineering)", "[EN] Degree (e.g. Master of Science in Software Engineering)")}
                      value={edu.degree_en || ""}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].degree_en = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[FR] Filière / Spécialité (ex: Génie Logiciel)", "[FR] Track / Major (e.g. Génie Logiciel)")}
                      value={edu.field_of_study_fr ?? edu.field_of_study}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].field_of_study = e.target.value;
                        updated[idx].field_of_study_fr = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[EN] Field of study (ex: Software Engineering)", "[EN] Field of study (e.g. Software Engineering)")}
                      value={edu.field_of_study_en || ""}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].field_of_study_en = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder={t("[FR] Détails académiques (Français)", "[FR] Academic details (French)")}
                      value={edu.description_fr ?? edu.description ?? ""}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].description = e.target.value;
                        updated[idx].description_fr = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[EN] Academic details (English)"
                      value={edu.description_en || ""}
                      onChange={(e) => {
                        const updated = [...profile.educations];
                        updated[idx].description_en = e.target.value;
                        setProfile({ ...profile, educations: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Stages & Immersion en Entreprise (SÉPARÉ) */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("Stages & Immersion en Entreprise", "Internships & Company Immersion")}</h2>
                <p className="text-xs text-muted-foreground">{t("Stages PFE, stages ingénieur / technicien, ouvrier ou stages d'été.", "PFE internships, engineering / technician, worker or summer internships.")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addStage}
              className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter un stage", "Add an internship")}</span>
            </button>
          </div>

          {stages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              {t("Aucun stage renseigné. Renseignez vos stages d'ingénieur pour alimenter la section dédiée de votre CV.", "No internships entered. Add your engineering internships to fill the dedicated section of your CV.")}
            </p>
          ) : (
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                        {t(`Stage #${idx + 1}`, `Internship #${idx + 1}`)}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {stage.company ? `${stage.role || t("Stagiaire", "Intern")} @ ${stage.company}` : t("Nouveau stage", "New internship")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStage(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder={t("Entreprise d'accueil *", "Host company *")}
                      value={stage.company}
                      onChange={(e) => updateStage(idx, { ...stage, company: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("Ville, Pays (ex: Tunis, Tunisie)", "City, Country (e.g. Tunis, Tunisia)")}
                      value={stage.location || ""}
                      onChange={(e) => updateStage(idx, { ...stage, location: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <StackInput
                      placeholder={t("Technologies / Stack (ex: Python, Docker, AWS)", "Technologies / Stack (e.g. Python, Docker, AWS)")}
                      value={stage.technologies}
                      onChange={(techs) => updateStage(idx, { ...stage, technologies: techs })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("Date début (ex: Juin 2025)", "Start date (e.g. June 2025)")}
                      value={stage.start_date}
                      onChange={(e) => updateStage(idx, { ...stage, start_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("Date fin (ex: Août 2025)", "End date (e.g. August 2025)")}
                      value={stage.end_date || ""}
                      onChange={(e) => updateStage(idx, { ...stage, end_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder={t("[FR] Intitulé du stage / Rôle * (ex: Stagiaire Ingénieur DevOps)", "[FR] Internship title / Role * (e.g. Stagiaire Ingénieur DevOps)")}
                      value={stage.role_fr ?? stage.role}
                      onChange={(e) => updateStage(idx, { ...stage, role: e.target.value, role_fr: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[EN] Internship Role (ex: DevOps Engineering Intern)", "[EN] Internship Role (e.g. DevOps Engineering Intern)")}
                      value={stage.role_en || ""}
                      onChange={(e) => updateStage(idx, { ...stage, role_en: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder={t("[FR] Description concrète des missions, livrables et impact *", "[FR] Concrete description of assignments, deliverables and impact *")}
                      value={stage.description_fr ?? stage.description}
                      onChange={(e) => updateStage(idx, { ...stage, description: e.target.value, description_fr: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[EN] Concrete description of missions, deliverables and impact"
                      value={stage.description_en || ""}
                      onChange={(e) => updateStage(idx, { ...stage, description_en: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Expériences Professionnelles (Hors Stages) */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("Expériences Professionnelles (Hors Stages)", "Professional Experience (Excluding Internships)")}</h2>
                <p className="text-xs text-muted-foreground">{t("Emplois CDI, CDD, alternance, freelance et missions professionnelles.", "Permanent and fixed-term jobs, work-study, freelance and professional assignments.")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addJob}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter une expérience", "Add an experience")}</span>
            </button>
          </div>

          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              {t("Aucune expérience hors stage enregistrée (facultatif si vous êtes étudiant recherchant un PFE).", "No non-internship experience saved (optional if you are a student looking for a PFE).")}
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        {t(`Expérience #${idx + 1}`, `Experience #${idx + 1}`)}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {job.company ? `${job.role || t("Poste", "Position")} @ ${job.company}` : t("Nouvelle expérience", "New experience")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeJob(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder={t("Entreprise / Client *", "Company / Client *")}
                      value={job.company}
                      onChange={(e) => updateJob(idx, { ...job, company: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("Ville, Pays", "City, Country")}
                      value={job.location || ""}
                      onChange={(e) => updateJob(idx, { ...job, location: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <StackInput
                      placeholder={t("Technologies / Stack (ex: TypeScript, Next.js)", "Technologies / Stack (e.g. TypeScript, Next.js)")}
                      value={job.technologies}
                      onChange={(techs) => updateJob(idx, { ...job, technologies: techs })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("Date début", "Start date")}
                      value={job.start_date}
                      onChange={(e) => updateJob(idx, { ...job, start_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("Date fin (ou Présent)", "End date (or Present)")}
                      value={job.end_date || ""}
                      onChange={(e) => updateJob(idx, { ...job, end_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder={t("[FR] Intitulé du poste / Rôle * (ex: Développeur Backend Freelance)", "[FR] Job title / Role * (e.g. Développeur Backend Freelance)")}
                      value={job.role_fr ?? job.role}
                      onChange={(e) => updateJob(idx, { ...job, role: e.target.value, role_fr: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[EN] Position / Role (ex: Freelance Backend Developer)", "[EN] Position / Role (e.g. Freelance Backend Developer)")}
                      value={job.role_en || ""}
                      onChange={(e) => updateJob(idx, { ...job, role_en: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder={t("[FR] Description des responsabilités et réalisations *", "[FR] Description of responsibilities and achievements *")}
                      value={job.description_fr ?? job.description}
                      onChange={(e) => updateJob(idx, { ...job, description: e.target.value, description_fr: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[EN] Description of responsibilities and achievements"
                      value={job.description_en || ""}
                      onChange={(e) => updateJob(idx, { ...job, description_en: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Projets Techniques */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">{t("Projets Techniques Significatifs", "Significant Technical Projects")}</h2>
            </div>
            <button
              type="button"
              onClick={addProject}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter un projet", "Add a project")}</span>
            </button>
          </div>

          {profile.projects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              {t("Aucun projet enregistré. Les projets concrets renforcent fortement la crédibilité technique de votre profil.", "No projects saved. Concrete projects strongly reinforce the technical credibility of your profile.")}
            </p>
          ) : (
            <div className="space-y-4">
              {profile.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-primary">{t(`Projet #${idx + 1}`, `Project #${idx + 1}`)}</span>
                    <button
                      type="button"
                      onClick={() => removeProject(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t("Lien / Dépôt (URL)", "Link / Repository (URL)")}
                      value={proj.url || ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].url = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <StackInput
                      placeholder={t("Technologies clés / Stack (ex: Docker, Python)", "Key technologies / Stack (e.g. Docker, Python)")}
                      value={proj.technologies}
                      onChange={(techs) => {
                        const updated = [...profile.projects];
                        updated[idx].technologies = techs;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder={t("[FR] Titre du projet (ex: Copilote IA Local) *", "[FR] Project title (e.g. Copilote IA Local) *")}
                      value={proj.title_fr ?? proj.title}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].title = e.target.value;
                        updated[idx].title_fr = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[EN] Project Title (ex: Local AI Copilot)", "[EN] Project Title (e.g. Local AI Copilot)")}
                      value={proj.title_en || ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].title_en = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[FR] Rôle (ex: Architecte & Lead Dev)", "[FR] Role (e.g. Architecte & Lead Dev)")}
                      value={proj.role_fr ?? proj.role ?? ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].role = e.target.value;
                        updated[idx].role_fr = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[EN] Role (ex: Lead Architect & Developer)", "[EN] Role (e.g. Lead Architect & Developer)")}
                      value={proj.role_en || ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].role_en = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder={t("[FR] Description de l'architecture, problématique et performances *", "[FR] Description of the architecture, problem and performance *")}
                      value={proj.description_fr ?? proj.description}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].description = e.target.value;
                        updated[idx].description_fr = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[EN] Architecture, technical challenge and performance achievements"
                      value={proj.description_en || ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].description_en = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: Compétences Techniques (10 Catégories sur lignes distinctes) */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("Compétences Techniques par Catégories", "Technical Skills by Category")}</h2>
                <p className="text-xs text-muted-foreground">{t("10 catégories normalisées pour l'analyse ATS et la mise en page du CV (chacune sur sa ligne).", "10 standardized categories for ATS analysis and CV layout (each on its own line).")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => addSkill("Frameworks")}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter une compétence", "Add a skill")}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {SKILL_CATEGORIES.map((category) => {
              const categorySkills = (profile.skills || [])
                .map((skill, originalIndex) => ({ skill, originalIndex }))
                .filter(
                  ({ skill }) => (skill.category || "").trim().toLowerCase() === category.toLowerCase()
                );

              return (
                <div
                  key={category}
                  className="p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="md:w-64 flex-shrink-0 flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{skillCategoryLabel(category, appLanguage)}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {categorySkills.length}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {categorySkills.map(({ skill, originalIndex }) => (
                      <span
                        key={originalIndex}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-card border border-border text-foreground shadow-2xs group"
                      >
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => {
                            const updated = [...profile.skills];
                            updated[originalIndex] = { ...updated[originalIndex], name: e.target.value };
                            setProfile({ ...profile, skills: updated });
                          }}
                          className="bg-transparent border-none focus:outline-none text-xs text-foreground w-auto min-w-[50px] max-w-[140px]"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkill(originalIndex)}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title={t(`Supprimer ${skill.name}`, `Delete ${skill.name}`)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem(`new-skill-${category}`) as HTMLInputElement);
                        const val = input?.value.trim();
                        if (val) {
                          setProfile({
                            ...profile,
                            skills: [...profile.skills, { name: val, category, level: "Intermédiaire" }],
                          });
                          input.value = "";
                        }
                      }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <input
                        name={`new-skill-${category}`}
                        type="text"
                        placeholder={t("+ Ajouter...", "+ Add...")}
                        className="px-2 py-1 rounded bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary w-24 focus:w-32 transition-all"
                      />
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 7: Activités Extra-Professionnelles (AJOUT DEMANDÉ) */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("Activités Extra-Professionnelles & Vie Associative", "Extracurricular Activities & Student Life")}</h2>
                <p className="text-xs text-muted-foreground">{t("Clubs universitaires, associations, hackathons, responsabilités et engagement étudiant.", "University clubs, associations, hackathons, responsibilities and student involvement.")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addExtracurricular}
              className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter une activité", "Add an activity")}</span>
            </button>
          </div>

          {(profile.extracurriculars || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              {t("Aucune activité extra-professionnelle renseignée. Ajoutez vos engagements en clubs (ex: Enactus, IEEE, Robotique) pour enrichir votre CV.", "No extracurricular activities entered. Add your club involvement (e.g. Enactus, IEEE, Robotics) to enrich your CV.")}
            </p>
          ) : (
            <div className="space-y-4">
              {(profile.extracurriculars || []).map((extra, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-primary">{t(`Activité #${idx + 1}`, `Activity #${idx + 1}`)}</span>
                    <button
                      type="button"
                      onClick={() => removeExtracurricular(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t("Organisation / Club / Association * (ex: Enactus)", "Organization / Club / Association * (e.g. Enactus)")}
                      value={extra.organization}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, organization: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("Année / Période (ex: 2023 – 2024)", "Year / Period (e.g. 2023 – 2024)")}
                      value={extra.date}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder={t("[FR] Rôle / Responsabilité * (ex: Chef de Projet, Membre Actif)", "[FR] Role / Responsibility * (e.g. Chef de Projet, Membre Actif)")}
                      value={extra.role_fr ?? extra.role}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, role: e.target.value, role_fr: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder={t("[EN] Role / Responsibility (ex: Project Lead, Active Member)", "[EN] Role / Responsibility (e.g. Project Lead, Active Member)")}
                      value={extra.role_en || ""}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, role_en: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder={t("[FR] Description des actions, projets menés et réalisations (Français)...", "[FR] Description of actions, projects and achievements (French)...")}
                      value={extra.description_fr ?? extra.description}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, description: e.target.value, description_fr: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[EN] Description of actions, projects and achievements (English)..."
                      value={extra.description_en || ""}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, description_en: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 8: Langues Maîtrisées (AJOUT DEMANDÉ) */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3">
              <Globe2 className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("Langues Maîtrisées", "Languages Spoken")}</h2>
                <p className="text-xs text-muted-foreground">{t("Niveaux de compétences linguistiques pour vos candidatures internationales et locales.", "Language proficiency levels for your international and local applications.")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addLanguage}
              className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter une langue", "Add a language")}</span>
            </button>
          </div>

          {(profile.languages || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              {t("Aucune langue renseignée. Ajoutez vos langues maîtrisées (Français, Anglais, Arabe...) pour votre CV.", "No languages entered. Add the languages you speak (French, English, Arabic...) for your CV.")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(profile.languages || []).map((lang, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/70 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t("Langue (ex: Anglais) *", "Language (e.g. English) *")}
                    value={lang.name}
                    onChange={(e) => updateLanguage(idx, { ...lang, name: e.target.value })}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => updateLanguage(idx, { ...lang, level: e.target.value })}
                    className="min-w-0 max-w-[50%] px-2 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Langue maternelle">{t("Maternelle", "Native")}</option>
                    <option value="Courant / Bilingue (C1/C2)">{t("Courant (C1/C2)", "Fluent (C1/C2)")}</option>
                    <option value="Professionnel / Technique (B2)">{t("Technique (B2)", "Professional (B2)")}</option>
                    <option value="Intermédiaire (B1)">{t("Intermédiaire (B1)", "Intermediate (B1)")}</option>
                    <option value="Notions élémentaires (A1/A2)">{t("Notions (A1/A2)", "Basic (A1/A2)")}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLanguage(idx)}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 9: Bouton de Téléchargement du CV Complet (DEMANDE FORMELLE DE L'UTILISATEUR) */}
        <div className="p-6 md:p-8 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                <FileDown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
                  <span>{t("Télécharger mon CV Complet (PDF A4 Vectoriel)", "Download my Complete CV (A4 Vector PDF)")}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                    {t("100% Souverain", "100% Sovereign")}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  {t("Générez et téléchargez instantanément votre CV vectoriel A4 officiel compilé par le moteur Playwright. Ce CV compile l'intégralité de vos informations déjà saisies :", "Instantly generate and download your official A4 vector CV compiled by the Playwright engine. This CV includes all the information you have entered:")} 
                  <span className="font-semibold text-foreground"> {t("Coordonnées, Formations, Stages, Expériences, Projets, Compétences, Activités Extra-Professionnelles et Langues", "Contact details, Education, Internships, Experience, Projects, Skills, Extracurricular Activities and Languages")}</span>.
                </p>
              </div>
            </div>

            {/* Language toggle + Download trigger */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center rounded-lg border border-border bg-muted/60 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCvDownloadLang("fr")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    cvDownloadLang === "fr"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Version FR", "FR version")}
                </button>
                <button
                  type="button"
                  onClick={() => setCvDownloadLang("en")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    cvDownloadLang === "en"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Version EN", "EN version")}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadCV}
                disabled={isDownloadingCv}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isDownloadingCv ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t("Compilation PDF...", "Compiling PDF...")}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{t("Télécharger mon CV (PDF)", "Download my CV (PDF)")}</span>
                  </>
                )}
              </button>

              <Link
                href="/cv"
                className="px-3.5 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors"
                title={t("Ouvrir le Studio CV pour personnaliser les marges, polices ou sections", "Open CV Studio to customize margins, fonts or sections")}
              >
                <span>{t("Studio CV", "CV Studio")}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Quick checklist of included elements */}
          <div className="pt-4 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t(`${stages.length} Stage${stages.length > 1 ? "s" : ""}`, `${stages.length} Internship${stages.length === 1 ? "" : "s"}`)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t(`${profile.projects.length} Projet${profile.projects.length > 1 ? "s" : ""}`, `${profile.projects.length} Project${profile.projects.length === 1 ? "" : "s"}`)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {t(
                  `${(profile.extracurriculars || []).length} Activité${(profile.extracurriculars || []).length > 1 ? "s" : ""} extra`,
                  `${(profile.extracurriculars || []).length} Extracurricular${(profile.extracurriculars || []).length === 1 ? "" : "s"}`
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {t(
                  `${(profile.languages || []).length} Langue${(profile.languages || []).length > 1 ? "s" : ""}`,
                  `${(profile.languages || []).length} Language${(profile.languages || []).length === 1 ? "" : "s"}`
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
