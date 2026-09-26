from app.domain.models import MasterProfile, ProfileCompletenessStatus


def evaluate_profile_completeness(profile: MasterProfile) -> ProfileCompletenessStatus:
    """
    Évalue la complétude du Master Profile conformément à la règle CAP-1.
    Le profil doit contenir l'identité, les coordonnées, au moins 1 formation,
    au moins 1 expérience ou projet, et au moins 3 compétences techniques.
    """
    missing_fields: list[str] = []
    total_checks = 6
    passed_checks = 0

    # 1. Identité (Nom complet)
    if profile.full_name and profile.full_name.strip():
        passed_checks += 1
    else:
        missing_fields.append("Nom complet (full_name)")

    # 2. Email de contact
    if profile.email and "@" in profile.email:
        passed_checks += 1
    else:
        missing_fields.append("Email valide (email)")

    # 3. Coordonnées / Localisation
    if (profile.location and profile.location.strip()) or (profile.phone and profile.phone.strip()):
        passed_checks += 1
    else:
        missing_fields.append("Localisation ou numéro de téléphone")

    # 4. Au moins une formation
    has_valid_education = any(
        edu.school and edu.degree for edu in profile.educations
    )
    if has_valid_education:
        passed_checks += 1
    else:
        missing_fields.append("Au moins une formation avec établissement et diplôme")

    # 5. Au moins une expérience professionnelle ou un projet technique
    has_valid_exp_or_proj = any(
        (exp.company and exp.role and exp.description) for exp in profile.experiences
    ) or any(
        (proj.title and proj.description) for proj in profile.projects
    )
    if has_valid_exp_or_proj:
        passed_checks += 1
    else:
        missing_fields.append("Au moins une expérience ou un projet technique avec description")

    # 6. Au moins 3 compétences techniques
    valid_skills_count = sum(1 for s in profile.skills if s.name and s.name.strip())
    if valid_skills_count >= 3:
        passed_checks += 1
    else:
        missing_fields.append(f"Au moins 3 compétences techniques (actuellement: {valid_skills_count})")

    is_complete = (len(missing_fields) == 0)
    percentage = int((passed_checks / total_checks) * 100)

    return ProfileCompletenessStatus(
        is_complete=is_complete,
        can_generate=is_complete,
        missing_fields=missing_fields,
        completion_percentage=percentage,
    )
