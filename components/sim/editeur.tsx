"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Decoration, EditorView } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { cx } from "@/components/ui/primitives";

/* CodeMirror ne pèse sur le bundle que sur cette page, et seulement
   après le rendu initial : il n'a rien à faire côté serveur. */
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-[11px] text-muted">
      chargement de l&apos;éditeur…
    </div>
  )
});

/**
 * L'éditeur Python de l'atelier.
 *
 * Le thème n'est pas décoratif : la ligne fautive d'un traceback est
 * surlignée dans la gouttière et dans le texte. Sans ça, un message
 * d'erreur de vingt lignes oblige à compter les lignes à la main.
 */
export function Editeur({
  valeur,
  onChange,
  ligneErreur,
  lectureSeule = false,
  hauteur = "100%"
}: {
  valeur: string;
  onChange: (v: string) => void;
  ligneErreur?: number | null;
  lectureSeule?: boolean;
  hauteur?: string;
}) {
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  const theme = useMemo(
    () =>
      EditorView.theme(
        {
          "&": {
            backgroundColor: "transparent",
            color: "#e8eaf2",
            fontSize: "13px",
            height: "100%"
          },
          ".cm-content": {
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            padding: "14px 0",
            caretColor: "#5ee0ff"
          },
          ".cm-gutters": {
            backgroundColor: "transparent",
            color: "#4c5268",
            border: "none",
            borderRight: "1px solid #1e1f2b",
            paddingRight: "6px"
          },
          ".cm-activeLine": { backgroundColor: "rgba(94,224,255,0.045)" },
          ".cm-activeLineGutter": {
            backgroundColor: "transparent",
            color: "#8b93a8"
          },
          ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
            backgroundColor: "rgba(26,47,255,0.35)"
          },
          "&.cm-focused": { outline: "none" },
          ".cm-cursor": { borderLeftColor: "#5ee0ff" },
          ".cm-line-erreur": {
            backgroundColor: "rgba(255,77,94,0.14)",
            boxShadow: "inset 2px 0 0 #ff4d5e"
          },
          ".cm-scroller": { overflow: "auto", lineHeight: "1.65" }
        },
        { dark: true }
      ),
    []
  );

  const surlignage = useMemo(() => {
    if (!ligneErreur) return [];
    return [
      EditorView.decorations.compute(["doc"], (state) => {
        const total = state.doc.lines;
        if (ligneErreur < 1 || ligneErreur > total) return Decoration.none;
        const ligne = state.doc.line(ligneErreur);
        return Decoration.set([
          Decoration.line({ class: "cm-line-erreur" }).range(ligne.from)
        ]);
      })
    ];
  }, [ligneErreur]);

  const extensions = useMemo(
    () => [python(), theme, EditorView.lineWrapping, ...surlignage],
    [theme, surlignage]
  );

  if (!monte) {
    return (
      <pre
        className={cx(
          "h-full overflow-auto p-4 font-mono text-[13px] leading-[1.65] text-muted"
        )}
        style={{ height: hauteur }}
      >
        {valeur}
      </pre>
    );
  }

  return (
    <CodeMirror
      value={valeur}
      height={hauteur}
      onChange={onChange}
      editable={!lectureSeule}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
        tabSize: 4
      }}
      theme="dark"
      className="h-full"
    />
  );
}
