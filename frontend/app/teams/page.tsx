"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiArrowLeft, FiPlus, FiTrash2, FiExternalLink, FiLoader } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchTeams, deleteTeam } from "@/lib/api";
import type { SavedTeam } from "@/lib/api";
import { GENERATION_META } from "@/lib/pokemon";
import UserMenu from "@/components/auth/UserMenu";
import Breadcrumb from "@/components/ui/Breadcrumb";

function getGenerationLabel(generation: number): string {
  const meta = GENERATION_META.find((g) => g.generation === generation);
  return meta ? `Gen ${generation} · ${meta.region}` : `Gen ${generation}`;
}

function getGameName(generation: number, gameId: number): string {
  const meta = GENERATION_META.find((g) => g.generation === generation);
  const game = meta?.games.find((g) => g.id === gameId);
  return game?.name ?? "Unknown Game";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TeamCard({
  team,
  onDelete,
}: {
  team: SavedTeam;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      await deleteTeam(team.id);
      onDelete(team.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const filledSlots = team.pokemon.filter(Boolean).length;

  return (
    <article
      className="panel p-4 sm:p-5 flex flex-col gap-4 animate-fade-in-up"
      style={{ transition: "opacity 0.2s ease" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
            {getGenerationLabel(team.generation)}
          </p>
          <h3 className="font-display mt-0.5 truncate text-base" style={{ color: "var(--text-primary)" }}>
            {team.name}
          </h3>
          <p className="mt-0.5 text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
            {getGameName(team.generation, team.gameId)} · {filledSlots}/6 Pokémon · {formatDate(team.updatedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-50"
          style={{
            background: confirming ? "rgba(218,44,67,0.16)" : "var(--surface-2)",
            borderColor: confirming ? "rgba(218,44,67,0.42)" : "var(--border)",
            color: confirming ? "#ff9aa8" : "var(--text-muted)",
          }}
          aria-label={confirming ? "Confirm delete" : `Delete ${team.name}`}
          title={confirming ? "Click again to confirm deletion" : "Delete team"}
        >
          {deleting ? (
            <FiLoader size={14} className="animate-spin" />
          ) : (
            <FiTrash2 size={14} />
          )}
        </button>
      </div>

      {/* Pokemon sprite row */}
      <div className="flex items-center gap-1.5">
        {team.pokemon.map((pokemon, i) => (
          <div
            key={i}
            className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
            style={{
              background: pokemon ? "var(--surface-2)" : "rgba(148,163,184,0.06)",
              border: pokemon ? "1px solid var(--border)" : "1px dashed rgba(148,163,184,0.2)",
            }}
          >
            {pokemon?.sprite ? (
              <Image
                src={pokemon.sprite}
                alt={pokemon.name}
                width={36}
                height={36}
                className="object-contain"
                style={{ imageRendering: "pixelated" }}
                unoptimized
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--text-muted)", opacity: 0.3 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2">
        <Link
          href={`/game/${team.generation}`}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.68rem] font-semibold transition-all active:scale-95"
          style={{
            background: "var(--accent-soft)",
            borderColor: "rgba(218,44,67,0.28)",
            color: "var(--text-primary)",
          }}
        >
          <FiExternalLink size={12} />
          Open Builder
        </Link>
        {confirming && (
          <span className="text-[0.65rem]" style={{ color: "var(--accent)" }}>
            Click trash again to confirm
          </span>
        )}
      </div>
    </article>
  );
}

export default function TeamsPage() {
  const { isAuthenticated, isLoading, user, openAuthDialog } = useAuth();
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [fetchingTeams, setFetchingTeams] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthDialog();
    }
  }, [isAuthenticated, isLoading, openAuthDialog]);

  const loadTeams = useCallback(async () => {
    setFetchingTeams(true);
    setFetchError("");
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setFetchingTeams(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadTeams();
    }
  }, [isAuthenticated, loadTeams]);

  const handleDelete = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  if (isLoading || !isAuthenticated) return null;

  const teamsByGen = teams.reduce<Record<number, SavedTeam[]>>((acc, team) => {
    if (!acc[team.generation]) acc[team.generation] = [];
    acc[team.generation].push(team);
    return acc;
  }, {});

  const sortedGenerations = Object.keys(teamsByGen)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen pb-14 sm:pb-20" style={{ background: "var(--bg-gradient)" }}>
      {/* Header */}
      <header
        className="glass sticky top-0 z-40 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/play"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              aria-label="Back to builder"
            >
              <FiArrowLeft size={14} />
            </Link>
            <Link
              href="/"
              className="font-display text-[0.95rem] leading-none"
              style={{ letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" }}
            >
              Slate<span style={{ color: "var(--accent)" }}>dex</span>
            </Link>
            <span
              className="hidden rounded-md px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] sm:inline-block"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              My Teams
            </span>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-screen-lg px-4 pt-6 sm:px-6 sm:pt-8">
        <Breadcrumb
          items={[{ label: "Slatedex", href: "/play" }, { label: "My Teams" }]}
          className="mb-5"
        />

        {/* Page title */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              My Teams
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {user?.name ? `${user.name}'s` : "Your"} saved Pokémon teams
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em]"
            style={{
              background: "var(--accent-soft)",
              borderColor: "rgba(218,44,67,0.28)",
              color: "var(--text-primary)",
            }}
          >
            <FiPlus size={13} />
            New Team
          </Link>
        </div>

        {/* Stats bar */}
        {teams.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            <div
              className="rounded-xl border px-3.5 py-2.5"
              style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
            >
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                Total Teams
              </p>
              <p className="font-display mt-0.5 text-xl" style={{ color: "var(--accent)" }}>
                {teams.length}
              </p>
            </div>
            <div
              className="rounded-xl border px-3.5 py-2.5"
              style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
            >
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                Generations
              </p>
              <p className="font-display mt-0.5 text-xl" style={{ color: "var(--accent-blue)" }}>
                {sortedGenerations.length}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {fetchingTeams ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FiLoader size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading your teams…</p>
          </div>
        ) : fetchError ? (
          <div className="panel p-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{fetchError}</p>
            <button
              type="button"
              onClick={loadTeams}
              className="btn-secondary mt-4"
            >
              Try Again
            </button>
          </div>
        ) : teams.length === 0 ? (
          <div className="panel p-10 text-center animate-fade-in-up">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <h2 className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              No saved teams yet
            </h2>
            <p className="mt-2 text-sm max-w-xs mx-auto" style={{ color: "var(--text-muted)" }}>
              Head to the team builder, draft your six, and save your first team.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[0.75rem] font-semibold mt-5"
              style={{
                background: "var(--accent-soft)",
                borderColor: "rgba(218,44,67,0.28)",
                color: "var(--text-primary)",
              }}
            >
              <FiPlus size={14} />
              Start Building
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGenerations.map((gen) => (
              <section key={gen}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="font-display text-base" style={{ color: "var(--text-primary)" }}>
                    {getGenerationLabel(gen)}
                  </h2>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em]"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    {teamsByGen[gen].length} team{teamsByGen[gen].length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {teamsByGen[gen].map((team) => (
                    <TeamCard key={team.id} team={team} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
