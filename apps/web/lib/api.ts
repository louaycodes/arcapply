const API_BASE_URL = process.env.NEXT_PUBLIC_ENGINE_API_URL || "http://localhost:8000";

export interface Education {
  id?: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
}

export interface Experience {
  id?: string;
  company: string;
  role: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  description: string;
  technologies: string[];
}

export interface Project {
  id?: string;
  title: string;
  role?: string | null;
  description: string;
  url?: string | null;
  technologies: string[];
}

export interface Skill {
  id?: string;
  name: string;
  category: string;
  level?: string | null;
}

export interface MasterProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website_url?: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  educations: Education[];
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
}

export interface ProfileCompletenessStatus {
  is_complete: boolean;
  can_generate: boolean;
  missing_fields: string[];
  completion_percentage: number;
}

export async function fetchProfile(): Promise<MasterProfile> {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch master profile: ${res.statusText}`);
  }
  return res.json();
}

export async function updateProfile(data: Partial<MasterProfile>): Promise<MasterProfile> {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to update master profile: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProfileStatus(): Promise<ProfileCompletenessStatus> {
  const res = await fetch(`${API_BASE_URL}/api/profile/status`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch profile status: ${res.statusText}`);
  }
  return res.json();
}

export async function verifyGenerationEligibility(): Promise<{
  status: string;
  message: string;
  completion_percentage: number;
}> {
  const res = await fetch(`${API_BASE_URL}/api/profile/can-generate`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.detail?.message || "Vérification d'éligibilité de génération échouée."
    );
  }
  return res.json();
}

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
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
  collected_at: string;
  updated_at: string;
}

export interface JobCollectRequest {
  keywords: string[];
  locations: string[];
  platforms: string[];
  limit_per_platform?: number;
}

export interface JobCollectSummary {
  collected_count: number;
  new_count: number;
  duplicate_count: number;
  platforms: string[];
  message: string;
}

export async function fetchJobs(params?: {
  country?: string;
  platform?: string;
  search?: string;
  include_archived?: boolean;
}): Promise<JobOffer[]> {
  const query = new URLSearchParams();
  if (params?.country && params.country !== "all") query.set("country", params.country);
  if (params?.platform && params.platform !== "all") query.set("platform", params.platform);
  if (params?.search) query.set("search", params.search);
  if (params?.include_archived) query.set("include_archived", "true");

  const url = `${API_BASE_URL}/api/jobs${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch jobs: ${res.statusText}`);
  }
  return res.json();
}

export async function collectJobs(payload: JobCollectRequest): Promise<JobCollectSummary> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail?.message || "Échec de la collecte d'offres.");
  }
  return res.json();
}

export async function archiveJob(jobId: string): Promise<JobOffer> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/archive`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(`Échec de l'archivage de l'offre: ${res.statusText}`);
  }
  return res.json();
}

export function createRadarEventSource(
  onJobDiscovered?: (job: JobOffer) => void,
  onProgress?: (progress: { platform: string; status: string; message: string }) => void,
  onError?: (err: any) => void,
  onJobStatusChanged?: (payload: { job_id: string; old_status: string; new_status: string }) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const eventSource = new EventSource(`${API_BASE_URL}/api/events`);

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
  const res = await fetch(`${API_BASE_URL}/api/ats/match/${jobId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ATS score: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBatchATSScores(): Promise<Record<string, ATSMatchResult>> {
  const res = await fetch(`${API_BASE_URL}/api/ats/batch`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch batch ATS scores: ${res.statusText}`);
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
  created_at: string;
}

export async function generateTargetedCV(jobId: string): Promise<TargetedCV> {
  const res = await fetch(`${API_BASE_URL}/api/cv/generate/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.detail?.message || "Échec de la génération du CV ciblé."
    );
  }
  return res.json();
}

export function getCVPreviewUrl(jobId: string): string {
  return `${API_BASE_URL}/api/cv/preview/${jobId}`;
}

export function getCVPdfDownloadUrl(jobId: string): string {
  return `${API_BASE_URL}/api/cv/pdf/${jobId}`;
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
  created_at: string;
  updated_at: string;
}

export async function generateCoverLetter(jobId: string): Promise<CoverLetter> {
  const res = await fetch(`${API_BASE_URL}/api/letter/generate/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.detail?.message || "Échec de la génération de la lettre de motivation."
    );
  }
  return res.json();
}

export async function fetchCoverLetter(jobId: string): Promise<CoverLetter> {
  const res = await fetch(`${API_BASE_URL}/api/letter/${jobId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch cover letter: ${res.statusText}`);
  }
  return res.json();
}

export async function updateCoverLetter(
  jobId: string,
  contentMarkdown: string
): Promise<CoverLetter> {
  const res = await fetch(`${API_BASE_URL}/api/letter/${jobId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content_markdown: contentMarkdown }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.detail?.message || "Échec de la mise à jour de la lettre."
    );
  }
  return res.json();
}

export async function transitionJobStatus(
  jobId: string,
  newStatus: string
): Promise<JobOffer> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/transition`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ new_status: newStatus }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.detail?.message || "Échec de la transition de statut."
    );
  }
  return res.json();
}



