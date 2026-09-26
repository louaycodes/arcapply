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


class ExperienceBase(SQLModel):
    company: str = Field(default="")
    role: str = Field(default="")
    location: Optional[str] = Field(default=None)
    start_date: str = Field(default="")
    end_date: Optional[str] = Field(default=None)
    description: str = Field(default="")
    technologies: list[str] = Field(default_factory=list)


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

    profile: Optional["MasterProfile"] = Relationship(back_populates="experiences")

    @property
    def technologies(self) -> list[str]:
        if not self.technologies_raw:
            return []
        return [t.strip() for t in self.technologies_raw.split(",") if t.strip()]

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
        return [t.strip() for t in self.technologies_raw.split(",") if t.strip()]

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
    created_at: datetime
    updated_at: datetime
    educations: list[EducationRead] = []
    experiences: list[ExperienceRead] = []
    projects: list[ProjectRead] = []
    skills: list[SkillRead] = []


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
    educations: Optional[list[EducationBase]] = None
    experiences: Optional[list[ExperienceBase]] = None
    projects: Optional[list[ProjectBase]] = None
    skills: Optional[list[SkillBase]] = None


class ProfileCompletenessStatus(SQLModel):
    is_complete: bool
    can_generate: bool
    missing_fields: list[str] = []
    completion_percentage: int = 0


# ============================================================================
# Job Offers (Radar & Application Pipeline)
# ============================================================================

class JobOfferBase(SQLModel):
    platform: str = Field(index=True)  # "linkedin" | "jobteaser"
    external_id: str = Field(index=True)
    title: str = Field(index=True)
    company: str = Field(index=True)
    location: str = Field(default="")
    country: str = Field(default="France", index=True)
    description_raw: str = Field(default="")
    url: str = Field(default="")
    status: str = Field(default="DISCOVERED", index=True)


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

