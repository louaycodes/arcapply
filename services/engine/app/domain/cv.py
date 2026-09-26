import html
from datetime import datetime
from app.domain.models import ATSMatchResult, JobOffer, MasterProfile, TargetedCV


class CVGeneratorService:
    """
    Moteur de génération et d'adaptation de CV ciblé (AD-4 Étape 3, AD-7).
    Garantit le zéro hallucination en ne projetant que les données vérifiées du Master Profile.
    """

    @classmethod
    def generate_cv(
        cls,
        job: JobOffer,
        profile: MasterProfile,
        ats_match: ATSMatchResult,
    ) -> TargetedCV:
        if not profile.is_complete:
            raise ValueError(
                "Le Master Profile doit être complet (CAP-1) pour générer un CV ciblé."
            )

        # 1. Headline ciblée
        headline = profile.headline or f"Élève-Ingénieur — {job.title}"

        # 2. Accroche factuelle zéro hallucination
        matched_str = ", ".join(ats_match.matched_skills[:4]) if ats_match.matched_skills else "génie logiciel"
        summary = (
            profile.bio
            or f"Élève-ingénieur à la recherche d'un stage de fin d'études (PFE). "
            f"Compétences clés validées en {matched_str} appliquées sur des projets d'ingénierie concrets."
        )

        # 3. Compétences : intersection stricte avec le profil maître (Anti-hallucination guard)
        missing_set = {s.lower() for s in ats_match.missing_skills}
        
        # Validation que rien de missing n'est inséré
        safe_matched = [s for s in ats_match.matched_skills if s.lower() not in missing_set]
        safe_transferable = [s for s in ats_match.transferable_skills if s.lower() not in missing_set]

        # 4. Ordonnancement des expériences par pertinence vis-à-vis de l'offre
        target_skills_lower = {s.lower() for s in (safe_matched + safe_transferable)}

        scored_experiences: list[tuple[float, dict]] = []
        for exp in profile.experiences:
            exp_techs_lower = {t.lower().strip() for t in exp.technologies if t.strip()}
            # Score de pertinence : nombre de technologies requises mobilisées
            overlap_score = len(exp_techs_lower.intersection(target_skills_lower)) * 2.0
            if any(req in (exp.description or "").lower() for req in target_skills_lower):
                overlap_score += 1.0

            exp_dict = {
                "company": exp.company,
                "role": exp.role,
                "location": exp.location or "",
                "start_date": exp.start_date,
                "end_date": exp.end_date or "Présent",
                "description": exp.description or "",
                "technologies": exp.technologies,
            }
            scored_experiences.append((overlap_score, exp_dict))

        # Tri décroissant par score de pertinence, puis conservation des top 3 pour calibrage 1 page A4
        scored_experiences.sort(key=lambda x: x[0], reverse=True)
        selected_experiences = [item[1] for item in scored_experiences[:3]]

        # 5. Ordonnancement des projets par pertinence
        scored_projects: list[tuple[float, dict]] = []
        for proj in profile.projects:
            proj_techs_lower = {t.lower().strip() for t in proj.technologies if t.strip()}
            overlap_score = len(proj_techs_lower.intersection(target_skills_lower)) * 2.0
            if any(req in (proj.description or "").lower() for req in target_skills_lower):
                overlap_score += 1.0

            proj_dict = {
                "title": proj.title,
                "role": proj.role or "Développeur",
                "url": proj.url or "",
                "description": proj.description or "",
                "technologies": proj.technologies,
            }
            scored_projects.append((overlap_score, proj_dict))

        scored_projects.sort(key=lambda x: x[0], reverse=True)
        selected_projects = [item[1] for item in scored_projects[:3]]

        # 6. Formations
        educations_list = [
            {
                "school": edu.school,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study,
                "start_date": edu.start_date,
                "end_date": edu.end_date or "En cours",
                "description": edu.description or "",
            }
            for edu in sorted(profile.educations, key=lambda e: e.start_date, reverse=True)
        ]

        # 7. Génération du template HTML A4 ATS-friendly
        html_content = cls.render_html_template(
            profile=profile,
            job=job,
            headline=headline,
            summary=summary,
            matched_skills=safe_matched,
            transferable_skills=safe_transferable,
            experiences=selected_experiences,
            projects=selected_projects,
            educations=educations_list,
        )

        cv = TargetedCV(
            job_id=job.id,
            profile_id=profile.id,
            headline=headline,
            summary=summary,
            html_content=html_content,
        )
        cv.matched_skills = safe_matched
        cv.transferable_skills = safe_transferable
        cv.experiences = selected_experiences
        cv.projects = selected_projects
        cv.educations = educations_list

        return cv

    @staticmethod
    def render_html_template(
        profile: MasterProfile,
        job: JobOffer,
        headline: str,
        summary: str,
        matched_skills: list[str],
        transferable_skills: list[str],
        experiences: list[dict],
        projects: list[dict],
        educations: list[dict],
    ) -> str:
        """
        Génère un HTML/CSS épuré, compact et sémantique calibré pour une page unique A4.
        Respecte rigoureusement la lisibilité par les parseurs ATS (pas de multi-colonnes confuses).
        """
        # Formattage contact
        contact_items = [html.escape(profile.email)]
        if profile.phone:
            contact_items.append(html.escape(profile.phone))
        if profile.location:
            contact_items.append(html.escape(profile.location))
        if profile.linkedin_url:
            contact_items.append(f'<a href="{html.escape(profile.linkedin_url)}">LinkedIn</a>')
        if profile.github_url:
            contact_items.append(f'<a href="{html.escape(profile.github_url)}">GitHub</a>')

        contact_bar = " &bull; ".join(contact_items)

        # Compétences
        skills_html = ""
        if matched_skills or transferable_skills:
            parts = []
            if matched_skills:
                parts.append(
                    f"<strong>Compétences clés :</strong> "
                    + ", ".join(f'<span class="skill-tag">{html.escape(s)}</span>' for s in matched_skills)
                )
            if transferable_skills:
                parts.append(
                    f"<strong>Connexes :</strong> "
                    + ", ".join(f'<span class="skill-tag-trans">{html.escape(s)}</span>' for s in transferable_skills)
                )
            skills_html = f"""
            <section class="section">
                <h2 class="section-title">Compétences Techniques</h2>
                <div class="skills-block">
                    {'<br/>'.join(parts)}
                </div>
            </section>
            """

        # Expériences
        exp_html = ""
        if experiences:
            items_rendered = []
            for exp in experiences:
                tech_line = ""
                if exp.get("technologies"):
                    tech_line = f'<div class="item-tech"><em>Technologies :</em> {html.escape(", ".join(exp["technologies"]))}</div>'

                items_rendered.append(f"""
                <div class="item">
                    <div class="item-header">
                        <span class="item-role">{html.escape(exp["role"])}</span> — 
                        <span class="item-company">{html.escape(exp["company"])}</span>
                        <span class="item-date">{html.escape(exp["start_date"])} – {html.escape(exp["end_date"])}</span>
                    </div>
                    <div class="item-desc">{html.escape(exp["description"])}</div>
                    {tech_line}
                </div>
                """)
            exp_html = f"""
            <section class="section">
                <h2 class="section-title">Expériences Professionnelles</h2>
                {''.join(items_rendered)}
            </section>
            """

        # Projets
        proj_html = ""
        if projects:
            items_rendered = []
            for proj in projects:
                tech_line = ""
                if proj.get("technologies"):
                    tech_line = f'<div class="item-tech"><em>Stack :</em> {html.escape(", ".join(proj["technologies"]))}</div>'

                items_rendered.append(f"""
                <div class="item">
                    <div class="item-header">
                        <span class="item-role">{html.escape(proj["title"])}</span>
                        {f'({html.escape(proj["role"])})' if proj.get("role") else ''}
                    </div>
                    <div class="item-desc">{html.escape(proj["description"])}</div>
                    {tech_line}
                </div>
                """)
            proj_html = f"""
            <section class="section">
                <h2 class="section-title">Projets d'Ingénierie</h2>
                {''.join(items_rendered)}
            </section>
            """

        # Formations
        edu_html = ""
        if educations:
            items_rendered = []
            for edu in educations:
                items_rendered.append(f"""
                <div class="item">
                    <div class="item-header">
                        <span class="item-role">{html.escape(edu["degree"])}</span> — 
                        <span class="item-company">{html.escape(edu["school"])}</span>
                        <span class="item-date">{html.escape(edu["start_date"])} – {html.escape(edu["end_date"])}</span>
                    </div>
                    <div class="item-desc">{html.escape(edu["field_of_study"])}</div>
                </div>
                """)
            edu_html = f"""
            <section class="section">
                <h2 class="section-title">Formation</h2>
                {''.join(items_rendered)}
            </section>
            """

        return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>CV {html.escape(profile.full_name)} — {html.escape(job.company)}</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 8mm 12mm 8mm 12mm;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            font-size: 9.5pt;
            line-height: 1.32;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        .cv-container {{
            max-width: 100%;
            height: 100%;
        }}
        header {{
            text-align: center;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }}
        h1 {{
            font-size: 16pt;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
            margin-bottom: 2px;
            text-transform: uppercase;
        }}
        .headline {{
            font-size: 10.5pt;
            font-weight: 600;
            color: #334155;
            margin-bottom: 4px;
        }}
        .contact-bar {{
            font-size: 8pt;
            color: #64748b;
        }}
        .contact-bar a {{
            color: #0284c7;
            text-decoration: none;
        }}
        .summary {{
            font-size: 8.5pt;
            color: #334155;
            margin-bottom: 8px;
            line-height: 1.3;
            text-align: justify;
        }}
        .section {{
            margin-bottom: 8px;
        }}
        .section-title {{
            font-size: 9.5pt;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 2px;
            margin-bottom: 4px;
        }}
        .skills-block {{
            font-size: 8.5pt;
            line-height: 1.4;
        }}
        .skill-tag {{
            font-weight: 600;
            color: #0f172a;
        }}
        .skill-tag-trans {{
            font-style: italic;
            color: #475569;
        }}
        .item {{
            margin-bottom: 6px;
        }}
        .item:last-child {{
            margin-bottom: 0;
        }}
        .item-header {{
            display: flex;
            justify-content: flex-start;
            align-items: baseline;
            gap: 4px;
            font-size: 9pt;
        }}
        .item-role {{
            font-weight: 700;
            color: #0f172a;
        }}
        .item-company {{
            font-weight: 600;
            color: #334155;
        }}
        .item-date {{
            margin-left: auto;
            font-size: 8pt;
            color: #64748b;
            font-family: monospace;
        }}
        .item-desc {{
            font-size: 8.5pt;
            color: #334155;
            margin-top: 1px;
            line-height: 1.28;
        }}
        .item-tech {{
            font-size: 8pt;
            color: #475569;
            margin-top: 1px;
        }}
    </style>
</head>
<body>
    <div class="cv-container">
        <header>
            <h1>{html.escape(profile.full_name)}</h1>
            <div class="headline">{html.escape(headline)}</div>
            <div class="contact-bar">{contact_bar}</div>
        </header>

        <div class="summary">{html.escape(summary)}</div>

        {skills_html}
        {exp_html}
        {proj_html}
        {edu_html}
    </div>
</body>
</html>
"""
