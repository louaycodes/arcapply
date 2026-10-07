import { LandingPage } from "@/components/landing/landing-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArcApply — Copilote de Candidature Ingénieur (PFE France & Tunisie)",
  description:
    "Décrochez votre stage PFE ou premier emploi d'ingénieur sans spam ni hallucinations IA. Radar intelligent, score ATS en temps réel, CV vectoriel A4 et lettres sur-mesure.",
};

export default function StandaloneLandingPage() {
  return <LandingPage />;
}
