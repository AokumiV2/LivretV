"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cx } from "@/components/ui/primitives";

type Lang = "python" | "cpp" | "bash" | "xml" | "yaml" | "text";

const LANG_LABEL: Record<Lang, string> = {
  python: "Python",
  cpp: "C++",
  bash: "Bash",
  xml: "XML",
  yaml: "YAML",
  text: "Texte"
};

/**
 * Coloration syntaxique volontairement légère : suffisamment de contraste
 * pour la lecture, sans embarquer une bibliothèque de 200 Ko.
 */
function colorize(code: string, lang: Lang) {
  const keywords: Record<Lang, string[]> = {
    python: [
      "import", "from", "def", "class", "return", "if", "elif", "else", "for",
      "while", "try", "except", "finally", "with", "as", "self", "None", "True",
      "False", "not", "in", "and", "or", "lambda", "async", "await", "pass", "raise"
    ],
    cpp: [
      "#include", "class", "public", "private", "protected", "void", "int",
      "double", "float", "bool", "auto", "const", "return", "if", "else", "for",
      "while", "namespace", "using", "template", "struct", "override", "nullptr",
      "true", "false", "new", "delete", "std"
    ],
    bash: [
      "sudo", "apt", "export", "source", "cd", "mkdir", "echo", "if", "then",
      "fi", "for", "do", "done", "ros2", "colcon", "rosdep", "git", "docker",
      "systemctl", "curl"
    ],
    xml: [],
    yaml: [],
    text: []
  };

  const lines = code.split("\n");

  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];

    // Commentaires : la ligne entière
    const commentMatch = line.match(/^(\s*)(#|\/\/)(.*)$/);
    if (commentMatch && lang !== "xml") {
      return (
        <span key={i} className="block text-muted/70">
          {line || " "}
        </span>
      );
    }
    if (lang === "xml" && line.trim().startsWith("<!--")) {
      return (
        <span key={i} className="block text-muted/70">
          {line}
        </span>
      );
    }

    // Découpe sur les chaînes, puis colorie les mots-clés hors chaînes
    const tokens = line.split(/(".*?"|'.*?')/g);
    tokens.forEach((tok, ti) => {
      if (!tok) return;
      if (/^["']/.test(tok)) {
        parts.push(
          <span key={`${i}-${ti}`} className="text-good/85">
            {tok}
          </span>
        );
        return;
      }

      if (lang === "xml") {
        const xmlParts = tok.split(/(<\/?[\w:-]+|\/?>)/g);
        xmlParts.forEach((xp, xi) => {
          if (!xp) return;
          if (/^<\/?[\w:-]+$/.test(xp) || /^\/?>$/.test(xp)) {
            parts.push(
              <span key={`${i}-${ti}-${xi}`} className="text-accent2">
                {xp}
              </span>
            );
          } else {
            parts.push(<span key={`${i}-${ti}-${xi}`}>{xp}</span>);
          }
        });
        return;
      }

      if (lang === "yaml") {
        const m = tok.match(/^(\s*)([\w./*-]+)(:)(.*)$/);
        if (m) {
          parts.push(
            <span key={`${i}-${ti}`}>
              {m[1]}
              <span className="text-accent2">{m[2]}</span>
              <span className="text-muted">{m[3]}</span>
              <span>{m[4]}</span>
            </span>
          );
          return;
        }
      }

      const words = tok.split(/(\W)/g);
      words.forEach((w, wi) => {
        const key = `${i}-${ti}-${wi}`;
        if (keywords[lang].includes(w)) {
          parts.push(
            <span key={key} className="text-accent2">
              {w}
            </span>
          );
        } else if (/^\d+\.?\d*$/.test(w)) {
          parts.push(
            <span key={key} className="text-warn/85">
              {w}
            </span>
          );
        } else {
          parts.push(<span key={key}>{w}</span>);
        }
      });
    });

    return (
      <span key={i} className="block">
        {parts.length ? parts : " "}
      </span>
    );
  });
}

export function CodeBlock({
  code,
  lang,
  file,
  className
}: {
  code: string;
  lang: Lang;
  file?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Le presse-papiers peut être refusé hors contexte sécurisé : on ignore.
    }
  };

  return (
    <div className={cx("group border border-line bg-[#0a0a11]", className)}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {file || LANG_LABEL[lang]}
        </span>
        <button
          onClick={copier}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-accent2"
          aria-label="Copier le code"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre className="no-scrollbar overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-ink/90">
        <code>{colorize(code, lang)}</code>
      </pre>
    </div>
  );
}

export function CodeTabs({
  tabs
}: {
  tabs: { label: string; lang: Lang; file?: string; code: string }[];
}) {
  const [actif, setActif] = useState(0);
  const t = tabs[actif];

  return (
    <div>
      <div className="flex gap-px bg-line">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActif(i)}
            className={cx(
              "px-5 py-2.5 font-display text-[10px] uppercase tracking-hud transition-colors",
              i === actif
                ? "bg-[#0a0a11] text-accent2"
                : "bg-panel text-muted hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CodeBlock code={t.code} lang={t.lang} file={t.file} className="border-t-0" />
    </div>
  );
}
