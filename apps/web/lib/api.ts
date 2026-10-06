import { localizeServerMessage, trStored } from "./i18n";

const API_BASE_URL = process.env.NEXT_PUBLIC_ENGINE_API_URL || "http://localhost:8000";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("arcapply_token");
  const userStr = localStorage.getItem("arcapply_user");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u?.username) {
        headers["X-Username"] = u.username;
      }
    } catch (_) {}
  }
  return headers;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}


export interface Education {
  id?: string;
  school: string;
  degree: string;
  degree_fr?: string;
  degree_en?: string;
  field_of_study: string;
  field_of_study_fr?: string;
  field_of_study_en?: string;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
}

export interface Language {
  name: string;
  level: string;
}

export interface Extracurricular {
  organization: string;
  role: string;
  role_fr?: string;
  role_en?: string;
  date: string;
  description: string;
  description_fr?: string;
  description_en?: string;
}

export interface Experience {
  id?: string;
  company: string;
  role: string;
  role_fr?: string;
  role_en?: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  description: string;
  description_fr?: string;
  description_en?: string;
  technologies: string[];
  experience_type?: "stage" | "job";
}

export interface Project {
  id?: string;
  title: string;
  title_fr?: string;
  title_en?: string;
  role?: string | null;
  role_fr?: string;
  role_en?: string;
  description: string;
  description_fr?: string;
  description_en?: string;
  url?: string | null;
  technologies: string[];
}

export interface Skill {
  id?: string;
  name: string;
  category: string;
  level?: string | null;
}

export const SKILL_CATEGORIES = [
  "Frameworks",
  "Langages & Scripting",
  "Bases de données",
  "Versioning & Méthodes",
  "Systèmes & Réseaux",
  "Monitoring & Observabilité",
  "Infrastructure as Code",
  "Cloud & Infrastructure",
  "Conteneurisation & Orchestration",
  "Sécurité (DevSecOps)",
] as const;

// Libellés d'affichage anglais des catégories (la valeur stockée reste la clé française)
const SKILL_CATEGORY_LABELS_EN: Record<string, string> = {
  Frameworks: "Frameworks",
  "Langages & Scripting": "Languages & Scripting",
  "Bases de données": "Databases",
  "Versioning & Méthodes": "Versioning & Methods",
  "Systèmes & Réseaux": "Systems & Networks",
  "Monitoring & Observabilité": "Monitoring & Observability",
  "Infrastructure as Code": "Infrastructure as Code",
  "Cloud & Infrastructure": "Cloud & Infrastructure",
  "Conteneurisation & Orchestration": "Containerization & Orchestration",
  "Sécurité (DevSecOps)": "Security (DevSecOps)",
};

export function skillCategoryLabel(category: string, lang: "fr" | "en"): string {
  return lang === "en" ? SKILL_CATEGORY_LABELS_EN[category] || category : category;
}

export interface MasterProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  headline_fr?: string | null;
  headline_en?: string | null;
  bio?: string | null;
  bio_fr?: string | null;
  bio_en?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website_url?: string | null;
  languages_raw?: string;
  extracurriculars_raw?: string;
  is_complete: boolean;
  onboarding_completed?: boolean;
  groq_api_key?: string | null;
  groq_model?: string | null;
  /** Préférence de recherche : exclusivement "PFE". */
  search_mode: "PFE";
  created_at: string;
  updated_at: string;
  educations: Education[];
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  languages: Language[];
  extracurriculars: Extracurricular[];
}

export interface ProfileCompletenessStatus {
  is_complete: boolean;
  can_generate: boolean;
  missing_fields: string[];
  completion_percentage: number;
}

export async function fetchProfile(): Promise<MasterProfile> {
  const res = await authFetch(`${API_BASE_URL}/api/profile`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de charger le profil : ${res.statusText}`, `Failed to fetch master profile: ${res.statusText}`));
  }
  return res.json();
}

export async function updateProfile(data: Partial<MasterProfile>): Promise<MasterProfile> {
  const res = await authFetch(`${API_BASE_URL}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de mettre à jour le profil : ${res.statusText}`, `Failed to update master profile: ${res.statusText}`));
  }
  return res.json();
}

export async function fetchProfileStatus(): Promise<ProfileCompletenessStatus> {
  const res = await authFetch(`${API_BASE_URL}/api/profile/status`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de charger le statut du profil : ${res.statusText}`, `Failed to fetch profile status: ${res.statusText}`));
  }
  return res.json();
}

export async function verifyGenerationEligibility(): Promise<{
  status: string;
  message: string;
  completion_percentage: number;
}> {
  const res = await authFetch(`${API_BASE_URL}/api/profile/can-generate`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      localizeServerMessage(errorData?.detail?.message) || trStored("Vérification d'éligibilité de génération échouée.", "Generation eligibility check failed.")
    );
  }
  return res.json();
}

export async function testGroqKey(
  apiKey: string,
  model?: string
): Promise<{ status: string; message: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/profile/test-groq-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groq_api_key: apiKey, groq_model: model }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      typeof errorData?.detail === "string"
        ? localizeServerMessage(errorData.detail)
        : localizeServerMessage(errorData?.detail?.message) || trStored("Échec de validation de la clé Groq.", "Groq key validation failed.");
    throw new Error(message);
  }
  return res.json();
}

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface JobOffer {
  id: string;
  platform: string;
  external_id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description_raw: string;
  url: string;
  status: string;
  offer_type?: "PFE" | "STAGE" | "JOB" | string;
  is_applied?: boolean;
  applied_at?: string | null;
  published_at?: string | null;
  skills_required?: string;
  contract_duration?: string;
  work_mode?: string;
  salary_stipend?: string;
  department?: string;
  is_direct_career_site?: boolean;
  apply_url?: string;
  collected_at: string;
  updated_at: string;
}

export interface JobCollectRequest {
  keywords?: string[];
  locations?: string[];
  platforms?: string[];
  limit_per_platform?: number;
}

export interface JobCollectSummary {
  collected_count: number;
  new_count: number;
  duplicate_count: number;
  platforms: string[];
  by_platform?: Record<string, number>;
  message: string;
}

export async function fetchJobs(params?: {
  country?: string;
  platform?: string;
  search?: string;
  offer_type?: string;
  period?: "all" | "today" | "week" | "month";
  direct_only?: boolean;
  include_archived?: boolean;
}): Promise<JobOffer[]> {
  const query = new URLSearchParams();
  if (params?.country && params.country !== "all") query.set("country", params.country);
  if (params?.platform && params.platform !== "all") query.set("platform", params.platform);
  if (params?.search) query.set("search", params.search);
  if (params?.offer_type) query.set("offer_type", params.offer_type);
  if (params?.period && params.period !== "all") query.set("period", params.period);
  if (params?.direct_only) query.set("direct_only", "true");
  if (params?.include_archived) query.set("include_archived", "true");

  const url = `${API_BASE_URL}/api/jobs${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url, { cache: "no-store" });
  if (!res.ok) {

    throw new Error(trStored(`Impossible de charger les offres : ${res.statusText}`, `Failed to fetch jobs: ${res.statusText}`));
  }
  return res.json();
}

export async function collectJobs(payload: JobCollectRequest): Promise<JobCollectSummary> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Échec de la collecte d'offres.", "Offer collection failed."));
  }
  return res.json();
}

export interface SourceTelemetry {
  name: string;
  country: string;
  status: "idle" | "running" | "error";
  total_discovered: number;
}

export interface SourcesRegistryStatus {
  is_crawling: boolean;
  last_crawl: string | null;
  sources: SourceTelemetry[];
}

export async function fetchSourcesStatus(): Promise<SourcesRegistryStatus> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/sources`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de charger les sources : ${res.statusText}`, `Failed to fetch sources: ${res.statusText}`));
  }
  return res.json();
}

export async function crawlAllSources(payload?: JobCollectRequest): Promise<JobCollectSummary> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/crawl-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Échec de l'ingestion multi-sources.", "Multi-source ingestion failed."));
  }
  return res.json();
}

export async function archiveJob(jobId: string): Promise<JobOffer> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/${jobId}/archive`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(trStored(`Échec de l'archivage de l'offre : ${res.statusText}`, `Failed to archive the offer: ${res.statusText}`));
  }
  return res.json();
}

export async function clearAllJobs(): Promise<{ status: string; message: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/clear`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Échec de la suppression des offres.", "Failed to delete the offers."));
  }
  return res.json();
}

export function createRadarEventSource(
  onJobDiscovered?: (job: JobOffer) => void,
  onProgress?: (progress: { platform: string; status: string; count?: number; message: string }) => void,
  onError?: (err: any) => void,
  onJobStatusChanged?: (payload: { job_id: string; old_status: string; new_status: string }) => void,
  onEmailReceived?: (payload: { id: string; category: string; company?: string; subject: string; snippet?: string }) => void,
  onJobsCleared?: () => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let sseUrl = `${API_BASE_URL}/api/events`;
  const token = localStorage.getItem("arcapply_token");
  const userStr = localStorage.getItem("arcapply_user");
  const params = new URLSearchParams();
  if (token) {
    params.set("token", token);
  }
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u?.username) params.set("username", u.username);
    } catch (_) {}
  }
  if (params.toString()) {
    sseUrl += `?${params.toString()}`;
  }

  const eventSource = new EventSource(sseUrl);

  eventSource.addEventListener("JOB_DISCOVERED", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      if (onJobDiscovered && data.payload) {
        onJobDiscovered(data.payload);
      }
    } catch (err) {
      console.error("Error parsing JOB_DISCOVERED event:", err);
    }
  });

  eventSource.addEventListener("SCRAPE_PROGRESS", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      if (onProgress && data.payload) {
        onProgress(data.payload);
      }
    } catch (err) {
      console.error("Error parsing SCRAPE_PROGRESS event:", err);
    }
  });

  eventSource.addEventListener("JOB_STATUS_CHANGED", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      if (onJobStatusChanged && data.payload) {
        onJobStatusChanged(data.payload);
      }
    } catch (err) {
      console.error("Error parsing JOB_STATUS_CHANGED event:", err);
    }
  });

  eventSource.addEventListener("EMAIL_RECEIVED", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      if (onEmailReceived && data.payload) {
        onEmailReceived(data.payload);
      }
    } catch (err) {
      console.error("Error parsing EMAIL_RECEIVED event:", err);
    }
  });

  eventSource.addEventListener("JOBS_CLEARED", () => {
    try {
      if (onJobsCleared) {
        onJobsCleared();
      }
    } catch (err) {
      console.error("Error parsing JOBS_CLEARED event:", err);
    }
  });

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}

export interface ATSMatchResult {
  job_id: string;
  score: number;
  matched_skills: string[];
  transferable_skills: string[];
  missing_skills: string[];
  total_required: number;
}

export async function fetchJobATSScore(jobId: string): Promise<ATSMatchResult> {
  const res = await authFetch(`${API_BASE_URL}/api/ats/match/${jobId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de calculer le score ATS : ${res.statusText}`, `Failed to fetch ATS score: ${res.statusText}`));
  }
  return res.json();
}

export async function fetchBatchATSScores(): Promise<Record<string, ATSMatchResult>> {
  const res = await authFetch(`${API_BASE_URL}/api/ats/batch`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de calculer les scores ATS : ${res.statusText}`, `Failed to fetch batch ATS scores: ${res.statusText}`));
  }
  return res.json();
}

export interface TargetedCV {
  id: string;
  job_id: string;
  profile_id: string;
  headline: string;
  summary: string;
  matched_skills: string[];
  transferable_skills: string[];
  experiences: any[];
  projects: any[];
  educations: any[];
  html_content: string;
  language?: string;
  created_at: string;
}

export async function generateTargetedCV(jobId: string, lang: string = "fr"): Promise<TargetedCV> {
  const res = await authFetch(`${API_BASE_URL}/api/cv/generate/${jobId}?lang=${lang}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      typeof errorData?.detail === "string"
        ? localizeServerMessage(errorData.detail)
        : localizeServerMessage(errorData?.detail?.message) || trStored("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.");
    throw new Error(message);
  }
  return res.json();
}

export function getCVPreviewUrl(jobId: string, lang: string = "fr"): string {
  let authParams = "";
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("arcapply_token");
    const userStr = localStorage.getItem("arcapply_user");
    if (token) authParams += `&token=${encodeURIComponent(token)}`;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.username) authParams += `&username=${encodeURIComponent(u.username)}`;
      } catch {}
    }
  }
  return `${API_BASE_URL}/api/cv/preview/${jobId}?lang=${lang}${authParams}`;
}

export function getCVPdfDownloadUrl(jobId: string, lang: string = "fr"): string {
  let authParams = "";
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("arcapply_token");
    const userStr = localStorage.getItem("arcapply_user");
    if (token) authParams += `&token=${encodeURIComponent(token)}`;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.username) authParams += `&username=${encodeURIComponent(u.username)}`;
      } catch {}
    }
  }
  return `${API_BASE_URL}/api/cv/pdf/${jobId}?lang=${lang}${authParams}`;
}

// ============================================================================
// Studio CV — Interactive Editor & Pixel-Perfect PDF Types and APIs
// ============================================================================

export interface ParsedEducation {
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ParsedExperience {
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  technologies: string[];
}

export interface ParsedProject {
  title: string;
  role: string;
  url: string;
  description: string;
  technologies: string[];
}

export interface ParsedSkillCategory {
  title: string;
  skills: string[];
}

export interface ParsedExtracurricular {
  role: string;
  organization: string;
  date: string;
  description: string;
}

export interface CustomCVData {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  portfolio_url: string;
  linkedin_url: string;
  github_url: string;
  summary: string;
  educations: ParsedEducation[];
  experiences: ParsedExperience[];
  projects: ParsedProject[];
  skills_categories: ParsedSkillCategory[];
  extracurricular: ParsedExtracurricular[];
  languages: string[];
  language: "fr" | "en";
  font_size_pt: number;
  line_height: number;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  html_content?: string;
}

export async function uploadCVFile(
  file: File,
  syncToProfile: boolean = false
): Promise<{ filename: string; data: CustomCVData; html_content: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(`${API_BASE_URL}/api/cv/upload?sync_to_profile=${syncToProfile}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Échec de l'analyse du CV.", "CV parsing failed."));
  }
  return res.json();
}

export async function renderCustomCV(data: CustomCVData): Promise<string> {
  const res = await authFetch(`${API_BASE_URL}/api/cv/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Échec du rendu du CV.", "CV rendering failed."));
  }
  const json = await res.json();
  return json.html_content;
}

export async function compileCustomCVPdf(
  htmlContent: string,
  filename: string = "CV_Candidat.pdf"
): Promise<Blob> {
  const res = await authFetch(`${API_BASE_URL}/api/cv/compile-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html_content: htmlContent, filename }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Échec de la compilation PDF vectorielle.", "Vector PDF compilation failed."));
  }
  return res.blob();
}

export async function downloadProfileCVPdf(lang: string = "fr"): Promise<Blob> {
  const res = await authFetch(`${API_BASE_URL}/api/cv/profile-pdf?lang=${lang}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Erreur lors du téléchargement du CV.", "Error while downloading the CV."));
  }
  return res.blob();
}

export async function fetchCVFromProfile(
  lang: "fr" | "en" = "fr"
): Promise<{ data: CustomCVData; html_content: string; is_profile_empty?: boolean }> {
  const res = await authFetch(`${API_BASE_URL}/api/cv/from-profile?lang=${lang}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Impossible de charger votre profil.", "Unable to load your profile."));
  }
  return res.json();
}

export async function saveCVDraft(data: CustomCVData): Promise<{ status: string; id: string; updated_at: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/cv/save-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Échec de la sauvegarde du brouillon.", "Failed to save the draft."));
  }
  return res.json();
}

export async function fetchCVDraft(): Promise<{
  data: CustomCVData | null;
  html_content: string;
  has_draft: boolean;
  is_profile_empty?: boolean;
  updated_at?: string;
}> {
  const res = await authFetch(`${API_BASE_URL}/api/cv/draft`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Échec de récupération du brouillon : ${res.statusText}`, `Failed to fetch the draft: ${res.statusText}`));
  }
  return res.json();
}

export interface CoverLetter {
  id: string;
  job_id: string;
  profile_id: string;
  target_role: string;
  company_name: string;
  content_markdown: string;
  cliche_score: number;
  banned_phrases_detected: string[];
  thinking_plan?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}

export async function generateCoverLetter(jobId: string, lang: string = "fr"): Promise<CoverLetter> {
  const res = await authFetch(`${API_BASE_URL}/api/letter/generate/${jobId}?lang=${lang}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      typeof errorData?.detail === "string"
        ? localizeServerMessage(errorData.detail)
        : localizeServerMessage(errorData?.detail?.message) || trStored("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.");
    throw new Error(message);
  }
  return res.json();
}

export async function fetchCoverLetter(jobId: string, lang: string = "fr"): Promise<CoverLetter> {
  const res = await authFetch(`${API_BASE_URL}/api/letter/${jobId}?lang=${lang}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de charger la lettre : ${res.statusText}`, `Failed to fetch cover letter: ${res.statusText}`));
  }
  return res.json();
}

export async function updateCoverLetter(
  jobId: string,
  contentMarkdown: string
): Promise<CoverLetter> {
  const res = await authFetch(`${API_BASE_URL}/api/letter/${jobId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content_markdown: contentMarkdown }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      localizeServerMessage(errorData?.detail?.message) || trStored("Échec de la mise à jour de la lettre.", "Failed to update the letter.")
    );
  }
  return res.json();
}

export type CoverLetterFormat = "pdf" | "html" | "jpeg" | "txt";

export function getCoverLetterDownloadUrl(
  jobId: string,
  format: CoverLetterFormat = "pdf",
  lang: string = "fr"
): string {
  let authParams = "";
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("arcapply_token");
    const userStr = localStorage.getItem("arcapply_user");
    if (token) authParams += `&token=${encodeURIComponent(token)}`;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.username) authParams += `&username=${encodeURIComponent(u.username)}`;
      } catch {}
    }
  }
  return `${API_BASE_URL}/api/letter/download/${jobId}?format=${format}&lang=${lang}${authParams}`;
}

export async function downloadTargetedCVPdf({
  jobId,
  companyName,
  lang = "fr",
}: {
  jobId: string;
  companyName?: string;
  lang?: string;
}): Promise<void> {
  const url = `${API_BASE_URL}/api/cv/pdf/${jobId}?lang=${lang}`;
  const response = await authFetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(localizeServerMessage(errorData?.detail?.message) || trStored("Erreur lors du téléchargement du CV.", "Error while downloading the CV."));
  }

  const blob = await response.blob();
  const cleanCompany = (companyName || "").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  let filename = cleanCompany ? `CV_${cleanCompany}_${lang.toUpperCase()}.pdf` : `CV_${lang.toUpperCase()}.pdf`;

  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches?.[1]) {
      const serverFilename = matches[1].replace(/['"]/g, "").trim();
      if (serverFilename) {
        filename = serverFilename;
      }
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
}

export async function downloadCoverLetterFile({
  jobId,
  format = "pdf",
  content,
  jobTitle,
  companyName,
  lang = "fr",
}: {
  jobId?: string;
  format: CoverLetterFormat;
  content?: string;
  jobTitle?: string;
  companyName?: string;
  lang?: string;
}): Promise<void> {
  let response: Response;
  if (content) {
    response = await authFetch(`${API_BASE_URL}/api/letter/download/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_markdown: content,
        job_id: jobId,
        job_title: jobTitle,
        company_name: companyName,
        format,
        lang,
      }),
    });
  } else if (jobId) {
    response = await authFetch(
      `${API_BASE_URL}/api/letter/download/${jobId}?format=${format}&lang=${lang}`
    );
  } else {
    throw new Error(trStored("Impossible de télécharger la lettre sans offre ou contenu.", "Cannot download the letter without an offer or content."));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      localizeServerMessage(errorData?.detail?.message) || trStored("Erreur lors du téléchargement de la lettre.", "Error while downloading the letter.")
    );
  }

  const blob = await response.blob();
  const cleanCompany = (companyName || "").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  let filename = cleanCompany ? `Lettre_${cleanCompany}.${format}` : `Lettre_Motivation.${format}`;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches?.[1]) {
      const serverFilename = matches[1].replace(/['"]/g, "").trim();
      if (serverFilename) {
        filename = serverFilename;
      }
    }
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function transitionJobStatus(
  jobId: string,
  newStatus: string
): Promise<JobOffer> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/${jobId}/transition`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ new_status: newStatus }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      localizeServerMessage(errorData?.detail?.message) || trStored("Échec de la transition de statut.", "Status transition failed.")
    );
  }
  return res.json();
}

export async function markJobAsApplied(jobId: string): Promise<JobOffer> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/${jobId}/mark-applied`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      localizeServerMessage(errorData?.detail?.message) || trStored("Échec du marquage de l'offre comme déjà postulée.", "Failed to mark the offer as already applied.")
    );
  }
  return res.json();
}

export async function unmarkJobAsApplied(jobId: string): Promise<JobOffer> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/${jobId}/unmark-applied`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      localizeServerMessage(errorData?.detail?.message) || trStored("Échec de l'annulation du statut postulé.", "Failed to undo the applied status.")
    );
  }
  return res.json();
}

export interface PipelineMetrics {
  total_tracked: number;
  by_status: Record<string, number>;
  submitted_total: number;
  active_count: number;
  interview_count: number;
  offer_count: number;
  rejected_count: number;
  interview_rate_percent: number;
  response_rate_percent: number;
  stale_relance_count: number;
}

export async function fetchPipelineMetrics(): Promise<PipelineMetrics> {
  const res = await authFetch(`${API_BASE_URL}/api/jobs/metrics`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de charger les indicateurs : ${res.statusText}`, `Failed to fetch pipeline metrics: ${res.statusText}`));
  }
  return res.json();
}

export interface EmailInteraction {
  id: string;
  job_id?: string | null;
  sender: string;
  recipient: string;
  subject: string;
  snippet: string;
  category: "INTERVIEW" | "REJECTION" | "ACKNOWLEDGEMENT" | "OTHER";
  raw_body?: string;
  received_at: string;
  created_at: string;
  company_name?: string | null;
  job_title?: string | null;
}

export interface EmailSimulatePayload {
  sender: string;
  subject: string;
  body: string;
  company_hint?: string;
}

export async function fetchRecentEmails(limit = 30): Promise<EmailInteraction[]> {
  const res = await authFetch(`${API_BASE_URL}/api/emails/recent?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de charger les emails recruteurs : ${res.statusText}`, `Failed to fetch recent recruiter emails: ${res.statusText}`));
  }
  return res.json();
}

export async function simulateIncomingEmail(
  payload: EmailSimulatePayload
): Promise<EmailInteraction> {
  const res = await authFetch(`${API_BASE_URL}/api/emails/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de simuler l'email entrant : ${res.statusText}`, `Failed to simulate incoming email: ${res.statusText}`));
  }
  return res.json();
}

export async function triggerEmailSync(): Promise<{
  status: string;
  message: string;
  total_archived: number;
  last_sync: string;
}> {
  const res = await authFetch(`${API_BASE_URL}/api/emails/ingest`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(trStored(`Impossible de lancer la synchronisation des emails : ${res.statusText}`, `Failed to trigger email sync: ${res.statusText}`));
  }
  return res.json();
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  onboarding_completed?: boolean;
  playbook_initialized?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      localizeServerMessage(errorData.detail?.message || errorData.detail) ||
      trStored("Nom d'utilisateur ou mot de passe incorrect", "Incorrect username or password");
    throw new Error(message);
  }
  return res.json();
}

export async function registerUser(email: string, password: string, fullName?: string): Promise<LoginResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      localizeServerMessage(errorData.detail?.message || errorData.detail) || trStored("Échec de l'inscription", "Sign-up failed");
    throw new Error(message);
  }
  return res.json();
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const res = await authFetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(trStored("Session invalide ou expirée", "Invalid or expired session"));
  }
  return res.json();
}

export async function completeOnboarding(): Promise<User> {
  const res = await authFetch(`${API_BASE_URL}/api/auth/complete-onboarding`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Impossible de finaliser le guide d'onboarding");
  }
  return res.json();
}


// ============================================================================
// Agent Playbook & Strategic Guidelines API
// ============================================================================

export interface AgentPlaybookRule {
  id: string;
  user_id: string;
  title: string;
  condition_trigger: string;
  action_instruction: string;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export async function fetchPlaybookRules(): Promise<AgentPlaybookRule[]> {
  const res = await authFetch(`${API_BASE_URL}/api/agent/playbook`);
  if (!res.ok) throw new Error("Impossible de charger les directives de l'agent");
  return res.json();
}

export async function createPlaybookRule(data: {
  title: string;
  condition_trigger: string;
  action_instruction: string;
  category?: string;
  is_active?: boolean;
}): Promise<AgentPlaybookRule> {
  const res = await authFetch(`${API_BASE_URL}/api/agent/playbook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(trStored("Impossible de créer la directive", "Unable to create the directive"));
  return res.json();
}

export async function updatePlaybookRule(
  ruleId: string,
  data: Partial<AgentPlaybookRule>
): Promise<AgentPlaybookRule> {
  const res = await authFetch(`${API_BASE_URL}/api/agent/playbook/${ruleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(trStored("Impossible de mettre à jour la directive", "Unable to update the directive"));
  return res.json();
}

export async function deletePlaybookRule(ruleId: string): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/api/agent/playbook/${ruleId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Impossible de supprimer la directive");
}

export async function restorePlaybookTemplates(): Promise<AgentPlaybookRule[]> {
  const res = await authFetch(`${API_BASE_URL}/api/agent/playbook/restore-templates`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(trStored("Impossible de restaurer les modèles recommandés", "Unable to restore the recommended templates"));
  return res.json();
}


// ============================================================================
// Agent Deep Recon API
// ============================================================================

export interface ReconDossier {
  id: string;
  job_id: string;
  user_id: string;
  external_url?: string | null;
  full_description: string;
  company_name: string;
  company_website?: string | null;
  company_mission?: string | null;
  company_culture?: string | null;
  tech_stack_detected: string[];
  investigation_notes?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  created_at: string;
  updated_at: string;
}

export async function fetchReconDossier(jobId: string): Promise<ReconDossier | null> {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/recon/dossier/${jobId}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function triggerReconInvestigation(jobId: string): Promise<{ status: string; message: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/recon/trigger/${jobId}`, {
    method: "POST",
  });
  if (!res.ok) {
    let detail = trStored("Impossible de déclencher l'enquête Deep Recon", "Unable to trigger the Deep Recon investigation");
    try {
      const errData = await res.json();
      if (errData?.detail?.message) detail = localizeServerMessage(errData.detail.message);
      else if (typeof errData?.detail === "string") detail = localizeServerMessage(errData.detail);
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}






