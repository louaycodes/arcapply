# Deferred Work

Entries appended by the build workflow when a multi-goal intent is split.
Do not edit existing entries. New entries are appended at the bottom.

- source_spec: none
  summary: Rechercher les structures de lettres de motivation les plus acceptées et adapter la génération de lettre d'ArcApply en conséquence
  status: completed
  resolved_in: _bmad-output/implementation-artifacts/spec-structure-lettre-motivation-vous-moi-nous.md
  evidence: Séparé de la story "Mode de recherche profil et filtrage offres" car les deux objectifs touchent des couches entièrement distinctes (génération IA vs profil/radar), chacun shippable comme PR indépendant. La lettre de motivation est un domaine sensible (zéro-hallucination invariant) qui requiert une recherche externe préalable sérieuse avant d'adapter le prompt engineering et le pipeline de génération dans letter.py. Implémenté selon le standard Apec/Harvard (Vous-Moi-Nous-Demain), dissociation PFE/JOB, et intégration LLM Groq avec repli déterministe.
