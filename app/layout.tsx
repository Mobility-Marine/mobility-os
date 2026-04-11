import type { Metadata } from "next";
import { cssVariablesLight, cssVariablesDark } from "@/lib/ui/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mobility OS",
  description: "Sistema operativo empresarial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: cssVariablesLight + cssVariablesDark,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('mos-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = saved || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
