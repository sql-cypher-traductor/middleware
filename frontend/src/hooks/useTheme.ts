"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_KEY = "sq2graph-theme";

// Set de listeners para notificar cambios
const listeners = new Set<() => void>();

// Función para notificar a todos los listeners
function emitChange() {
  listeners.forEach((listener) => listener());
}

// Función para suscribirse a cambios
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Función para obtener el tema del almacenamiento (snapshot)
function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  return stored || "system";
}

// Función para obtener el tema en servidor (SSR)
function getServerSnapshot(): Theme {
  return "system";
}

// Función para obtener el tema del sistema
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Función para resolver el tema
function resolveThemeValue(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

// Función para aplicar el tema al DOM
function applyThemeToDOM(resolvedValue: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedValue);
  root.classList.remove("light", "dark");
  root.classList.add(resolvedValue);
}

// Función para establecer el tema
function setThemeValue(newTheme: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, newTheme);
  applyThemeToDOM(resolveThemeValue(newTheme));
  emitChange();
}

// Inicializar tema en el cliente
if (typeof window !== "undefined") {
  // Aplicar tema inicial
  const initialTheme = getThemeSnapshot();
  applyThemeToDOM(resolveThemeValue(initialTheme));

  // Escuchar cambios en preferencia del sistema
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    const currentTheme = getThemeSnapshot();
    if (currentTheme === "system") {
      applyThemeToDOM(getSystemTheme());
      emitChange();
    }
  });

  // Escuchar cambios en localStorage desde otras pestañas
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY) {
      const newTheme = (e.newValue as Theme) || "system";
      applyThemeToDOM(resolveThemeValue(newTheme));
      emitChange();
    }
  });
}

export function useTheme(): UseThemeReturn {
  // Usar useSyncExternalStore para sincronizar con localStorage
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);

  // Resolver el tema actual
  const resolvedTheme = resolveThemeValue(theme);

  // Función para cambiar el tema
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeValue(newTheme);
  }, []);

  // Toggle entre light y dark
  const toggleTheme = useCallback(() => {
    const currentResolved = resolveThemeValue(theme);
    const newTheme = currentResolved === "light" ? "dark" : "light";
    setThemeValue(newTheme);
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}

export default useTheme;

