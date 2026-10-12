from __future__ import annotations

import re
from typing import NamedTuple

class CountryMeta(NamedTuple):
    name: str
    iso_code: str
    currency: str
    default_lang: str
    keywords: list[str]


COUNTRY_REGISTRY: dict[str, CountryMeta] = {
    "france": CountryMeta(
        name="France",
        iso_code="FR",
        currency="EUR",
        default_lang="fr",
        keywords=["Stage PFE", "Stage Ingénieur", "Stage", "Alternance"],
    ),
    "tunisie": CountryMeta(
        name="Tunisie",
        iso_code="TN",
        currency="TND",
        default_lang="fr",
        keywords=["PFE", "Stage PFE", "Stage Ingénieur"],
    ),
    "norway": CountryMeta(
        name="Norway",
        iso_code="NO",
        currency="NOK",
        default_lang="en",
        keywords=["internship", "summer internship", "trainee", "masteroppgave", "praksis"],
    ),
    "sweden": CountryMeta(
        name="Sweden",
        iso_code="SE",
        currency="SEK",
        default_lang="en",
        keywords=["internship", "exjobb", "thesis", "praktik", "graduate software engineer"],
    ),
    "denmark": CountryMeta(
        name="Denmark",
        iso_code="DK",
        currency="DKK",
        default_lang="en",
        keywords=["internship", "student assistant", "trainee", "master thesis"],
    ),
    "finland": CountryMeta(
        name="Finland",
        iso_code="FI",
        currency="EUR",
        default_lang="en",
        keywords=["internship", "trainee", "thesis worker", "summer trainee"],
    ),
    "germany": CountryMeta(
        name="Germany",
        iso_code="DE",
        currency="EUR",
        default_lang="de",
        keywords=["Praktikum", "Werkstudent", "Masterarbeit", "Internship Software"],
    ),
    "switzerland": CountryMeta(
        name="Switzerland",
        iso_code="CH",
        currency="CHF",
        default_lang="en",
        keywords=["Internship", "Stage", "Praktikum", "Master Thesis"],
    ),
    "belgium": CountryMeta(
        name="Belgium",
        iso_code="BE",
        currency="EUR",
        default_lang="fr",
        keywords=["Stage", "Internship", "Stage PFE", "Stagiair"],
    ),
    "united kingdom": CountryMeta(
        name="United Kingdom",
        iso_code="UK",
        currency="GBP",
        default_lang="en",
        keywords=["internship", "summer internship", "graduate engineer", "industrial placement"],
    ),
    "netherlands": CountryMeta(
        name="Netherlands",
        iso_code="NL",
        currency="EUR",
        default_lang="en",
        keywords=["internship", "afstudeerstage", "meeloopstage", "traineeship"],
    ),
    "spain": CountryMeta(
        name="Spain",
        iso_code="ES",
        currency="EUR",
        default_lang="es",
        keywords=["Prácticas", "Becario", "Internship", "Prácticas remuneradas"],
    ),
    "italy": CountryMeta(
        name="Italy",
        iso_code="IT",
        currency="EUR",
        default_lang="it",
        keywords=["Tirocinio", "Stage", "Internship", "Stage curriculare"],
    ),
    "poland": CountryMeta(
        name="Poland",
        iso_code="PL",
        currency="PLN",
        default_lang="en",
        keywords=["Internship", "Staż", "Praktyki", "Junior Developer"],
    ),
    "romania": CountryMeta(
        name="Romania",
        iso_code="RO",
        currency="RON",
        default_lang="en",
        keywords=["Internship", "Stagiu", "Practică IT", "Junior Developer"],
    ),
    "luxembourg": CountryMeta(
        name="Luxembourg",
        iso_code="LU",
        currency="EUR",
        default_lang="fr",
        keywords=["Stage", "Internship", "PFE"],
    ),
    "ireland": CountryMeta(
        name="Ireland",
        iso_code="IE",
        currency="EUR",
        default_lang="en",
        keywords=["Internship", "Graduate Program", "Summer Placement"],
    ),
}

# Alias de détection (villes et variantes linguistiques)
LOCATION_ALIASES: dict[str, str] = {
    # Norvège
    "norvege": "norway",
    "norway": "norway",
    "oslo": "norway",
    "bergen": "norway",
    "trondheim": "norway",
    "stavanger": "norway",
    "tromso": "norway",
    "tromsø": "norway",
    # Suède
    "suede": "sweden",
    "sweden": "sweden",
    "sverige": "sweden",
    "stockholm": "sweden",
    "gothenburg": "sweden",
    "göteborg": "sweden",
    "malmo": "sweden",
    "malmö": "sweden",
    "uppsala": "sweden",
    # Danemark
    "danemark": "denmark",
    "denmark": "denmark",
    "danmark": "denmark",
    "copenhagen": "denmark",
    "københavn": "denmark",
    "aarhus": "denmark",
    # Finlande
    "finlande": "finland",
    "finland": "finland",
    "suomi": "finland",
    "helsinki": "finland",
    "espoo": "finland",
    "tampere": "finland",
    "oulu": "finland",
    # Allemagne
    "allemagne": "germany",
    "germany": "germany",
    "deutschland": "germany",
    "berlin": "germany",
    "munich": "germany",
    "münchen": "germany",
    "frankfurt": "germany",
    "hamburg": "germany",
    "stuttgart": "germany",
    "cologne": "germany",
    "köln": "germany",
    # Suisse
    "suisse": "switzerland",
    "switzerland": "switzerland",
    "schweiz": "switzerland",
    "zurich": "switzerland",
    "zürich": "switzerland",
    "geneva": "switzerland",
    "genève": "switzerland",
    "lausanne": "switzerland",
    "basel": "switzerland",
    "bâle": "switzerland",
    "bern": "switzerland",
    # Belgique
    "belgique": "belgium",
    "belgium": "belgium",
    "belgië": "belgium",
    "brussels": "belgium",
    "bruxelles": "belgium",
    "antwerp": "belgium",
    "anvers": "belgium",
    "gent": "belgium",
    "gand": "belgium",
    "liege": "belgium",
    "liège": "belgium",
    # Royaume-Uni
    "royaume-uni": "united kingdom",
    "united kingdom": "united kingdom",
    "uk": "united kingdom",
    "london": "united kingdom",
    "londres": "united kingdom",
    "edinburgh": "united kingdom",
    "edimbourg": "united kingdom",
    "scotland": "united kingdom",
    "ecosse": "united kingdom",
    "écosse": "united kingdom",
    "cambridge": "united kingdom",
    "oxford": "united kingdom",
    "manchester": "united kingdom",
    # Pays-Bas
    "pays-bas": "netherlands",
    "netherlands": "netherlands",
    "nederland": "netherlands",
    "amsterdam": "netherlands",
    "rotterdam": "netherlands",
    "utrecht": "netherlands",
    "eindhoven": "netherlands",
    "the hague": "netherlands",
    "la haye": "netherlands",
    # Espagne
    "espagne": "spain",
    "spain": "spain",
    "españa": "spain",
    "madrid": "spain",
    "barcelona": "spain",
    "barcelone": "spain",
    "valencia": "spain",
    # Italie
    "italie": "italy",
    "italy": "italy",
    "italia": "italy",
    "rome": "italy",
    "roma": "italy",
    "milan": "italy",
    "milano": "italy",
    "turin": "italy",
    "torino": "italy",
    # Pologne
    "pologne": "poland",
    "poland": "poland",
    "polska": "poland",
    "warsaw": "poland",
    "varsovie": "poland",
    "krakow": "poland",
    "cracovie": "poland",
    "wroclaw": "poland",
    # Roumanie
    "roumanie": "romania",
    "romania": "romania",
    "bucharest": "romania",
    "bucarest": "romania",
    "cluj": "romania",
    "iasi": "romania",
    "timisoara": "romania",
    # Luxembourg
    "luxembourg": "luxembourg",
    # Irlande
    "irlande": "ireland",
    "ireland": "ireland",
    "dublin": "ireland",
    "cork": "ireland",
    # Tunisie
    "tunisie": "tunisie",
    "tunisia": "tunisie",
    "tunis": "tunisie",
    "ariana": "tunisie",
    "sousse": "tunisie",
    "sfax": "tunisie",
    "monastir": "tunisie",
    # France
    "france": "france",
    "paris": "france",
    "lyon": "france",
    "toulouse": "france",
    "marseille": "france",
    "bordeaux": "france",
    "nantes": "france",
    "lille": "france",
    "strasbourg": "france",
    "rennes": "france",
    "grenoble": "france",
    "sophia antipolis": "france",
}


def resolve_country_name(location_or_country: str) -> str:
    """
    Détermine de manière déterministe le nom standardisé du pays à partir
    d'un nom de ville, de pays, d'une adresse ou d'un code.
    Retourne par défaut 'France' si aucune correspondance n'est trouvée.
    """
    if not location_or_country:
        return "France"

    loc_clean = location_or_country.lower().strip()

    # 1. Correspondance exacte ou partielle sur les alias
    for alias, canonical_key in LOCATION_ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}\b", loc_clean):
            meta = COUNTRY_REGISTRY.get(canonical_key)
            if meta:
                return meta.name

    # 2. Correspondance directe dans le registre des pays
    for key, meta in COUNTRY_REGISTRY.items():
        if key in loc_clean or meta.name.lower() in loc_clean:
            return meta.name

    return "France"


def get_country_iso_code(country_name: str) -> str:
    """Retourne le code ISO 2 lettres d'un pays (sans emoji)."""
    key = country_name.lower().strip()
    for c_key, meta in COUNTRY_REGISTRY.items():
        if c_key == key or meta.name.lower() == key:
            return meta.iso_code
    return "FR"


def get_default_keywords_for_location(location: str) -> list[str]:
    """Retourne les mots-clés de recherche recommandés selon le pays."""
    resolved = resolve_country_name(location).lower()
    for key, meta in COUNTRY_REGISTRY.items():
        if key == resolved or meta.name.lower() == resolved:
            return list(meta.keywords)
    return ["Stage PFE", "Stage Ingénieur", "PFE"]
