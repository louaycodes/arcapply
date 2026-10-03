from enum import Enum


class JobStatus(str, Enum):
    DISCOVERED = "DISCOVERED"
    REVIEWING = "REVIEWING"
    READY = "READY"
    SUBMITTED = "SUBMITTED"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


# Transitions légales selon le cycle de vie simplifié (Offres -> Candidatures envoyées -> Retenue / Non retenue)
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    JobStatus.DISCOVERED.value: {JobStatus.SUBMITTED.value, JobStatus.REVIEWING.value, JobStatus.ARCHIVED.value},
    JobStatus.REVIEWING.value: {JobStatus.READY.value, JobStatus.SUBMITTED.value, JobStatus.DISCOVERED.value, JobStatus.ARCHIVED.value},
    JobStatus.READY.value: {JobStatus.SUBMITTED.value, JobStatus.REVIEWING.value, JobStatus.ARCHIVED.value},
    JobStatus.SUBMITTED.value: {JobStatus.OFFER.value, JobStatus.REJECTED.value, JobStatus.DISCOVERED.value, JobStatus.ARCHIVED.value, JobStatus.INTERVIEW.value},
    JobStatus.INTERVIEW.value: {JobStatus.OFFER.value, JobStatus.REJECTED.value, JobStatus.SUBMITTED.value, JobStatus.ARCHIVED.value},
    JobStatus.OFFER.value: {JobStatus.SUBMITTED.value, JobStatus.ARCHIVED.value},
    JobStatus.REJECTED.value: {JobStatus.SUBMITTED.value, JobStatus.ARCHIVED.value},
    JobStatus.ARCHIVED.value: {JobStatus.DISCOVERED.value, JobStatus.SUBMITTED.value},
}


class ApplicationFSM:
    """
    Machine à états finis des candidatures ArcApply.
    Gère les transitions entre Offres, Candidatures envoyées, Retenue et Non retenue.
    """

    @classmethod
    def validate_transition(cls, current_status: str, new_status: str) -> None:
        """
        Valide la légalité de la transition. Lève ValueError en cas de violation.
        """
        current = current_status.upper()
        target = new_status.upper()

        if current == target:
            return

        valid_targets = ALLOWED_TRANSITIONS.get(current, set())
        if target not in valid_targets:
            raise ValueError(
                f"Transition d'état invalide : {current} -> {target}. "
                f"Transitions autorisées depuis {current} : {sorted(list(valid_targets))}."
            )
