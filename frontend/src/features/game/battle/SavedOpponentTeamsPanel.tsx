"use client";

import Image from "~/components/ui/AppImage";
import { useState } from "react";
import { FiPlay, FiTrash2, FiEdit2, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import type { SavedOpponentTeam } from "@/lib/api";
import { pokemonSpriteSrc } from "@/lib/image";
import { useToastContext } from "~/features/game/hooks/useToast";

interface SavedOpponentTeamsPanelProps {
  teams: SavedOpponentTeam[];
  onLoad: (team: SavedOpponentTeam) => void;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

const DELETE_ANIMATION_MS = 180;

export default function SavedOpponentTeamsPanel({
  teams,
  onLoad,
  onDelete,
  onRename,
  onRefresh,
  isLoading,
}: SavedOpponentTeamsPanelProps) {
  const toastCtx = useToastContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const handleDelete = async (id: string) => {
    setDeletingIds((prev) => [...prev, id]);
    await new Promise((res) => setTimeout(res, DELETE_ANIMATION_MS));
    try {
      await onDelete(id);
      toastCtx.success("Opponent team deleted");
    } catch {
      toastCtx.error("Failed to delete opponent team");
    } finally {
      setDeletingIds((prev) => prev.filter((d) => d !== id));
    }
  };

  const handleRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      await onRename(id, name);
      toastCtx.success("Opponent team renamed");
      setEditingId(null);
    } catch {
      toastCtx.error("Failed to rename opponent team");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No saved opponent teams for this game yet.
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Build a team and save it to access it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {teams.length} saved {teams.length === 1 ? "team" : "teams"}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="btn-secondary !px-2 !py-1 !text-xs"
          aria-label="Refresh saved opponent teams"
        >
          <FiRefreshCw size={11} />
        </button>
      </div>

      {teams.map((team) => {
        const pokemon = (team.pokemon ?? []) as (Record<string, unknown> | null)[];
        const isDeleting = deletingIds.includes(team.id);
        const isEditing = editingId === team.id;

        return (
          <div
            key={team.id}
            className="rounded-lg p-3 transition-all duration-150"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              opacity: isDeleting ? 0 : 1,
              transform: isDeleting ? "translateX(6px)" : "none",
            }}
          >
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="auth-input !py-1 !text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(team.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  maxLength={80}
                />
                <button
                  type="button"
                  onClick={() => handleRename(team.id)}
                  className="btn-secondary !px-2 !py-1"
                  aria-label="Save rename"
                >
                  <FiCheck size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="btn-secondary !px-2 !py-1"
                  aria-label="Cancel rename"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {team.name}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setEditingId(team.id); setEditName(team.name); }}
                      className="btn-secondary !px-1.5 !py-1"
                      aria-label={`Rename ${team.name}`}
                    >
                      <FiEdit2 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(team.id)}
                      className="btn-danger !px-1.5 !py-1"
                      aria-label={`Delete ${team.name}`}
                    >
                      <FiTrash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Sprites */}
                <div className="flex gap-1 items-center mb-2">
                  {pokemon.slice(0, 6).map((p, i) =>
                    p ? (
                      <Image
                        key={i}
                        src={pokemonSpriteSrc(p.sprite as string, p.id as number)}
                        alt={(p.name as string) ?? ""}
                        width={24}
                        height={24}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div
                        key={i}
                        className="w-6 h-6 rounded"
                        style={{ background: "var(--surface-3)" }}
                      />
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onLoad(team)}
                  className="btn-secondary !py-1.5 !text-xs w-full !justify-center min-h-[36px]"
                >
                  <FiPlay size={11} />
                  Load this team
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
