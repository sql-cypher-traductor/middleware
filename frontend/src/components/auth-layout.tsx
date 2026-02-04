import Link from "next/link";
import { Button } from "@/components/ui/button";
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  sideContent: {
    title: string;
    description: string;
    ctaText?: string;
    ctaLink?: string;
    ctaLabel?: string;
  };
}

export function AuthLayout({
  children,
  title,
  subtitle,
  sideContent,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-slate-950">
      {/* PANEL IZQUIERDO (Visual - Branding) */}
      <div className="hidden lg:flex flex-col items-center justify-center relative bg-slate-900 border-r border-slate-800 overflow-hidden">
        {/* Fondo decorativo Cyber */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-lg px-8">
          {/* Logo con brillo Indigo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000" />
            <div className="relative bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-2xl">
              <span className="text-3xl font-bold tracking-tighter text-white font-mono">
                SQL<span className="text-indigo-500">2</span>Graph
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-white">
              {sideContent.title}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {sideContent.description}
            </p>
          </div>

          {/* Renderizado condicional del CTA */}
          {sideContent.ctaLink &&
            sideContent.ctaText &&
            sideContent.ctaLabel && (
              <div className="pt-8 border-t border-slate-800 w-full flex flex-col items-center gap-4">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider font-mono">
                  {sideContent.ctaText}
                </p>
                <Link href={sideContent.ctaLink}>
                  <Button
                    variant="outline"
                    className="border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 min-w-40"
                  >
                    {sideContent.ctaLabel}
                  </Button>
                </Link>
              </div>
            )}
        </div>
      </div>

      {/* PANEL DERECHO (Formulario) */}
      <div className="flex items-center justify-center p-8 bg-slate-950">
        <div className="mx-auto w-full max-w-100 space-y-6">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>

          {/* Aquí se renderiza el formulario (Login o Register) */}
          {children}

          {/* Renderizado condicional del CTA móvil */}
          {sideContent.ctaLink &&
            sideContent.ctaText &&
            sideContent.ctaLabel && (
              <p className="px-8 text-center text-sm text-slate-500 lg:hidden">
                {sideContent.ctaText}{" "}
                <Link
                  href={sideContent.ctaLink}
                  className="underline underline-offset-4 hover:text-indigo-400"
                >
                  {sideContent.ctaLabel}
                </Link>
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
