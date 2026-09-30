import json
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, Relationship, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


# ============================================================================
# Database Entities (SQLModel)
# ============================================================================

class EducationBase(SQLModel):
    school: str = Field(default="")
    degree: str = Field(default="")
    field_of_study: str = Field(default="")
    start_date: str = Field(default="")
    end_date: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)


class Education(EducationBase, table=True):
    __tablename__ = "educations"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    profile_id: str = Field(foreign_key="master_profiles.id", index=True)

    profile: Optional["MasterProfile"] = Relationship(back_populates="educations")


class LanguageBase(SQLModel):
    name: str = Field(default="")
    level: str = Field(default="Courant")


class ExtracurricularBase(SQLModel):
    organization: str = Field(default="")
    role: str = Field(default="")
    date: str = Field(default="")
    description: str = Field(default="")


class ExperienceBase(SQLModel):
    company: str = Field(default="")
    role: str = Field(default="")
    location: Optional[str] = Field(default=None)
    start_date: str = Field(default="")
    end_date: Optional[str] = Field(default=None)
    description: str = Field(default="")
    technologies: list[str] = Field(default_factory=list)
    experience_type: str = Field(default="stage")  # "stage" | "job"


class Experience(SQLModel, table=True):
    __tablename__ = "experiences"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    profile_id: str = Field(foreign_key="master_profiles.id", index=True)
    company: str = Field(default="")
    role: str = Field(default="")
    location: Optional[str] = Field(default=None)
    start_date: str = Field(default="")
    end_date: Optional[str] = Field(default=None)
    description: str = Field(default="")
    technologies_raw: str = Field(default="")  # Comma separated or JSON
    experience_type: str = Field(default="stage")

    profile: Optional["MasterProfile"] = Relationship(back_populates="experiences")

    @property
    def technologies(self) -> list[str]:
        if not self.technologies_raw:
            return []
        raw = self.technologies_raw.replace(";", ",")
        return [t.strip() for t in raw.split(",") if t.strip()]

    @technologies.setter
    def technologies(self, values: list[str]) -> None:
        self.technologies_raw = ",".join(values)


class ProjectBase(SQLModel):
    title: str = Field(default="")
    role: Optional[str] = Field(default=None)
    description: str = Field(default="")
    url: Optional[str] = Field(default=None)
    technologies: list[str] = Field(default_factory=list)


class Project(SQLModel, table=True):
    __tablename__ = "projects"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    profile_id: str = Field(foreign_key="master_profiles.id", index=True)
    title: str = Field(default="")
    role: Optional[str] = Field(default=None)
    description: str = Field(default="")
    url: Optional[str] = Field(default=None)
    technologies_raw: str = Field(default="")

    profile: Optional["MasterProfile"] = Relationship(back_populates="projects")

    @property
    def technologies(self) -> list[str]:
        if not self.technologies_raw:
            return []
        raw = self.technologies_raw.replace(";", ",")
        return [t.strip() for t in raw.split(",") if t.strip()]

    @technologies.setter
    def technologies(self, values: list[str]) -> None:
        self.technologies_raw = ",".join(values)


class SkillBase(SQLModel):
    name: str = Field(default="")
    category: str = Field(default="Technologies")
    level: Optional[str] = Field(default=None)


class Skill(SkillBase, table=True):
    __tablename__ = "skills"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    profile_id: str = Field(foreign_key="master_profiles.id", index=True)

    profile: Optional["MasterProfile"] = Relationship(back_populates="skills")


class MasterProfileBase(SQLModel):
    full_name: str = Field(default="")
    email: str = Field(default="")
    phone: Optional[str] = Field(default=None)
    location: Optional[str] = Field(default=None)
    headline: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    linkedin_url: Optional[str] = Field(default=None)
    github_url: Optional[str] = Field(default=None)
    website_url: Optional[str] = Field(default=None)
    # Préférence de recherche : "PFE" (stage de fin d'études) ou "JOB" (emploi CDI/CDD)
    search_mode: str = Field(default="PFE", index=True)
    languages_raw: str = Field(default="[]")
    extracurriculars_raw: str = Field(default="[]")
    user_id: str = Field(default="louay", index=True)


class MasterProfile(MasterProfileBase, table=True):
    __tablename__ = "master_profiles"
    id: str = Field(default="default-profile", primary_key=True)
    is_complete: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    educations: list[Education] = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )
    experiences: list[Experience] = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )
    projects: list[Project] = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )
    skills: list[Skill] = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )

    @property
    def languages(self) -> list[LanguageBase]:
        try:
            items = json.loads(self.languages_raw or "[]")
            return [LanguageBase(**item) if isinstance(item, dict) else LanguageBase(name=str(item)) for item in items]
        except Exception:
            return []

    @languages.setter
    def languages(self, values: list) -> None:
        raw_list = [v.model_dump() if hasattr(v, "model_dump") else v for v in (values or [])]
        self.languages_raw = json.dumps(raw_list, ensure_ascii=False)

    @property
    def extracurriculars(self) -> list[ExtracurricularBase]:
        try:
            items = json.loads(self.extracurriculars_raw or "[]")
            return [ExtracurricularBase(**item) if isinstance(item, dict) else ExtracurricularBase(organization=str(item)) for item in items]
        except Exception:
            return []

    @extracurriculars.setter
    def extracurriculars(self, values: list) -> None:
        raw_list = [v.model_dump() if hasattr(v, "model_dump") else v for v in (values or [])]
        self.extracurriculars_raw = json.dumps(raw_list, ensure_ascii=False)


# ============================================================================
# API Schemas (Pydantic / DTOs)
# ============================================================================

class EducationRead(EducationBase):
    id: str
    profile_id: str


class ExperienceRead(ExperienceBase):
    id: str
    profile_id: str


class ProjectRead(ProjectBase):
    id: str
    profile_id: str


class SkillRead(SkillBase):
    id: str
    profile_id: str


class MasterProfileRead(MasterProfileBase):
    id: str
    is_complete: bool
    search_mode: str
    created_at: datetime
    updated_at: datetime
    educations: list[EducationRead] = []
    experiences: list[ExperienceRead] = []
    projects: list[ProjectRead] = []
    skills: list[SkillRead] = []
    languages: list[LanguageBase] = []
    extracurriculars: list[ExtracurricularBase] = []


VALID_SEARCH_MODES = {"PFE"}


class MasterProfileUpdate(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    # Préférence de recherche : exclusivement "PFE"
    search_mode: Optional[str] = None
    educations: Optional[list[EducationBase]] = None
    experiences: Optional[list[ExperienceBase]] = None
    projects: Optional[list[ProjectBase]] = None
    skills: Optional[list[SkillBase]] = None
    languages: Optional[list[LanguageBase]] = None
    extracurriculars: Optional[list[ExtracurricularBase]] = None


class ProfileCompletenessStatus(SQLModel):
    is_complete: bool
    can_generate: bool
    missing_fields: list[str] = []
    completion_percentage: int = 0


# ============================================================================
# Job Offers (Radar & Application Pipeline - 100% PFE)
# ============================================================================

VALID_OFFER_TYPES = {"PFE"}


class JobOfferBase(SQLModel):
    platform: str = Field(index=True)  # "linkedin" | "jobteaser" | "top100" ...
    external_id: str = Field(index=True)
    title: str = Field(index=True)
    company: str = Field(index=True)
    location: str = Field(default="")
    country: str = Field(default="France", index=True)
    description_raw: str = Field(default="")
    url: str = Field(default="")
    status: str = Field(default="DISCOVERED", index=True)
    # Type d'offre : exclusivement "PFE"
    offer_type: str = Field(default="PFE", index=True)
    # Deep Extraction & Métadonnées d'enrichissement
    published_at: Optional[datetime] = Field(default=None, index=True)
    skills_required: str = Field(default="[]")
    contract_duration: str = Field(default="")
    salary_stipend: str = Field(default="")
    department: str = Field(default="")
    is_direct_career_site: bool = Field(default=False, index=True)
    apply_url: str = Field(default="")
    user_id: str = Field(default="louay", index=True)


class JobOffer(JobOfferBase, table=True):
    __tablename__ = "job_offers"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    collected_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class JobOfferRead(JobOfferBase):
    id: str
    collected_at: datetime
    updated_at: datetime


class JobCollectRequest(SQLModel):
    keywords: list[str] = ["PFE", "Stage Ingénieur"]
    locations: list[str] = ["France", "Tunisie"]
    platforms: list[str] = ["linkedin", "jobteaser"]
    limit_per_platform: int = 5


class JobCollectSummary(SQLModel):
    collected_count: int
    new_count: int
    duplicate_count: int
    platforms: list[str]
    message: str


# ============================================================================
# ATS Matching Results (Deterministic Alignment)
# ============================================================================

class ATSMatchResult(SQLModel):
    job_id: str
    score: int
    matched_skills: list[str] = []
    transferable_skills: list[str] = []
    missing_skills: list[str] = []
    total_required: int = 0
    calculated_at: datetime = Field(default_factory=utc_now)


# ============================================================================
# Targeted CV (Zero-Hallucination & ATS 1-page Render)
# ============================================================================

class TargetedCVBase(SQLModel):
    job_id: str = Field(foreign_key="job_offers.id", index=True)
    profile_id: str = Field(foreign_key="master_profiles.id", index=True)
    headline: str = Field(default="")
    summary: str = Field(default="")
    matched_skills_raw: str = Field(default="[]")
    transferable_skills_raw: str = Field(default="[]")
    experiences_raw: str = Field(default="[]")
    projects_raw: str = Field(default="[]")
    educations_raw: str = Field(default="[]")
    html_content: str = Field(default="")
    language: str = Field(default="fr", index=True)
    user_id: str = Field(default="louay", index=True)


class TargetedCV(TargetedCVBase, table=True):
    __tablename__ = "targeted_cvs"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    @property
    def matched_skills(self) -> list[str]:
        return json.loads(self.matched_skills_raw) if self.matched_skills_raw else []

    @matched_skills.setter
    def matched_skills(self, value: list[str]) -> None:
        self.matched_skills_raw = json.dumps(value)

    @property
    def transferable_skills(self) -> list[str]:
        return json.loads(self.transferable_skills_raw) if self.transferable_skills_raw else []

    @transferable_skills.setter
    def transferable_skills(self, value: list[str]) -> None:
        self.transferable_skills_raw = json.dumps(value)

    @property
    def experiences(self) -> list[dict]:
        return json.loads(self.experiences_raw) if self.experiences_raw else []

    @experiences.setter
    def experiences(self, value: list[dict]) -> None:
        self.experiences_raw = json.dumps(value)

    @property
    def projects(self) -> list[dict]:
        return json.loads(self.projects_raw) if self.projects_raw else []

    @projects.setter
    def projects(self, value: list[dict]) -> None:
        self.projects_raw = json.dumps(value)

    @property
    def educations(self) -> list[dict]:
        return json.loads(self.educations_raw) if self.educations_raw else []

    @educations.setter
    def educations(self, value: list[dict]) -> None:
        self.educations_raw = json.dumps(value)


class TargetedCVRead(SQLModel):
    id: str
    job_id: str
    profile_id: str
    headline: str
    summary: str
    matched_skills: list[str]
    transferable_skills: list[str]
    experiences: list[dict]
    projects: list[dict]
    educations: list[dict]
    html_content: str
    language: str = "fr"
    created_at: datetime


# ============================================================================
# Cover Letter (Anti-Cliché & Fact-Based Sober Pitch)
# ============================================================================

class CoverLetterBase(SQLModel):
    job_id: str = Field(foreign_key="job_offers.id", index=True)
    profile_id: str = Field(foreign_key="master_profiles.id", index=True)
    target_role: str = Field(default="")
    company_name: str = Field(default="")
    content_markdown: str = Field(default="")
    cliche_score: int = Field(default=0)
    banned_phrases_detected_raw: str = Field(default="[]")
    user_id: str = Field(default="louay", index=True)


class CoverLetter(CoverLetterBase, table=True):
    __tablename__ = "cover_letters"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    @property
    def banned_phrases_detected(self) -> list[str]:
        return json.loads(self.banned_phrases_detected_raw) if self.banned_phrases_detected_raw else []

    @banned_phrases_detected.setter
    def banned_phrases_detected(self, value: list[str]) -> None:
        self.banned_phrases_detected_raw = json.dumps(value)


class CoverLetterRead(SQLModel):
    id: str
    job_id: str
    profile_id: str
    target_role: str
    company_name: str
    content_markdown: str
    cliche_score: int
    banned_phrases_detected: list[str]
    created_at: datetime
    updated_at: datetime


class CoverLetterUpdate(SQLModel):
    content_markdown: str


# ============================================================================
# Recruiter Email Ingestion & Status Auto-Updates
# ============================================================================

class EmailInteractionBase(SQLModel):
    job_id: Optional[str] = Field(default=None, foreign_key="job_offers.id", index=True)
    sender: str
    recipient: str = Field(default="me@arcapply.local")
    subject: str
    snippet: str
    category: str = Field(default="OTHER", index=True)  # "INTERVIEW" | "REJECTION" | "ACKNOWLEDGEMENT" | "OTHER"
    raw_body: str = Field(default="")
    received_at: datetime = Field(default_factory=utc_now)
    user_id: str = Field(default="louay", index=True)


class EmailInteraction(EmailInteractionBase, table=True):
    __tablename__ = "email_interactions"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=utc_now)


class EmailInteractionRead(EmailInteractionBase):
    id: str
    created_at: datetime
    company_name: Optional[str] = None
    job_title: Optional[str] = None


class EmailSimulateRequest(SQLModel):
    sender: str
    subject: str
    body: str
    company_hint: Optional[str] = None


# ============================================================================
# Studio CV — Custom CV Editor & Parser Models
# ============================================================================

class ParsedEducation(SQLModel):
    school: str = ""
    degree: str = ""
    field_of_study: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class ParsedExperience(SQLModel):
    company: str = ""
    role: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""
    technologies: list[str] = []
    experience_type: str = "stage"


class ParsedProject(SQLModel):
    title: str = ""
    role: str = ""
    url: str = ""
    description: str = ""
    technologies: list[str] = []


class ParsedSkillCategory(SQLModel):
    title: str = ""
    skills: list[str] = []


class ParsedExtracurricular(SQLModel):
    role: str = ""
    organization: str = ""
    date: str = ""
    description: str = ""


class CustomCVData(SQLModel):
    full_name: str = ""
    headline: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    portfolio_url: str = ""
    linkedin_url: str = ""
    github_url: str = ""
    summary: str = ""
    educations: list[ParsedEducation] = []
    experiences: list[ParsedExperience] = []
    projects: list[ParsedProject] = []
    skills_categories: list[ParsedSkillCategory] = []
    extracurricular: list[ParsedExtracurricular] = []
    languages: list[str] = []
    language: str = "fr"
    font_size_pt: float = 9.0
    line_height: float = 1.35
    margin_top_mm: float = 8.0
    margin_bottom_mm: float = 8.0
    margin_left_mm: float = 12.0
    margin_right_mm: float = 12.0
    html_content: Optional[str] = None


class CompilePDFRequest(SQLModel):
    html_content: str
    filename: Optional[str] = "CV_Candidat.pdf"


class CustomCVDraft(SQLModel, table=True):
    __tablename__ = "custom_cv_drafts"
    id: str = Field(default="default-draft", primary_key=True)
    user_id: str = Field(default="louay", index=True)
    title: str = Field(default="Mon CV")
    data_json: str = Field(default="{}")
    html_content: str = Field(default="")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


# ============================================================================
# User & Authentication Models
# ============================================================================

class UserBase(SQLModel):
    username: str = Field(unique=True, index=True)
    full_name: str = Field(default="")
    role: str = Field(default="user")


class User(UserBase, table=True):
    __tablename__ = "users"
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    password_hash: str = Field(default="")
    created_at: datetime = Field(default_factory=utc_now)


class UserRead(SQLModel):
    id: str
    username: str
    full_name: str
    role: str


class UserLoginRequest(SQLModel):
    username: str
    password: str


class UserLoginResponse(SQLModel):
    token: str
    user: UserRead

