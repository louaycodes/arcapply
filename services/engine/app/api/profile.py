from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.adapters.database import get_session
from app.domain.models import (
    Education,
    Experience,
    MasterProfile,
    MasterProfileRead,
    MasterProfileUpdate,
    ProfileCompletenessStatus,
    Project,
    Skill,
    VALID_SEARCH_MODES,
    utc_now,
)
from app.domain.validation import evaluate_profile_completeness

router = APIRouter(prefix="/api/profile", tags=["Master Profile"])


def _get_or_create_profile(session: Session) -> MasterProfile:
    profile = session.exec(
        select(MasterProfile).where(MasterProfile.id == "default-profile")
    ).first()
    if not profile:
        profile = MasterProfile(
            id="default-profile",
            full_name="",
            email="",
            is_complete=False,
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile


@router.get("", response_model=MasterProfileRead)
def get_profile(session: Session = Depends(get_session)):
    """Récupère le Master Profile avec l'ensemble de ses formations, expériences et compétences."""
    profile = _get_or_create_profile(session)
    return profile


@router.put("", response_model=MasterProfileRead)
def update_profile(
    data: MasterProfileUpdate,
    session: Session = Depends(get_session),
):
    """Met à jour le Master Profile et recalcule son statut de complétude (CAP-1)."""
    profile = _get_or_create_profile(session)

    # Mise à jour des champs scalaires
    update_dict = data.model_dump(exclude_unset=True)
    scalar_fields = [
        "full_name",
        "email",
        "phone",
        "location",
        "headline",
        "bio",
        "linkedin_url",
        "github_url",
        "website_url",
    ]
    for field in scalar_fields:
        if field in update_dict:
            setattr(profile, field, update_dict[field])

    # Validation et mise à jour du mode de recherche (PFE / JOB)
    if "search_mode" in update_dict:
        new_mode = update_dict["search_mode"].upper() if update_dict["search_mode"] else ""
        if new_mode not in VALID_SEARCH_MODES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "INVALID_SEARCH_MODE",
                    "message": f"search_mode invalide : '{update_dict['search_mode']}'. Valeurs acceptées : PFE, JOB.",
                },
            )
        profile.search_mode = new_mode

    # Mise à jour des formations si fournies
    if data.educations is not None:
        profile.educations.clear()
        for edu_data in data.educations:
            edu = Education(
                profile_id=profile.id,
                school=edu_data.school,
                degree=edu_data.degree,
                field_of_study=edu_data.field_of_study,
                start_date=edu_data.start_date,
                end_date=edu_data.end_date,
                description=edu_data.description,
            )
            profile.educations.append(edu)

    # Mise à jour des expériences si fournies
    if data.experiences is not None:
        profile.experiences.clear()
        for exp_data in data.experiences:
            exp = Experience(
                profile_id=profile.id,
                company=exp_data.company,
                role=exp_data.role,
                location=exp_data.location,
                start_date=exp_data.start_date,
                end_date=exp_data.end_date,
                description=exp_data.description,
                technologies_raw=",".join(exp_data.technologies) if exp_data.technologies else "",
                experience_type=exp_data.experience_type or "stage",
            )
            profile.experiences.append(exp)

    # Mise à jour des projets si fournis
    if data.projects is not None:
        profile.projects.clear()
        for proj_data in data.projects:
            proj = Project(
                profile_id=profile.id,
                title=proj_data.title,
                role=proj_data.role,
                description=proj_data.description,
                url=proj_data.url,
                technologies_raw=",".join(proj_data.technologies) if proj_data.technologies else "",
            )
            profile.projects.append(proj)

    # Mise à jour des compétences si fournies
    if data.skills is not None:
        profile.skills.clear()
        for skill_data in data.skills:
            skill = Skill(
                profile_id=profile.id,
                name=skill_data.name,
                category=skill_data.category or "Technologies",
                level=skill_data.level,
            )
            profile.skills.append(skill)

    # Mise à jour des langues si fournies
    if data.languages is not None:
        profile.languages = data.languages

    # Mise à jour des activités extra-professionnelles si fournies
    if data.extracurriculars is not None:
        profile.extracurriculars = data.extracurriculars

    # Évaluation de la complétude
    status_result = evaluate_profile_completeness(profile)
    profile.is_complete = status_result.is_complete
    profile.updated_at = utc_now()

    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@router.get("/status", response_model=ProfileCompletenessStatus)
def get_profile_status(session: Session = Depends(get_session)):
    """Retourne l'état de complétude du Master Profile et les champs requis manquants."""
    profile = _get_or_create_profile(session)
    return evaluate_profile_completeness(profile)


@router.post("/can-generate")
def verify_generation_eligibility(session: Session = Depends(get_session)):
    """Garde-fou strict CAP-1 : bloque toute génération si le Master Profile est incomplet."""
    profile = _get_or_create_profile(session)
    status_result = evaluate_profile_completeness(profile)

    if not status_result.can_generate:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "PROFILE_INCOMPLETE",
                "message": "Le Master Profile est incomplet. Complétez les champs obligatoires avant de générer une candidature.",
                "missing_fields": status_result.missing_fields,
            },
        )

    return {
        "status": "ok",
        "message": "Master Profile complet et validé. Génération autorisée.",
        "completion_percentage": status_result.completion_percentage,
    }
