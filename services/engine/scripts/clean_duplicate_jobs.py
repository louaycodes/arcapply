#!/usr/bin/env python3
"""
Script de maintenance et nettoyage des doublons d'offres dans la base de données ArcApply.
Peut être exécuté en local ou directement sur le serveur VPS de production.
Usage:
    python scripts/clean_duplicate_jobs.py [--user USERNAME]
"""

import argparse
import os
import sys

# Ajout du path racine pour imports app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.adapters.database import get_engine
from app.domain.deduplication import deduplicate_all_jobs_in_db, deduplicate_jobs_for_user
from app.domain.models import JobOffer


def main():
    parser = argparse.ArgumentParser(description="Nettoyage des doublons d'offres ArcApply")
    parser.add_argument("--user", type=str, default=None, help="Cibler un utilisateur spécifique (ex: louay)")
    args = parser.parse_args()

    engine = get_engine()
    print("[ArcApply Deduplication] Démarrage du scan de nettoyage...")

    if args.user:
        with Session(engine) as session:
            before_count = len(session.exec(select(JobOffer).where(JobOffer.user_id == args.user)).all())
            removed = deduplicate_jobs_for_user(session, args.user)
            after_count = len(session.exec(select(JobOffer).where(JobOffer.user_id == args.user)).all())
            print(f"Utilisateur : {args.user}")
            print(f"Offres avant : {before_count}")
            print(f"Doublons supprimés : {removed}")
            print(f"Offres restantes : {after_count}")
    else:
        with Session(engine) as session:
            before_total = len(session.exec(select(JobOffer)).all())
        result = deduplicate_all_jobs_in_db(engine)
        with Session(engine) as session:
            after_total = len(session.exec(select(JobOffer)).all())
        print(f"Offres totales avant : {before_total}")
        print(f"Doublons supprimés : {result['duplicates_removed']}")
        print(f"Profils nettoyés : {result['users_cleaned']}")
        print(f"Offres totales restantes : {after_total}")

    print("[ArcApply Deduplication] Nettoyage achevé avec succès.")


if __name__ == "__main__":
    main()
