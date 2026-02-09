"use client";

import React from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: "sql" | "cypher";
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "200px",
  placeholder,
}: CodeEditorProps) {
  const handleEditorMount: OnMount = (editor, monaco) => {
    // Registrar el lenguaje Cypher si no existe
    if (!monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === "cypher")) {
      monaco.languages.register({ id: "cypher" });
      monaco.languages.setMonarchTokensProvider("cypher", {
        tokenizer: {
          root: [
            // Keywords
            [
              /\b(MATCH|WHERE|RETURN|CREATE|DELETE|DETACH|SET|REMOVE|MERGE|WITH|UNWIND|OPTIONAL|ORDER BY|SKIP|LIMIT|AS|AND|OR|NOT|IN|IS NULL|IS NOT NULL|STARTS WITH|ENDS WITH|CONTAINS|CASE|WHEN|THEN|ELSE|END)\b/i,
              "keyword",
            ],
            // Functions
            [
              /\b(count|sum|avg|min|max|collect|size|length|type|id|labels|keys|properties|nodes|relationships|toInteger|toFloat|toString|toBoolean|coalesce|head|tail|last|reverse|reduce)\b/i,
              "function",
            ],
            // Node patterns
            [/\([a-zA-Z_][a-zA-Z0-9_]*:[a-zA-Z_][a-zA-Z0-9_]*\)/, "type"],
            // Relationship patterns
            [/\[[a-zA-Z_][a-zA-Z0-9_]*:[a-zA-Z_][a-zA-Z0-9_]*]/, "type"],
            // Variables
            [/\$[a-zA-Z_][a-zA-Z0-9_]*/, "variable"],
            // Strings
            [/"([^"\\]|\\.)*"/, "string"],
            [/'([^'\\]|\\.)*'/, "string"],
            // Numbers
            [/\b\d+(\.\d+)?\b/, "number"],
            // Comments
            [/\/\/.*$/, "comment"],
            // Operators
            [/[<>]=?|<>|=~|=/, "operator"],
          ],
        },
      });
    }
  };

  const editorLanguage = language === "cypher" ? "cypher" : "sql";

  return (
    <div className="code-editor-container">
      <Editor
        height={height}
        language={editorLanguage}
        value={value}
        onChange={(val) => onChange?.(val || "")}
        onMount={handleEditorMount}
        loading={
          <div className="editor-loading">
            <Loader2 className="spinner" size={24} />
            <span>Cargando editor...</span>
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'Fira Code', 'Consolas', monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 10, bottom: 10 },
          renderLineHighlight: readOnly ? "none" : "line",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          placeholder: placeholder,
        }}
        theme="vs-dark"
      />

      <style jsx>{`
        .code-editor-container {
          width: 100%;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid var(--border-primary);
        }

        :global(.editor-loading) {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 100%;
          color: var(--text-secondary);
        }

        :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}



