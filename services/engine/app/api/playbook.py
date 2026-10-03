from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone

from app.adapters.database import get_session
from app.api.auth import get_current_username
from app.domain.models import (
    AgentPlaybookRule,
    AgentPlaybookRuleCreate,
    AgentPlaybookRuleUpdate,
    User,
)

router = APIRouter(prefix="/api/agent/playbook", tags=["agent-playbook"])


DEFAULT_PLAYBOOK_TEMPLATES = [
    {
        "title": "Focalisation DevOps & Cloud",
        "category": "devops",
        "condition_trigger": "L'offre mentionne Kubernetes, Docker, CI/CD, Terraform, AWS ou DevOps",
        "action_instruction": "Mettre impérativement en avant les projets axés sur les conteneurs, le déploiement continu et la résilience système. Démontrer une rigueur de production.",
        "is_active": True,
    },
    {
        "title": "Focalisation Architecture Backend & APIs",
        "category": "backend",
        "condition_trigger": "L'offre cible un poste Backend Python, FastAPI, Go, Microservices ou conception d'APIs",
        "action_instruction": "Valoriser les choix d'architecture logicielle propre (Clean Architecture, découplage), la gestion de la concurrence et l'optimisation des requêtes de base de données.",
        "is_active": True,
    },
    {
        "title": "Tonalité Sobrie & Rigueur d'Ingénieur",
        "category": "tone",
        "condition_trigger": "Toute candidature PFE ou premier emploi ingénieur",
        "action_instruction": "Adopter un ton sobre, direct et factuel. Proscrire les superlatifs vides d'IA et prouver la compétence par les faits techniques et les technologies exactes manipulées.",
        "is_active": True,
    },
]


@router.get("", response_model=List[AgentPlaybookRule])
def get_playbook_rules(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Récupère toutes les directives stratégiques de l'utilisateur."""
    user = session.exec(select(User).where(User.username == username)).first()

    rules = session.exec(
        select(AgentPlaybookRule)
        .where(AgentPlaybookRule.user_id == username)
        .order_by(AgentPlaybookRule.created_at.asc())
    ).all()

    # Si l'utilisateur n'a jamais été initialisé, initialiser une unique fois avec les modèles par défaut
    if user and not user.playbook_initialized:
        if not rules:
            for tpl in DEFAULT_PLAYBOOK_TEMPLATES:
                rule = AgentPlaybookRule(
                    user_id=username,
                    title=tpl["title"],
                    category=tpl["category"],
                    condition_trigger=tpl["condition_trigger"],
                    action_instruction=tpl["action_instruction"],
                    is_active=tpl["is_active"],
                )
                session.add(rule)
        user.playbook_initialized = True
        session.add(user)
        session.commit()
        rules = session.exec(
            select(AgentPlaybookRule)
            .where(AgentPlaybookRule.user_id == username)
            .order_by(AgentPlaybookRule.created_at.asc())
        ).all()

    return rules


@router.post("/restore-templates", response_model=List[AgentPlaybookRule])
def restore_playbook_templates(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Restaure les modèles de directives recommandés pour l'utilisateur sans écraser ses règles existantes."""
    existing_rules = session.exec(
        select(AgentPlaybookRule).where(AgentPlaybookRule.user_id == username)
    ).all()
    existing_titles = {r.title for r in existing_rules}

    for tpl in DEFAULT_PLAYBOOK_TEMPLATES:
        if tpl["title"] not in existing_titles:
            rule = AgentPlaybookRule(
                user_id=username,
                title=tpl["title"],
                category=tpl["category"],
                condition_trigger=tpl["condition_trigger"],
                action_instruction=tpl["action_instruction"],
                is_active=tpl["is_active"],
            )
            session.add(rule)

    user = session.exec(select(User).where(User.username == username)).first()
    if user and not user.playbook_initialized:
        user.playbook_initialized = True
        session.add(user)

    session.commit()

    return session.exec(
        select(AgentPlaybookRule)
        .where(AgentPlaybookRule.user_id == username)
        .order_by(AgentPlaybookRule.created_at.asc())
    ).all()


@router.post("", response_model=AgentPlaybookRule)
def create_playbook_rule(
    payload: AgentPlaybookRuleCreate,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Crée une nouvelle directive stratégique pour l'agent."""
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Le titre de la règle est requis")
    if not payload.condition_trigger.strip():
        raise HTTPException(status_code=400, detail="La condition de déclenchement est requise")
    if not payload.action_instruction.strip():
        raise HTTPException(status_code=400, detail="L'instruction d'action est requise")

    rule = AgentPlaybookRule(
        user_id=username,
        title=payload.title.strip(),
        category=payload.category or "custom",
        condition_trigger=payload.condition_trigger.strip(),
        action_instruction=payload.action_instruction.strip(),
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=AgentPlaybookRule)
def update_playbook_rule(
    rule_id: str,
    payload: AgentPlaybookRuleUpdate,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Met à jour une directive existante."""
    rule = session.exec(
        select(AgentPlaybookRule).where(
            AgentPlaybookRule.id == rule_id,
            AgentPlaybookRule.user_id == username,
        )
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Directive introuvable")

    if payload.title is not None:
        rule.title = payload.title.strip()
    if payload.condition_trigger is not None:
        rule.condition_trigger = payload.condition_trigger.strip()
    if payload.action_instruction is not None:
        rule.action_instruction = payload.action_instruction.strip()
    if payload.category is not None:
        rule.category = payload.category
    if payload.is_active is not None:
        rule.is_active = payload.is_active

    rule.updated_at = datetime.now(timezone.utc)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_playbook_rule(
    rule_id: str,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Supprime une directive stratégique."""
    rule = session.exec(
        select(AgentPlaybookRule).where(
            AgentPlaybookRule.id == rule_id,
            AgentPlaybookRule.user_id == username,
        )
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Directive introuvable")

    session.delete(rule)
    session.commit()
    return {"status": "success", "message": "Directive supprimée"}
