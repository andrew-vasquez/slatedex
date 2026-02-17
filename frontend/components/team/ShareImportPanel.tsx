"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiCopy, FiLink, FiUploadCloud } from "react-icons/fi";
import { encodeSharedTeamPayload, parseSharedTeamInput, type SharedTeamPayload } from "@/lib/teamShare";

interface ShareImportPanelProps {
  payload: SharedTeamPayload;
  onImport: (payload: SharedTeamPayload) => string;
}

const ShareImportPanel = ({ payload, onImport }: ShareImportPanelProps) => {
  const [importInput, setImportInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const token = useMemo(() => encodeSharedTeamPayload(payload), [payload]);

  const copyShareLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?team=${encodeURIComponent(token)}`;
      await navigator.clipboard.writeText(url);
      setStatus("Share link copied.");
    } catch {
      setStatus("Could not copy share link.");
    }
  };

  const copyTeamJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setStatus("Team JSON copied.");
    } catch {
      setStatus("Could not copy JSON.");
    }
  };

  const importTeam = () => {
    const parsed = parseSharedTeamInput(importInput);
    if (!parsed) {
      setStatus("Invalid share link or JSON payload.");
      return;
    }

    const result = onImport(parsed);
    setStatus(result);
    if (!result.toLowerCase().includes("invalid")) {
      setImportInput("");
    }
  };

  return (
    <section className="panel p-4" aria-labelledby="share-import-heading">
      <div className="flex items-center justify-between gap-2">
        <h3 id="share-import-heading" className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
          Share & Import
        </h3>
        <button
          type="button"
          className="btn-secondary !px-2.5 !py-1.5 !text-[0.62rem]"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="share-import-panel-content"
        >
          {isExpanded ? "Hide" : "Open"}
          <FiChevronDown
            size={12}
            aria-hidden="true"
            style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
          />
        </button>
      </div>

      <p className="mt-1 text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
        {isExpanded
          ? "Export this team as a link or JSON, then import from either format."
          : "Optional advanced tools for sharing and restoring a team."}
      </p>

      <div
        id="share-import-panel-content"
        aria-hidden={!isExpanded}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-[180ms] ease-out ${
          isExpanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={copyShareLink} className="btn-secondary !justify-start !text-[0.68rem] !py-2">
              <FiLink size={13} />
              Copy Share Link
            </button>
            <button type="button" onClick={copyTeamJson} className="btn-secondary !justify-start !text-[0.68rem] !py-2">
              <FiCopy size={13} />
              Copy Team JSON
            </button>
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
              Import Payload
            </span>
            <textarea
              value={importInput}
              onChange={(event) => setImportInput(event.target.value)}
              rows={4}
              className="auth-input resize-y !text-[0.7rem]"
              placeholder="Paste a share link, base64 token, or JSON payload"
            />
          </label>

          <button type="button" onClick={importTeam} className="btn-secondary mt-2 !w-full !justify-center !text-[0.68rem] !py-2">
            <FiUploadCloud size={13} />
            Import Team
          </button>
        </div>
      </div>

      {status && (
        <p className="mt-2 text-[0.66rem]" style={{ color: "var(--text-muted)" }}>
          {status}
        </p>
      )}
    </section>
  );
};

export default ShareImportPanel;
