import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/navigation/sidebar";

export const metadata: Metadata = {
  title: "ArcApply — Atelier & Cockpit PFE Ingénieur",
  description:
    "Cockpit haute précision pour stages PFE France et Tunisie. Adaptation de CV zéro-hallucination, matching ATS déterministe et suivi Kanban.",
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
