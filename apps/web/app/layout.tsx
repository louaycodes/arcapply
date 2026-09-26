import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/navigation/sidebar";

export const metadata: Metadata = {
  title: "ArcApply — Copilote PFE Ingénieur",
  description:
    "Cockpit haute efficacité pour stages PFE France et Tunisie. Adaptation de CV zéro-hallucination, matching ATS déterministe et suivi Kanban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-primary/30 selection:text-white flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
