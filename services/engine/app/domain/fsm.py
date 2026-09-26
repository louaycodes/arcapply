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


# Transitions légales rigoureuses selon AD-6
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    JobStatus.DISCOVERED.value: {JobStatus.REVIEWING.value, JobStatus.ARCHIVED.value},
    JobStatus.REVIEWING.value: {JobStatus.READY.value, JobStatus.DISCOVERED.value, JobStatus.ARCHIVED.value},
    JobStatus.READY.value: {JobStatus.SUBMITTED.value, JobStatus.REVIEWING.value, JobStatus.ARCHIVED.value},
    JobStatus.SUBMITTED.value: {JobStatus.INTERVIEW.value, JobStatus.REJECTED.value, JobStatus.ARCHIVED.value},
    JobStatus.INTERVIEW.value: {JobStatus.OFFER.value, JobStatus.REJECTED.value, JobStatus.ARCHIVED.value},
    JobStatus.OFFER.value: {JobStatus.ARCHIVED.value},
    JobStatus.REJECTED.value: {JobStatus.ARCHIVED.value},
    JobStatus.ARCHIVED.value: {JobStatus.DISCOVERED.value},
}


class ApplicationFSM:
    """
    Machine à états finis des candidatures PFE (AD-6).
    Empêche les envois automatiques sauvages et garantit le passage préalable par READY.
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
            if current == JobStatus.DISCOVERED.value and target == JobStatus.SUBMITTED.value:
                raise ValueError(
                    "Violation AD-6 : Le passage direct de DISCOVERED à SUBMITTED est interdit. "
                    "L'offre doit obligatoirement transiter par REVIEWING puis READY avant soumission."
                )
            raise ValueError(
                f"Transition d'état invalide : {current} -> {target}. "
                f"Transitions autorisées depuis {current} : {sorted(list(valid_targets))}."
            )
