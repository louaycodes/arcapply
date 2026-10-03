import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/navigation/sidebar";
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
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
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <div className="flex w-full min-h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <TopNavbar />
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
