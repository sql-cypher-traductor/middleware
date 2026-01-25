import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  // Props para el panel izquierdo dinámico
  sideContent: {
    imageSrc?: string; // Ruta del logo
    title: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    ctaLabel: string;
  };
}

export function AuthLayout({
  children,
  title,
  subtitle,
  sideContent,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* PANEL IZQUIERDO (Visual - Branding) */}
      <div className="hidden lg:flex flex-col items-center justify-center relative bg-zinc-900 text-white overflow-hidden border-r border-zinc-800">
        {/* Fondo decorativo tech */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-zinc-950 opacity-50" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        {/* Patrón de grilla */}

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-lg px-8">
          {/* Logo con efecto de brillo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-xl">
              {/* Reemplaza src con tu logo real en /public */}
              <Image
                src="/logo1.png"
                alt="App Logo"
                width={80}
                height={80}
                className="w-16 h-16 object-contain"
                // Fallback visual si no hay imagen aun
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Fallback de texto si la imagen falla */}
              <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
                S2C
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              {sideContent.title}
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {sideContent.description}
            </p>
          </div>

          <div className="pt-8 border-t border-zinc-800 w-full flex flex-col items-center gap-4">
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">
              {sideContent.ctaText}
            </p>
            <Link href={sideContent.ctaLink}>
              <Button
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800 hover:text-white text-zinc-300 min-w-35"
              >
                {sideContent.ctaLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO (Formulario) */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="mx-auto w-full max-w-100 space-y-6">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          <p className="px-8 text-center text-sm text-muted-foreground lg:hidden">
            {sideContent.ctaText}{" "}
            <Link
              href={sideContent.ctaLink}
              className="underline underline-offset-4 hover:text-primary"
            >
              {sideContent.ctaLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
