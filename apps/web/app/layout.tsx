import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/navigation/sidebar";

export const metadata: Metadata = {
  title: "ArcApply — Vos candidatures d'ingénieur en toute simplicité",
  description:
    "Préparez, adaptez et suivez vos candidatures de stage PFE et premier emploi d'ingénieur en France et en Tunisie avec un score de compatibilité en temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-background text-foreground antialiased selection:bg-orange-100 selection:text-orange-900 flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
