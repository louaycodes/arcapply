import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/navigation/sidebar";
import { AuthProvider } from "@/components/auth/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";

export const metadata: Metadata = {
  title: "ArcApply — Vos candidatures d'ingénieur en toute simplicité",
  description:
    "Préparez, adaptez et suivez vos candidatures de stage PFE et premier emploi d'ingénieur en France et en Tunisie avec un score de compatibilité en temps réel.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-orange-100 selection:text-orange-900 flex min-h-screen">
        <AuthProvider>
          <LanguageProvider>
            <div className="flex w-full min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <header className="h-13 border-b border-border/60 bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>ArcApply Cockpit</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                  </div>
                </header>
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

