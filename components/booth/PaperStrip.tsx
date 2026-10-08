"use client";

import { useRef, useState } from "react";
import { copyFor } from "@/lib/copy";
import { PAPER_MAX_BYTES, clipExcerpt, emptyPaper, hasPaper, type PaperContext } from "@/lib/paper";
import type { AppLanguage } from "@/lib/types";

type Props = {
  paper: PaperContext;
  language: AppLanguage;
  disabled?: boolean;
  onChange: (next: PaperContext) => void;
};

export function PaperStrip({ paper, language, disabled, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const text = copyFor(language);
  const attached = hasPaper(paper) || Boolean(paper.fileName);

  const setErrorFromCode = (code: string) => {
    if (code === "too_large") setError(text.paperTooLarge);
    else if (code === "pages") setError(text.paperPages);
    else if (code === "type") setError(text.paperType);
    else if (code === "empty") setError(text.paperEmpty);
    else setError(text.paperFailed);
    setPasteOpen(true);
  };

  const upload = async (file: File) => {
    setError("");
    if (file.size > PAPER_MAX_BYTES) {
      setErrorFromCode("too_large");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/paper", { method: "POST", body: form });
      const json = (await res.json()) as { excerpt?: string; fileName?: string; error?: string };
      if (!res.ok) {
        setErrorFromCode(json.error || "extract");
        return;
      }
      setPasteOpen(false);
      onChange({
        ...paper,
        excerpt: json.excerpt || "",
        fileName: json.fileName || file.name,
        title: paper.title || (json.fileName || file.name).replace(/\.pdf$/i, ""),
      });
    } catch {
      setErrorFromCode("extract");
    } finally {
      setBusy(false);
    }
  };

  const label = paper.fileName || paper.title || text.paper;

  return (
    <div className="paper-attach">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />

      {attached ? (
        <p className="paper-chip">
          <span className="paper-chip-name">{busy ? text.paperReading : label}</span>
          <button
            type="button"
            className="paper-chip-remove"
            disabled={disabled || busy}
            onClick={() => {
              setError("");
              setPasteOpen(false);
              onChange(emptyPaper());
            }}
          >
            {text.paperClear}
          </button>
        </p>
      ) : (
        <button
          type="button"
          className="paper-add"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? text.paperReading : text.paperAdd}
        </button>
      )}

      {error ? (
        <p role="alert" className="paper-attach-error">
          {error}
        </p>
      ) : null}

      {pasteOpen && !paper.excerpt ? (
        <textarea
          value={paper.excerpt}
          disabled={disabled}
          rows={2}
          placeholder={text.paperPaste}
          className="paper-attach-paste"
          onChange={(event) => onChange({ ...paper, excerpt: clipExcerpt(event.target.value) })}
        />
      ) : null}
    </div>
  );
}
