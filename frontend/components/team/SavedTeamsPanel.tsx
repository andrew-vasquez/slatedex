"use client";

import { useState, useCallback } from "react";
import { FiSave, FiFolder, FiTrash2, FiEdit2, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import { getVersionLabel } from "@/lib/pokemon";
import type { SavedTeam } from "@/lib/api";

interface VersionOption {
  id: string;
  label: string;
}

interface SavedTeamsPanelProps {
  savedTeams: SavedTeam[];
  activeTeamId: string | null;
  onSaveAs: (name: string, versionIds?: string[]) => Promise<void>;
  onLoad: (teamId: string) => void;
  onDelete: (teamId: string) => Promise<void>;
  onRename: (teamId: string, name: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isSaving: boolean;
  variant?: "panel" | "embedded";
  gameVersions?: VersionOption[];
  selectedVersionId?: string | null;
}

type SaveStep = "name" | "version";

const SavedTeamsPanel = ({
  savedTeams,
  activeTeamId,
  onSaveAs,
  onLoad,
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

  const hasMultipleVersions = gameVersions.length > 1;

  const currentVersionLabel = selectedVersionId
    ? gameVersions.find((v) => v.id === selectedVersionId)?.label ?? null
    : null;

  const handleNameSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const name = newTeamName.trim();
      if (!name) return;

      if (hasMultipleVersions) {
        setSaveStep("version");
      } else {
        setIsCreating(true);
        onSaveAs(name, selectedVersionId ? [selectedVersionId] : undefined).finally(() => {
          setIsCreating(false);
          setNewTeamName("");
        });
      }
    },
    [newTeamName, hasMultipleVersions, onSaveAs, selectedVersionId]
  );

  const handleVersionSave = useCallback(
    async (versionIds: string[]) => {
      const name = newTeamName.trim();
      if (!name) return;

      setIsCreating(true);
      try {
        await onSaveAs(name, versionIds);
        setNewTeamName("");
        setSaveStep("name");
      } finally {
        setIsCreating(false);
      }
    },
    [newTeamName, onSaveAs]
  );

  const startRename = useCallback((team: SavedTeam) => {
    setEditingId(team.id);
    setEditName(team.name);
  }, []);

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
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name..."
            className="auth-input flex-1 !py-1.5 !text-xs"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={!newTeamName.trim() || isCreating || isSaving}
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
                disabled={isCreating || isSaving}
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
              disabled={isCreating || isSaving}
              onClick={() => handleVersionSave(gameVersions.map((v) => v.id))}
              className="flex-1 rounded-lg border px-3 py-2.5 text-center text-[0.68rem] font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "var(--surface-3)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Both versions
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSaveStep("name")}
            className="mt-2 text-[0.62rem] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ← Change name
          </button>
        </div>
      )}

      {/* List of saved teams */}
      {savedTeams.length === 0 ? (
        <p className="text-[0.7rem] py-2" style={{ color: "var(--text-muted)" }}>
          No saved teams yet. Build a team and save it above.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {savedTeams.map((team) => (
            <div
              key={team.id}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2"
              style={{
                background: team.id === activeTeamId ? "var(--accent-soft)" : "var(--surface-2)",
                border: `1px solid ${team.id === activeTeamId ? "rgba(218, 44, 67, 0.3)" : "var(--border)"}`,
              }}
            >
              {editingId === team.id ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
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
                <>
                  <button
                    type="button"
                    onClick={() => onLoad(team.id)}
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
                    onClick={() => startRename(team)}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded"
                    style={{ color: "var(--text-muted)" }}
                    aria-label={`Rename ${team.name}`}
                  >
                    <FiEdit2 size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(team.id)}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded"
                    style={{ color: "#ef4444" }}
                    aria-label={`Delete ${team.name}`}
                  >
                    <FiTrash2 size={11} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SavedTeamsPanel;
