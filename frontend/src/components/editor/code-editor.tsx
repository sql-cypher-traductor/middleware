"use client";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language: "sql" | "cypher" | "plaintext";
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <div className="h-full w-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
    );

  return (
    <div className="h-full w-full border rounded-md overflow-hidden shadow-sm">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language} // Forzar cambio si prop cambia
        value={value}
        theme={theme === "dark" ? "vs-dark" : "light"}
        onChange={onChange}
        options={{
          readOnly: readOnly,
          minimap: { enabled: false }, // Ahorrar espacio
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
