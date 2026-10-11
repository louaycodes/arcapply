import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileNavProvider } from "@/components/navigation/sidebar";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { AuthProvider } from "@/components/auth/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "ArcApply — Vos candidatures d'ingénieur en toute simplicité",
  description:
    "Préparez, adaptez et suivez vos candidatures de stage PFE et premier emploi d'ingénieur en France et en Tunisie avec un score de compatibilité en temps réel.",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/arcapply-symbol-favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/brand/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/brand/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        <link rel="manifest" href="/brand/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('arcapply-theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-orange-100 selection:text-orange-900 dark:selection:bg-orange-950 dark:selection:text-orange-200 flex min-h-screen">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <MobileNavProvider>
              <div className="flex w-full min-h-screen bg-background text-foreground">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 bg-background text-foreground">
                  <TopNavbar />
                  <main className="flex-1 min-w-0 bg-background text-foreground">
                    {children}
                  </main>
                </div>
              </div>
              </MobileNavProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
