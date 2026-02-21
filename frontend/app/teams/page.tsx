"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiTrash2, FiLoader, FiExternalLink } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchTeams, deleteTeam } from "@/lib/api";
import type { SavedTeam } from "@/lib/api";
import { ALL_GAMES, GENERATION_META, getVersionLabel } from "@/lib/pokemon";
import { safeImageSrc } from "@/lib/image";
import {
  getSelectedGameStorageKey,
  getSelectedVersionStorageKey,
  LAST_VISITED_GENERATION_KEY,
} from "@/lib/storageKeys";
import UserMenu from "@/components/auth/UserMenu";
import Breadcrumb from "@/components/ui/Breadcrumb";

// Region color theming — mirrors the game selector palette
const REGION_COLORS: Record<string, { accent: string; soft: string; edge: string }> = {
  Kanto:  { accent: "#e53935", soft: "rgba(229,57,53,0.10)",   edge: "rgba(229,57,53,0.22)"  },
  Johto:  { accent: "#fb8c00", soft: "rgba(251,140,0,0.10)",   edge: "rgba(251,140,0,0.22)"  },
  Hoenn:  { accent: "#00897b", soft: "rgba(0,137,123,0.10)",   edge: "rgba(0,137,123,0.22)"  },
  Sinnoh: { accent: "#1e88e5", soft: "rgba(30,136,229,0.10)",  edge: "rgba(30,136,229,0.22)" },
  Unova:  { accent: "#795548", soft: "rgba(121,85,72,0.10)",   edge: "rgba(121,85,72,0.22)"  },
  Kalos:  { accent: "#7e57c2", soft: "rgba(126,87,194,0.10)",  edge: "rgba(126,87,194,0.22)" },
  Alola:  { accent: "#ef6c00", soft: "rgba(239,108,0,0.10)",   edge: "rgba(239,108,0,0.22)"  },
  Galar:  { accent: "#546e7a", soft: "rgba(84,110,122,0.10)",  edge: "rgba(84,110,122,0.22)" },
  Paldea: { accent: "#c62828", soft: "rgba(198,40,40,0.10)",   edge: "rgba(198,40,40,0.22)"  },
};

// Pokemon type badge colors
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal:   { bg: "rgba(168,168,120,0.22)", text: "#c8c880" },
  fire:     { bg: "rgba(240,128,48,0.22)",  text: "#f09050" },
  water:    { bg: "rgba(104,144,240,0.22)", text: "#88aaff" },
  electric: { bg: "rgba(248,208,48,0.22)",  text: "#f8d840" },
  grass:    { bg: "rgba(120,200,80,0.22)",  text: "#78d050" },
  ice:      { bg: "rgba(152,216,216,0.22)", text: "#98e0e0" },
  fighting: { bg: "rgba(192,48,40,0.22)",   text: "#e05048" },
  poison:   { bg: "rgba(160,64,160,0.22)",  text: "#cc66cc" },
  ground:   { bg: "rgba(224,192,104,0.22)", text: "#e8c860" },
  flying:   { bg: "rgba(168,144,240,0.22)", text: "#b8a8ff" },
  psychic:  { bg: "rgba(248,88,136,0.22)",  text: "#ff7799" },
  bug:      { bg: "rgba(168,184,32,0.22)",  text: "#b8cc28" },
  rock:     { bg: "rgba(184,160,56,0.22)",  text: "#c8b040" },
  ghost:    { bg: "rgba(112,88,152,0.22)",  text: "#9878cc" },
  dragon:   { bg: "rgba(112,56,248,0.22)",  text: "#9060ff" },
  dark:     { bg: "rgba(112,88,72,0.22)",   text: "#9c8870" },
  steel:    { bg: "rgba(184,184,208,0.22)", text: "#c8c8e0" },
  fairy:    { bg: "rgba(238,153,172,0.22)", text: "#ffaabb" },
};

function getGenerationLabel(generation: number): string {
  const meta = GENERATION_META.find((g) => g.generation === generation);
  return meta ? `Gen ${generation} · ${meta.region}` : `Gen ${generation}`;
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
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const game = ALL_GAMES.find((g) => g.id === team.gameId);
  const region = game?.region ?? "Kanto";
  const colors = REGION_COLORS[region] ?? REGION_COLORS.Kanto;
  const filledSlots = team.pokemon.filter(Boolean).length;

  // Collect unique types across all Pokemon on the team
  const uniqueTypes = Array.from(
    new Set(
      team.pokemon
        .filter(Boolean)
        .flatMap((p) => p?.types ?? [])
    )
  );

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

  const handleOpenBuilder = () => {
    try {
      localStorage.setItem(getSelectedGameStorageKey(team.generation), String(team.gameId));
      if (team.selectedVersionId) {
        localStorage.setItem(getSelectedVersionStorageKey(team.gameId), team.selectedVersionId);
      }
      localStorage.setItem(LAST_VISITED_GENERATION_KEY, String(team.generation));
    } catch {}
    router.push(`/game/${team.generation}`);
  };

  return (
    <article
      className="animate-fade-in-up relative overflow-hidden rounded-2xl"
      style={{
        border: `1px solid ${colors.edge}`,
        background: `linear-gradient(140deg, ${colors.soft} 0%, var(--surface-1) 60%)`,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 h-full w-0.5"
        style={{ background: colors.accent }}
        aria-hidden="true"
      />

      <div className="px-4 py-4 sm:px-5 sm:py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em]"
                style={{ background: colors.soft, border: `1px solid ${colors.edge}`, color: colors.accent }}
              >
                {region}
              </span>
              <span className="text-[0.62rem] font-medium" style={{ color: "var(--text-muted)" }}>
                {getVersionLabel(team.gameId, team.selectedVersionId)} · {getGenerationLabel(team.generation)}
              </span>
            </div>
            <h3
              className="font-display mt-1 truncate text-base"
              style={{ color: "var(--text-primary)" }}
            >
              {team.name}
            </h3>
            <p className="mt-0.5 text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
              {formatDate(team.updatedAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{
              background: confirming ? "rgba(218,44,67,0.16)" : "var(--surface-2)",
              borderColor: confirming ? "rgba(218,44,67,0.42)" : "var(--border)",
              color: confirming ? "#ff9aa8" : "var(--text-muted)",
            }}
            aria-label={confirming ? "Confirm delete" : `Delete ${team.name}`}
            title={confirming ? "Click again to confirm" : "Delete team"}
          >
            {deleting ? <FiLoader size={13} className="animate-spin" /> : <FiTrash2 size={13} />}
          </button>
        </div>

        {/* Sprite row */}
        <div className="mt-3.5 flex items-center gap-1.5">
          {team.pokemon.map((pokemon, i) => {
            const spriteSrc = safeImageSrc(pokemon?.sprite);
            return (
              <div
                key={i}
                className="group/sprite relative flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                style={{
                  background: pokemon ? "var(--surface-2)" : "rgba(148,163,184,0.06)",
                  border: pokemon ? `1px solid ${colors.edge}` : "1px dashed rgba(148,163,184,0.18)",
                }}
                title={pokemon?.name ?? undefined}
              >
                {spriteSrc ? (
                  <Image
                    src={spriteSrc}
                    alt={pokemon?.name ?? "Pokémon slot"}
                    width={36}
                    height={36}
                    className="h-8 w-8 object-contain"
                    style={{ imageRendering: "pixelated" }}
                    unoptimized
                  />
                ) : (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ color: "var(--text-muted)", opacity: 0.28 }}
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {/* Type chips */}
        {uniqueTypes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {uniqueTypes.map((type) => {
              const tc = TYPE_COLORS[type] ?? { bg: "var(--surface-2)", text: "var(--text-muted)" };
              return (
                <span
                  key={type}
                  className="rounded-md px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.08em]"
                  style={{ background: tc.bg, color: tc.text }}
                >
                  {type}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenBuilder}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.68rem] font-semibold transition-all duration-150 active:scale-95 cursor-pointer hover:opacity-90"
            style={{
              background: colors.soft,
              borderColor: colors.edge,
              color: "var(--text-primary)",
            }}
          >
            <FiExternalLink size={12} />
            Open Builder
          </button>

          <span className="ml-auto text-[0.62rem] font-medium" style={{ color: "var(--text-muted)" }}>
            {filledSlots}/6 Pokémon
          </span>

          {confirming && (
            <span className="text-[0.62rem]" style={{ color: "var(--accent)" }}>
              Click trash again to confirm
            </span>
          )}
        </div>
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
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/play"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl cursor-pointer"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              aria-label="Back to game selector"
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
          {/* Fixed: was linking to "/" (landing page) — should go to game selector */}
          <Link
            href="/play"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] cursor-pointer"
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
            <button type="button" onClick={loadTeams} className="btn-secondary mt-4">
              Try Again
            </button>
          </div>
        ) : teams.length === 0 ? (
          <div className="panel p-10 text-center animate-fade-in-up">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              className="mx-auto mb-4"
              style={{ color: "var(--text-muted)", opacity: 0.4 }}
            >
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
              href="/play"
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
