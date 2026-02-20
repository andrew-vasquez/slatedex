"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { FiSave, FiFolder, FiTrash2, FiEdit2, FiCheck, FiX, FiRefreshCw, FiDownload } from "react-icons/fi";
import { getVersionLabel } from "@/lib/pokemon";
import { pokemonSpriteSrc } from "@/lib/image";
import type { SavedTeam } from "@/lib/api";

interface VersionOption {
  id: string;
  label: string;
}

interface SavedTeamsPanelProps {
  teamHasPokemon: boolean;
  savedTeams: SavedTeam[];
  activeTeamId: string | null;
  onSaveAs: (name: string, versionIds?: string[]) => Promise<void>;
  onLoad: (teamId: string) => void;
  onOverwrite: (teamId: string) => Promise<void>;
  onDelete: (teamId: string) => Promise<void>;
  onRename: (teamId: string, name: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isSaving: boolean;
  variant?: "panel" | "embedded";
  gameVersions?: VersionOption[];
  selectedVersionId?: string | null;
}

type SaveStep = "name" | "version";
const DELETE_ANIMATION_MS = 180;

const SavedTeamsPanel = ({
  teamHasPokemon,
  savedTeams,
  activeTeamId,
  onSaveAs,
  onLoad,
  onOverwrite,
  onDelete,
  onRename,
  onRefresh,
  isSaving,
  variant = "panel",
  gameVersions = [],
  selectedVersionId,
}: SavedTeamsPanelProps) => {
  const [newTeamName, setNewTeamName] = useState("");
  const [saveStep, setSaveStep] = useState<SaveStep>("name");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingTeamIds, setDeletingTeamIds] = useState<string[]>([]);
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasMultipleVersions = gameVersions.length > 1;
  const combinedVersionsLabel = gameVersions.length === 2 ? "Both versions" : "All versions";

  const currentVersionLabel = selectedVersionId
    ? gameVersions.find((v) => v.id === selectedVersionId)?.label ?? null
    : null;

  const handleNameSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = newTeamName.trim();
      if (!name) return;
      if (!teamHasPokemon) {
        setSaveError("Add at least one Pokemon before saving a team.");
        return;
      }
      setSaveError(null);

      if (hasMultipleVersions) {
        setSaveStep("version");
      } else {
        setIsCreating(true);
        try {
          await onSaveAs(name, selectedVersionId ? [selectedVersionId] : undefined);
          setIsCreating(false);
          setNewTeamName("");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not save team.";
          setSaveError(message);
          setIsCreating(false);
        }
      }
    },
    [newTeamName, hasMultipleVersions, onSaveAs, selectedVersionId, teamHasPokemon]
  );

  const handleVersionSave = useCallback(
    async (versionIds: string[]) => {
      const name = newTeamName.trim();
      if (!name) return;
      if (!teamHasPokemon) {
        setSaveError("Add at least one Pokemon before saving a team.");
        return;
      }
      setSaveError(null);

      setIsCreating(true);
      try {
        await onSaveAs(name, versionIds);
        setNewTeamName("");
        setSaveStep("name");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save team.";
        setSaveError(message);
      } finally {
        setIsCreating(false);
      }
    },
    [newTeamName, onSaveAs, teamHasPokemon]
  );

  const startRename = useCallback((team: SavedTeam) => {
    setEditingId(team.id);
    setEditName(team.name);
  }, []);

  const handleDelete = useCallback(
    async (teamId: string) => {
      if (deletingTeamIds.includes(teamId)) return;
      setDeletingTeamIds((prev) => [...prev, teamId]);

      await new Promise((resolve) => window.setTimeout(resolve, DELETE_ANIMATION_MS));
      try {
        await onDelete(teamId);
      } finally {
        setDeletingTeamIds((prev) => prev.filter((id) => id !== teamId));
      }
    },
    [deletingTeamIds, onDelete]
  );

   const confirmRename = useCallback(
    async (teamId: string) => {
      const name = editName.trim();
      if (name) {
        await onRename(teamId, name);
      }
      setEditingId(null);
    },
    [editName, onRename]
  );

  const handleOverwrite = useCallback(
    async (teamId: string) => {
      setOverwriteConfirmId(null);
      try {
        await onOverwrite(teamId);
      } catch {}
    },
    [onOverwrite]
  );

  const filledCount = (team: SavedTeam) => {
    if (!Array.isArray(team.pokemon)) return 0;
    return team.pokemon.filter((p) => p !== null).length;
  };

  const wrapperClassName = variant === "panel" ? "panel p-4" : "";

  return (
    <section className={wrapperClassName} aria-label="Saved teams">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
          <FiFolder size={14} className="inline mr-1.5" style={{ verticalAlign: "-2px" }} />
          Saved Teams
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          aria-label="Refresh saved teams"
        >
          <FiRefreshCw size={12} />
        </button>
      </div>

      {/* Save flow */}
      {saveStep === "name" ? (
        <form onSubmit={handleNameSubmit} className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => {
              setNewTeamName(e.target.value);
              if (saveError) setSaveError(null);
            }}
            placeholder="Team name..."
            className="auth-input flex-1 !py-1.5 !text-xs"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={!newTeamName.trim() || !teamHasPokemon || isCreating || isSaving}
            className="btn-secondary !py-1.5 !px-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            <FiSave size={12} />
            Save
          </button>
        </form>
      ) : (
        <div
          className="mb-3 rounded-xl border p-3"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <p className="text-[0.68rem] font-semibold mb-2.5" style={{ color: "var(--text-secondary)" }}>
            Save &ldquo;{newTeamName}&rdquo; for&hellip;
          </p>

          <div className="flex gap-2">
            {/* Current version */}
            {currentVersionLabel && (
              <button
                type="button"
                disabled={!teamHasPokemon || isCreating || isSaving}
                onClick={() => handleVersionSave([selectedVersionId!])}
                className="flex-1 rounded-lg border px-3 py-2.5 text-center text-[0.68rem] font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
                style={{
                  background: "var(--accent-soft)",
                  borderColor: "rgba(218,44,67,0.3)",
                  color: "var(--text-primary)",
                }}
              >
                {currentVersionLabel} only
              </button>
            )}

            {/* All versions */}
            <button
              type="button"
              disabled={!teamHasPokemon || isCreating || isSaving}
              onClick={() => handleVersionSave(gameVersions.map((v) => v.id))}
              className="flex-1 rounded-lg border px-3 py-2.5 text-center text-[0.68rem] font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "var(--surface-3)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              {combinedVersionsLabel}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSaveStep("name");
              setSaveError(null);
            }}
            className="mt-2 text-[0.62rem] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ← Change name
          </button>
        </div>
      )}

      {saveError ? (
        <p className="-mt-1 mb-3 text-[0.66rem]" style={{ color: "#fca5a5" }}>
          {saveError}
        </p>
      ) : null}

      {/* List of saved teams */}
      {savedTeams.length === 0 ? (
        <p className="text-[0.7rem] py-2" style={{ color: "var(--text-muted)" }}>
          No saved teams yet. Build a team and save it above.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto custom-scrollbar">
          {savedTeams.map((team) => {
            const isDeleting = deletingTeamIds.includes(team.id);
            const isActive = team.id === activeTeamId;
            const sprites = Array.isArray(team.pokemon) ? team.pokemon : [];

            return (
              <article
                key={team.id}
                className="rounded-lg transition-[opacity,transform,max-height,margin,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: isDeleting ? 0 : 1,
                  transform: isDeleting ? "translateY(-6px) scale(0.98)" : "none",
                  maxHeight: isDeleting ? "0px" : "200px",
                  marginTop: isDeleting ? "0px" : undefined,
                  marginBottom: isDeleting ? "0px" : undefined,
                  paddingTop: isDeleting ? "0px" : undefined,
                  paddingBottom: isDeleting ? "0px" : undefined,
                  overflow: "hidden",
                  background: isActive ? "var(--accent-soft)" : "var(--surface-2)",
                  border: `1px solid ${isActive ? "rgba(218, 44, 67, 0.3)" : "var(--border)"}`,
                }}
              >
                {overwriteConfirmId === team.id ? (
                  <div className="px-3 py-2.5">
                    <p className="text-[0.7rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                      Overwrite &ldquo;{team.name}&rdquo; with your current team?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleOverwrite(team.id)}
                        disabled={isSaving}
                        className="rounded-lg border px-3 py-1.5 text-[0.68rem] font-semibold transition-colors disabled:opacity-50"
                        style={{
                          background: "var(--accent-soft)",
                          borderColor: "rgba(218,44,67,0.3)",
                          color: "var(--text-primary)",
                        }}
                      >
                        Overwrite
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverwriteConfirmId(null)}
                        className="btn-secondary !py-1.5 !px-3 !text-[0.68rem]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : editingId === team.id ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-2 min-w-0">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="auth-input !py-1 !text-xs flex-1"
                      maxLength={50}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename(team.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => confirmRename(team.id)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded"
                      style={{ color: "#22c55e" }}
                      aria-label="Confirm rename"
                    >
                      <FiCheck size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Cancel rename"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onLoad(team.id)}
                        disabled={isDeleting}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {team.name}
                        </p>
                        <p className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                          {filledCount(team)}/6 Pokémon · {getVersionLabel(team.gameId, team.selectedVersionId)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverwriteConfirmId(team.id)}
                        disabled={isDeleting || !teamHasPokemon}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded disabled:opacity-30"
                        style={{ color: "var(--version-color, var(--accent))" }}
                        aria-label={`Overwrite ${team.name} with current team`}
                        title="Overwrite with current team"
                      >
                        <FiDownload size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => startRename(team)}
                        disabled={isDeleting}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded"
                        style={{ color: "var(--text-muted)" }}
                        aria-label={`Rename ${team.name}`}
                      >
                        <FiEdit2 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(team.id)}
                        disabled={isDeleting}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded"
                        style={{ color: "#ef4444" }}
                        aria-label={`Delete ${team.name}`}
                      >
                        {isDeleting ? (
                          <FiRefreshCw size={11} className="animate-spin" />
                        ) : (
                          <FiTrash2 size={11} />
                        )}
                      </button>
                    </div>

                    {/* Sprite preview row */}
                    <div className="mt-1.5 flex items-center gap-0.5">
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const mon = sprites[idx];
                        return (
                          <div
                            key={idx}
                            className="flex h-7 w-7 items-center justify-center rounded-md"
                            style={{
                              background: mon ? "var(--surface-3)" : "var(--surface-1)",
                              border: `1px solid ${mon ? "var(--border)" : "transparent"}`,
                            }}
                          >
                            {mon ? (
                              <Image
                                src={pokemonSpriteSrc(mon.sprite, mon.id)}
                                alt={mon.name}
                                width={22}
                                height={22}
                                className="h-[22px] w-[22px] object-contain"
                              />
                            ) : (
                              <span className="text-[0.4rem]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>·</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SavedTeamsPanel;
