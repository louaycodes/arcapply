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
} from "@/lib/api";
import { useAppLanguage } from "@/lib/language-context";
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
  placeholder = "Technologies / Stack (ex: Python, Docker, AWS)",
  className = "px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary",
}: {
  value?: string[];
  onChange: (techs: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
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
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

export default function ProfilePage() {
  const { language: appLanguage } = useAppLanguage();
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
        message: "Votre profil a été enregistré avec succès.",
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
      setTestGenResult(`Succès : ${result.message} (${result.completion_percentage}%)`);
    } catch (err: any) {
      setTestGenResult(`Bloqué (CAP-1) : ${err.message}`);
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
        message: "Votre CV complet a été téléchargé avec succès (format PDF A4 vectoriel) !",
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Échec du téléchargement du CV.",
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
      message: "Modèle de profil complet et bilingue injecté ! Cliquez sur 'Sauvegarder' pour valider.",
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
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
          <h2 className="text-lg font-bold mb-2">Erreur de chargement</h2>
          <p className="text-sm mb-4">Impossible de récupérer votre profil. Veuillez vérifier la connexion ou actualiser la page.</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors shadow-xs"
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
              Mon Profil Professionnel
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
              Certifié
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Renseignez vos coordonnées, stages, expériences, compétences, activités extra-professionnelles et langues pour générer votre CV complet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/onboarding/step-1"
            className="px-3.5 py-2 rounded-md border border-orange-200 bg-orange-50 hover:bg-orange-100 text-xs font-semibold text-primary flex items-center gap-1.5 transition-colors shadow-xs"
            title="Lancer le walkthrough guidé étape par étape"
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>Guide pas-à-pas</span>
          </Link>

          <button
            type="button"
            onClick={populateDemoProfile}
            className="px-3.5 py-2 rounded-md border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-2 transition-colors cursor-pointer"
            title="Remplir avec des données d'ingénieur réalistes (stages, projets, langues, activités)"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Exemple PFE</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
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
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-warning/20 border border-warning/40 flex items-center justify-center text-warning">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {isComplete ? "Profil Complet & Vérifié" : "Profil Incomplet"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isComplete
                    ? "Toutes les conditions requises sont remplies pour générer des candidatures ciblées."
                    : "Renseignez les champs manquants pour débloquer la génération automatique de CV et lettres."}
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
              <p className="text-xs font-semibold text-stone-700 mb-2">
                Éléments recommandés pour optimiser votre profil :
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {status.missing_fields.map((field, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-amber-950 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 font-medium shadow-xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Quality Check Card */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-artisan flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-stone-900 font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Garantie de qualité</span>
            </h4>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Pour assurer l'impact de vos candidatures auprès des recruteurs, ArcApply vérifie que vos coordonnées, formations, expériences et compétences sont bien prêtes.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleTestGeneration}
              className="w-full py-2 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors shadow-xs cursor-pointer"
            >
              Vérifier l'éligibilité de mon profil
            </button>

            {testGenResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium border ${
                  testGenResult.startsWith("Succès")
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : testGenResult.startsWith("Bloqué")
                    ? "bg-rose-50 border-rose-300 text-rose-950"
                    : "bg-stone-50 border-stone-200 text-stone-800"
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
                  <span>Clé d'API Groq Personnelle (BYOK)</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                    Multi-Tenant Isolé
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Chaque utilisateur peut renseigner sa propre clé Groq pour disposer de son quota journalier dédié (200 000 tokens/jour) sans dépendre du serveur.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Clé d'API Groq (gsk_...)</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-normal"
                >
                  <span>Obtenir une clé gratuite sur console.groq.com</span>
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
                  title={showGroqKey ? "Masquer la clé" : "Afficher la clé"}
                >
                  {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Si laissé vide, le serveur utilise la clé par défaut de la plateforme. Vos clés sont strictement privées à votre session.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Modèle LLM Groq
              </label>
              <select
                value={profile?.groq_model || "openai/gpt-oss-120b"}
                onChange={(e) => {
                  if (profile) setProfile({ ...profile, groq_model: e.target.value });
                }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-xs text-foreground shadow-xs cursor-pointer"
              >
                <option value="openai/gpt-oss-120b">GPT OSS 120B (openai/gpt-oss-120b) [Recommandé — Quota élevé & Rapide]</option>
                <option value="openai/gpt-oss-20b">GPT OSS 20B (openai/gpt-oss-20b) [Ultra-rapide]</option>
                <option value="qwen/qwen3.8-27b">Qwen 2.5 27B (qwen/qwen3.8-27b) [Plafond 1000 OTPM]</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                Modèle de raisonnement haute vitesse pour la rédaction du CV et de la lettre.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-primary/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!profile?.groq_api_key?.trim()) {
                    setGroqTestResult({ status: "error", message: "Veuillez d'abord saisir une clé d'API Groq (gsk_...)." });
                    return;
                  }
                  try {
                    setTestingGroq(true);
                    setGroqTestResult({ status: "idle" });
                    const res = await testGroqKey(profile.groq_api_key, profile.groq_model || undefined);
                    setGroqTestResult({ status: "success", message: res.message || "Clé Groq validée avec succès !" });
                  } catch (err: any) {
                    setGroqTestResult({ status: "error", message: err.message || "Échec de validation de la clé Groq." });
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
                    <span>Test de connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tester la clé Groq</span>
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
              Cliquez sur « Enregistrer les modifications » en haut pour sauvegarder la clé.
            </div>
          </div>
        </div>

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

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>[FR] Titre professionnel / Accroche (Français) *</span>
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
                  <span>[FR] Bio / Synthèse de parcours (Français)</span>
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

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Site Web / Portfolio
              </label>
              <input
                type="url"
                value={profile.website_url || ""}
                onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                placeholder="https://www.monportfolio.com"
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
              <h2 className="text-base font-semibold text-foreground">Formations Académiques</h2>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
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
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      placeholder="Année début (ex: 2022)"
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
                      placeholder="Année fin (ou prévision 2027)"
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
                      placeholder="[FR] Diplôme préparé (ex: Diplôme National d'Ingénieur) *"
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
                      placeholder="[EN] Degree (ex: Master of Science in Software Engineering)"
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
                      placeholder="[FR] Filière / Spécialité (ex: Génie Logiciel)"
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
                      placeholder="[EN] Field of study (ex: Software Engineering)"
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
                      placeholder="[FR] Détails académiques (Français)"
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
                <h2 className="text-base font-semibold text-foreground">Stages & Immersion en Entreprise</h2>
                <p className="text-xs text-muted-foreground">Stages PFE, stages ingénieur / technicien, ouvrier ou stages d'été.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addStage}
              className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un stage</span>
            </button>
          </div>

          {stages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucun stage renseigné. Renseignez vos stages d'ingénieur pour alimenter la section dédiée de votre CV.
            </p>
          ) : (
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                        Stage #{idx + 1}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {stage.company ? `${stage.role || "Stagiaire"} @ ${stage.company}` : "Nouveau stage"}
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
                      placeholder="Entreprise d'accueil *"
                      value={stage.company}
                      onChange={(e) => updateStage(idx, { ...stage, company: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Ville, Pays (ex: Tunis, Tunisie)"
                      value={stage.location || ""}
                      onChange={(e) => updateStage(idx, { ...stage, location: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <StackInput
                      placeholder="Technologies / Stack (ex: Python, Docker, AWS)"
                      value={stage.technologies}
                      onChange={(techs) => updateStage(idx, { ...stage, technologies: techs })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Date début (ex: Juin 2025)"
                      value={stage.start_date}
                      onChange={(e) => updateStage(idx, { ...stage, start_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Date fin (ex: Août 2025)"
                      value={stage.end_date || ""}
                      onChange={(e) => updateStage(idx, { ...stage, end_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="[FR] Intitulé du stage / Rôle * (ex: Stagiaire Ingénieur DevOps)"
                      value={stage.role_fr ?? stage.role}
                      onChange={(e) => updateStage(idx, { ...stage, role: e.target.value, role_fr: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="[EN] Internship Role (ex: DevOps Engineering Intern)"
                      value={stage.role_en || ""}
                      onChange={(e) => updateStage(idx, { ...stage, role_en: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[FR] Description concrète des missions, livrables et impact *"
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
                <h2 className="text-base font-semibold text-foreground">Expériences Professionnelles (Hors Stages)</h2>
                <p className="text-xs text-muted-foreground">Emplois CDI, CDD, alternance, freelance et missions professionnelles.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addJob}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une expérience</span>
            </button>
          </div>

          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucune expérience hors stage enregistrée (facultatif si vous êtes étudiant recherchant un PFE).
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        Expérience #{idx + 1}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {job.company ? `${job.role || "Poste"} @ ${job.company}` : "Nouvelle expérience"}
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
                      placeholder="Entreprise / Client *"
                      value={job.company}
                      onChange={(e) => updateJob(idx, { ...job, company: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Ville, Pays"
                      value={job.location || ""}
                      onChange={(e) => updateJob(idx, { ...job, location: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <StackInput
                      placeholder="Technologies / Stack (ex: TypeScript, Next.js)"
                      value={job.technologies}
                      onChange={(techs) => updateJob(idx, { ...job, technologies: techs })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Date début"
                      value={job.start_date}
                      onChange={(e) => updateJob(idx, { ...job, start_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Date fin (ou Présent)"
                      value={job.end_date || ""}
                      onChange={(e) => updateJob(idx, { ...job, end_date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="[FR] Intitulé du poste / Rôle * (ex: Développeur Backend Freelance)"
                      value={job.role_fr ?? job.role}
                      onChange={(e) => updateJob(idx, { ...job, role: e.target.value, role_fr: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="[EN] Position / Role (ex: Freelance Backend Developer)"
                      value={job.role_en || ""}
                      onChange={(e) => updateJob(idx, { ...job, role_en: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[FR] Description des responsabilités et réalisations *"
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
              <h2 className="text-base font-semibold text-foreground">Projets Techniques Significatifs</h2>
            </div>
            <button
              type="button"
              onClick={addProject}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un projet</span>
            </button>
          </div>

          {profile.projects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucun projet enregistré. Les projets concrets renforcent fortement la crédibilité technique de votre profil.
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
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <StackInput
                      placeholder="Technologies clés / Stack (ex: Docker, Python)"
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
                      placeholder="[FR] Titre du projet (ex: Copilote IA Local) *"
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
                      placeholder="[EN] Project Title (ex: Local AI Copilot)"
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
                      placeholder="[FR] Rôle (ex: Architecte & Lead Dev)"
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
                      placeholder="[EN] Role (ex: Lead Architect & Developer)"
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
                      placeholder="[FR] Description de l'architecture, problématique et performances *"
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
                <h2 className="text-base font-semibold text-foreground">Compétences Techniques par Catégories</h2>
                <p className="text-xs text-muted-foreground">10 catégories normalisées pour l'analyse ATS et la mise en page du CV (chacune sur sa ligne).</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => addSkill("Frameworks")}
              className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une compétence</span>
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
                    <span className="text-xs font-semibold text-foreground">{category}</span>
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
                          title={`Supprimer ${skill.name}`}
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
                        placeholder="+ Ajouter..."
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
                <h2 className="text-base font-semibold text-foreground">Activités Extra-Professionnelles & Vie Associative</h2>
                <p className="text-xs text-muted-foreground">Clubs universitaires, associations, hackathons, responsabilités et engagement étudiant.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addExtracurricular}
              className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une activité</span>
            </button>
          </div>

          {(profile.extracurriculars || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucune activité extra-professionnelle renseignée. Ajoutez vos engagements en clubs (ex: Enactus, IEEE, Robotique) pour enrichir votre CV.
            </p>
          ) : (
            <div className="space-y-4">
              {(profile.extracurriculars || []).map((extra, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-primary">Activité #{idx + 1}</span>
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
                      placeholder="Organisation / Club / Association * (ex: Enactus)"
                      value={extra.organization}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, organization: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Année / Période (ex: 2023 – 2024)"
                      value={extra.date}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, date: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="[FR] Rôle / Responsabilité * (ex: Chef de Projet, Membre Actif)"
                      value={extra.role_fr ?? extra.role}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, role: e.target.value, role_fr: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="[EN] Role / Responsibility (ex: Project Lead, Active Member)"
                      value={extra.role_en || ""}
                      onChange={(e) => updateExtracurricular(idx, { ...extra, role_en: e.target.value })}
                      className="px-3 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      placeholder="[FR] Description des actions, projets menés et réalisations (Français)..."
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
                <h2 className="text-base font-semibold text-foreground">Langues Maîtrisées</h2>
                <p className="text-xs text-muted-foreground">Niveaux de compétences linguistiques pour vos candidatures internationales et locales.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addLanguage}
              className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une langue</span>
            </button>
          </div>

          {(profile.languages || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Aucune langue renseignée. Ajoutez vos langues maîtrisées (Français, Anglais, Arabe...) pour votre CV.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(profile.languages || []).map((lang, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/70 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Langue (ex: Anglais) *"
                    value={lang.name}
                    onChange={(e) => updateLanguage(idx, { ...lang, name: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => updateLanguage(idx, { ...lang, level: e.target.value })}
                    className="px-2 py-1.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Langue maternelle">Maternelle</option>
                    <option value="Courant / Bilingue (C1/C2)">Courant (C1/C2)</option>
                    <option value="Professionnel / Technique (B2)">Technique (B2)</option>
                    <option value="Intermédiaire (B1)">Intermédiaire (B1)</option>
                    <option value="Notions élémentaires (A1/A2)">Notions (A1/A2)</option>
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
                  <span>Télécharger mon CV Complet (PDF A4 Vectoriel)</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    100% Souverain
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Générez et téléchargez instantanément votre CV vectoriel A4 officiel compilé par le moteur Playwright.
                  Ce CV compile l'intégralité de vos informations déjà saisies : 
                  <span className="font-semibold text-foreground"> Coordonnées, Formations, Stages, Expériences, Projets, Compétences, Activités Extra-Professionnelles et Langues</span>.
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
                  Version FR
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
                  Version EN
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
                    <span>Compilation PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger mon CV (PDF)</span>
                  </>
                )}
              </button>

              <Link
                href="/cv"
                className="px-3.5 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors"
                title="Ouvrir le Studio CV pour personnaliser les marges, polices ou sections"
              >
                <span>Studio CV</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Quick checklist of included elements */}
          <div className="pt-4 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{stages.length} Stage{stages.length > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{profile.projects.length} Projet{profile.projects.length > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{(profile.extracurriculars || []).length} Activité{(profile.extracurriculars || []).length > 1 ? "s" : ""} extra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{(profile.languages || []).length} Langue{(profile.languages || []).length > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
