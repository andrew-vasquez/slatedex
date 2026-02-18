"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiFolder, FiLink, FiShare2, FiUploadCloud, FiX } from "react-icons/fi";
import SavedTeamsPanel from "./SavedTeamsPanel";
import { encodeSharedTeamPayload, parseSharedTeamInput, type SharedTeamPayload } from "@/lib/teamShare";
import { useAnimatedUnmount } from "@/hooks/useAnimatedUnmount";
import type { SavedTeam } from "@/lib/api";

type TeamToolsTab = "saved" | "share";

interface VersionOption {
  id: string;
  label: string;
}

interface TeamToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  savedTeams: SavedTeam[];
  activeTeamId: string | null;
  onSaveAs: (name: string, versionIds?: string[]) => Promise<void>;
  onLoadSavedTeam: (teamId: string) => void;
  onDeleteSavedTeam: (teamId: string) => Promise<void>;
  onRenameSavedTeam: (teamId: string, name: string) => Promise<void>;
  onRefreshSavedTeams: () => Promise<void>;
  isSaving: boolean;
  payload: SharedTeamPayload;
  onImport: (payload: SharedTeamPayload) => string;
  gameVersions?: VersionOption[];
  selectedVersionId?: string | null;
}

const TeamToolsModal = ({
  isOpen,
  onClose,
  isAuthenticated,
  savedTeams,
  activeTeamId,
  onSaveAs,
  onLoadSavedTeam,
  onDeleteSavedTeam,
  onRenameSavedTeam,
  onRefreshSavedTeams,
  isSaving,
  payload,
  onImport,
  gameVersions,
  selectedVersionId,
}: TeamToolsModalProps) => {
  const [activeTab, setActiveTab] = useState<TeamToolsTab>("saved");
  const [importInput, setImportInput] = useState("");
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [tabTransitionKey, setTabTransitionKey] = useState(0);

  const token = useMemo(() => encodeSharedTeamPayload(payload), [payload]);
  const { shouldRender, isAnimatingOut, onAnimationEnd } = useAnimatedUnmount(isOpen, 200);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("saved");
      setImportInput("");
      setShareStatus(null);
      setTabTransitionKey(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setTabTransitionKey((prev) => prev + 1);
  }, [activeTab]);

  const copyShareLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?team=${encodeURIComponent(token)}`;
      await navigator.clipboard.writeText(url);
      setShareStatus("Share link copied.");
    } catch {
      setShareStatus("Could not copy share link.");
    }
  };

  const copyTeamJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setShareStatus("Team JSON copied.");
    } catch {
      setShareStatus("Could not copy JSON.");
    }
  };

  const importTeam = () => {
    const parsed = parseSharedTeamInput(importInput);
    if (!parsed) {
      setShareStatus("Invalid share link or JSON payload.");
      return;
    }

    const result = onImport(parsed);
    setShareStatus(result);
    if (!result.toLowerCase().includes("invalid")) {
      setImportInput("");
      onClose();
    }
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center overflow-hidden p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="team-tools-modal-title">
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(20,16,12,0.45)] backdrop-blur-[2px]"
        style={{ animation: isAnimatingOut ? "backdropFadeOut 160ms ease-in both" : "backdropFadeIn 180ms ease-out both" }}
        aria-label="Close team tools dialog"
      />

      <section
        className={`panel relative w-full max-w-3xl overflow-hidden p-5 lg:max-h-[min(88dvh,52rem)] ${isAnimatingOut ? "animate-scale-out" : "animate-scale-in"}`}
        onAnimationEnd={onAnimationEnd}
        aria-labelledby="team-tools-modal-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="team-tools-modal-title" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              Team Tools
            </h3>
            <p className="mt-1 text-[0.78rem]" style={{ color: "var(--text-muted)" }}>
              Manage saved teams or share/import your current team.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary !px-2 !py-1.5"
            aria-label="Close team tools dialog"
          >
            <FiX size={14} />
          </button>
        </div>

        <div className="mt-4 inline-flex rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.68rem] font-semibold transition-colors duration-200"
            style={{
              background: activeTab === "saved" ? "var(--accent-soft)" : "transparent",
              border: activeTab === "saved" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
              color: activeTab === "saved" ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            <FiFolder size={12} />
            Saved Teams
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("share")}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.68rem] font-semibold transition-colors duration-200"
            style={{
              background: activeTab === "share" ? "var(--accent-soft)" : "transparent",
              border: activeTab === "share" ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
              color: activeTab === "share" ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            <FiShare2 size={12} />
            Share/Import
          </button>
        </div>

        <div key={tabTransitionKey} className="mt-4 animate-accordion-down lg:max-h-[min(68dvh,36rem)] lg:overflow-y-auto lg:pr-1 lg:custom-scrollbar">
          {activeTab === "saved" ? (
            isAuthenticated ? (
              <SavedTeamsPanel
                variant="embedded"
                savedTeams={savedTeams}
                activeTeamId={activeTeamId}
                onSaveAs={onSaveAs}
                onLoad={onLoadSavedTeam}
                onDelete={onDeleteSavedTeam}
                onRename={onRenameSavedTeam}
                onRefresh={onRefreshSavedTeams}
                isSaving={isSaving}
                gameVersions={gameVersions}
                selectedVersionId={selectedVersionId}
              />
            ) : (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Sign in to save and manage teams.
              </p>
            )
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button type="button" onClick={copyShareLink} className="btn-secondary !justify-start !py-2">
                  <FiLink size={13} />
                  Copy Share Link
                </button>
                <button type="button" onClick={copyTeamJson} className="btn-secondary !justify-start !py-2">
                  <FiCopy size={13} />
                  Copy Team JSON
                </button>
              </div>

              <label className="mt-4 block">
                <span className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                  Import Payload
                </span>
                <textarea
                  value={importInput}
                  onChange={(event) => setImportInput(event.target.value)}
                  rows={5}
                  className="auth-input resize-y !text-[0.74rem]"
                  placeholder="Paste a share link, base64 token, or JSON payload"
                />
              </label>

              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="button" onClick={importTeam} className="btn-secondary !justify-center">
                  <FiUploadCloud size={13} />
                  Import Team
                </button>
              </div>

              {shareStatus && (
                <p className="mt-2 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                  {shareStatus}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TeamToolsModal;
