export interface CountryConfig {
  id: string;
  label: string;
  labelEn: string;
  badge: string;
  aliases: string[];
}

export const ALL_RADAR_COUNTRIES: CountryConfig[] = [
  { id: "all", label: "Tous les pays", labelEn: "All Countries", badge: "ALL", aliases: ["all", "tous", "global"] },
  { id: "France", label: "France", labelEn: "France", badge: "FR", aliases: ["france", "fr"] },
  { id: "Tunisie", label: "Tunisie", labelEn: "Tunisia", badge: "TN", aliases: ["tunisie", "tunisia", "tn"] },
  { id: "Germany", label: "Allemagne", labelEn: "Germany", badge: "DE", aliases: ["germany", "allemagne", "deutschland", "de"] },
  { id: "United Kingdom", label: "Royaume-Uni", labelEn: "United Kingdom", badge: "UK", aliases: ["united kingdom", "royaume-uni", "uk", "great britain", "england"] },
  { id: "Switzerland", label: "Suisse", labelEn: "Switzerland", badge: "CH", aliases: ["switzerland", "suisse", "schweiz", "ch"] },
  { id: "Belgium", label: "Belgique", labelEn: "Belgium", badge: "BE", aliases: ["belgium", "belgique", "belgië", "be"] },
  { id: "Luxembourg", label: "Luxembourg", labelEn: "Luxembourg", badge: "LU", aliases: ["luxembourg", "lu"] },
  { id: "Netherlands", label: "Pays-Bas", labelEn: "Netherlands", badge: "NL", aliases: ["netherlands", "pays-bas", "nederland", "nl"] },
  { id: "Norway", label: "Norvège", labelEn: "Norway", badge: "NO", aliases: ["norway", "norvège", "norvege", "norge", "no"] },
  { id: "Sweden", label: "Suède", labelEn: "Sweden", badge: "SE", aliases: ["sweden", "suède", "suede", "sverige", "se"] },
  { id: "Denmark", label: "Danemark", labelEn: "Denmark", badge: "DK", aliases: ["denmark", "danemark", "danmark", "dk"] },
  { id: "Finland", label: "Finlande", labelEn: "Finland", badge: "FI", aliases: ["finland", "finlande", "suomi", "fi"] },
  { id: "Spain", label: "Espagne", labelEn: "Spain", badge: "ES", aliases: ["spain", "espagne", "españa", "es"] },
  { id: "Italy", label: "Italie", labelEn: "Italy", badge: "IT", aliases: ["italy", "italie", "italia", "it"] },
  { id: "Poland", label: "Pologne", labelEn: "Poland", badge: "PL", aliases: ["poland", "pologne", "polska", "pl"] },
  { id: "Romania", label: "Roumanie", labelEn: "Romania", badge: "RO", aliases: ["romania", "roumanie", "ro"] },
  { id: "Ireland", label: "Irlande", labelEn: "Ireland", badge: "IE", aliases: ["ireland", "irlande", "ie"] },
  { id: "Austria", label: "Autriche", labelEn: "Austria", badge: "AT", aliases: ["austria", "autriche", "österreich", "at"] },
  { id: "Portugal", label: "Portugal", labelEn: "Portugal", badge: "PT", aliases: ["portugal", "pt"] },
];

export const CRAWL_COUNTRY_OPTIONS: { id: string; label: string; labelEn: string; badge: string }[] = [
  { id: "all", label: "Tous les pays", labelEn: "All Countries", badge: "EU+" },
  { id: "France", label: "France", labelEn: "France", badge: "FR" },
  { id: "Tunisie", label: "Tunisie", labelEn: "Tunisia", badge: "TN" },
  { id: "Germany", label: "Allemagne", labelEn: "Germany", badge: "DE" },
  { id: "United Kingdom", label: "Royaume-Uni", labelEn: "United Kingdom", badge: "UK" },
  { id: "Switzerland", label: "Suisse", labelEn: "Switzerland", badge: "CH" },
  { id: "Norway", label: "Norvège", labelEn: "Norway", badge: "NO" },
  { id: "Sweden", label: "Suède", labelEn: "Sweden", badge: "SE" },
  { id: "Netherlands", label: "Pays-Bas", labelEn: "Netherlands", badge: "NL" },
  { id: "Belgium", label: "Belgique", labelEn: "Belgium", badge: "BE" },
  { id: "Luxembourg", label: "Luxembourg", labelEn: "Luxembourg", badge: "LU" },
  { id: "Spain", label: "Espagne", labelEn: "Spain", badge: "ES" },
  { id: "Italy", label: "Italie", labelEn: "Italy", badge: "IT" },
  { id: "Poland", label: "Pologne", labelEn: "Poland", badge: "PL" },
  { id: "Romania", label: "Roumanie", labelEn: "Romania", badge: "RO" },
  { id: "Denmark", label: "Danemark", labelEn: "Denmark", badge: "DK" },
  { id: "Finland", label: "Finlande", labelEn: "Finland", badge: "FI" },
  { id: "Ireland", label: "Irlande", labelEn: "Ireland", badge: "IE" },
  { id: "Austria", label: "Autriche", labelEn: "Austria", badge: "AT" },
  { id: "Portugal", label: "Portugal", labelEn: "Portugal", badge: "PT" },
];

export function matchJobCountry(jobCountry: string | undefined | null, targetCountryId: string): boolean {
  if (!targetCountryId || targetCountryId === "all") return true;
  if (!jobCountry) return false;
  const jc = jobCountry.trim().toLowerCase();
  const cfg = ALL_RADAR_COUNTRIES.find((c) => c.id.toLowerCase() === targetCountryId.toLowerCase());
  if (cfg) {
    return cfg.aliases.some((alias) => jc === alias || jc.includes(alias));
  }
  return jc === targetCountryId.toLowerCase();
}

export function getCountryBadge(countryName: string | undefined | null): string {
  if (!countryName) return "LOC";
  if (countryName === "all") return "ALL";
  if (countryName === "international") return "EU+";
  const jc = countryName.trim().toLowerCase();
  const cfg = ALL_RADAR_COUNTRIES.find((c) => c.aliases.some((a) => jc === a || jc.includes(a)));
  return cfg?.badge || jc.slice(0, 2).toUpperCase();
}

export function getCanonicalCountryLabel(countryName: string | undefined | null, lang: string = "fr"): string {
  if (!countryName) return "Autre";
  if (countryName === "all") return lang === "en" ? "All countries" : "Tous les pays";
  if (countryName === "international") return lang === "en" ? "International & Europe" : "International & Europe";
  const jc = countryName.trim().toLowerCase();
  const cfg = ALL_RADAR_COUNTRIES.find((c) => c.id.toLowerCase() === jc || c.aliases.some((a) => jc === a || jc.includes(a)));
  if (cfg && cfg.id !== "all") {
    return lang === "en" ? cfg.labelEn : cfg.label;
  }
  return countryName;
}
