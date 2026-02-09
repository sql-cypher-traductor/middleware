import type {Metadata} from "next";
import {Inter, JetBrains_Mono} from "next/font/google";
import "./globals.css";
import React from "react";
import {Toaster} from "sonner";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "SQ2Graph System",
    description: "Traductor de bases de datos SQL a Neo4j",
};

// Inicialización de tema oscuro/claro
const initTheme = `
  (function() {
    try {
      var theme = localStorage.getItem('sq2graph-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var resolvedTheme = theme === 'dark' || (theme === 'system' || !theme) && prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      document.documentElement.classList.add(resolvedTheme);
    } catch (e) {}
  })();
`;

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
        <head>
            <script dangerouslySetInnerHTML={{__html: initTheme}}/>
            <title></title>
        </head>
        <body
            className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        >
        {children}
        <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
                style: {
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                },
            }}
        />
        </body>
        </html>
    );
}
