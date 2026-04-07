import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FiPlus, FiTrash2, FiLoader, FiExternalLink } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import AppImage from "~/components/ui/AppImage";
import AppLink from "~/components/ui/AppLink";
import { fetchTeams, deleteTeam } from "@/lib/api";
import type { SavedTeam } from "@/lib/api";
import { ALL_GAMES, GENERATION_META, getVersionLabel } from "@/lib/pokemon";
import { safeImageSrc } from "@/lib/image";
import {
  getSelectedGameStorageKey,
  getSelectedVersionStorageKey,
  LAST_VISITED_GENERATION_KEY,
} from "@/lib/storageKeys";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { PokemonTypeBadge } from "@/components/ui/PokemonTypeBadge";
import AppHeader from "@/components/ui/AppHeader";

// Region color theming — mirrors the game selector palette
const REGION_COLORS: Record<string, { accent: string; soft: string; edge: string }> = {
  Kanto:  { accent: "#dc2626", soft: "rgba(220,38,38,0.12)",   edge: "rgba(220,38,38,0.26)"  },
  Johto:  { accent: "#b45309", soft: "rgba(180,83,9,0.12)",    edge: "rgba(180,83,9,0.26)"   },
  Hoenn:  { accent: "#0f766e", soft: "rgba(15,118,110,0.12)",  edge: "rgba(15,118,110,0.26)" },
  Sinnoh: { accent: "#2563eb", soft: "rgba(37,99,235,0.12)",   edge: "rgba(37,99,235,0.26)"  },
  Unova:  { accent: "#6b4f3b", soft: "rgba(107,79,59,0.12)",   edge: "rgba(107,79,59,0.26)"  },
  Kalos:  { accent: "#7c3aed", soft: "rgba(124,58,237,0.12)",  edge: "rgba(124,58,237,0.26)" },
  Alola:  { accent: "#c2410c", soft: "rgba(194,65,12,0.12)",   edge: "rgba(194,65,12,0.26)"  },
  Galar:  { accent: "#0369a1", soft: "rgba(3,105,161,0.12)",   edge: "rgba(3,105,161,0.26)"  },
  Paldea: { accent: "#be185d", soft: "rgba(190,24,93,0.12)",   edge: "rgba(190,24,93,0.26)"  },
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
  const navigate = useNavigate();
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
    void navigate({
      to: "/game/$generation",
      params: { generation: `gen${team.generation}` },
    });
  };

  return (
    <article
      className="team-card-hover animate-fade-in-up relative overflow-hidden rounded-2xl"
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
                  <AppImage
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
              return (
                <PokemonTypeBadge
                  key={type}
                  pokemonType={type}
                  size="xs"
                  uppercase
                  className="font-bold"
                >
                  {type}
                </PokemonTypeBadge>
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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [fetchingTeams, setFetchingTeams] = useState(false);
  const [fetchError, setFetchError] = useState("");

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

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
        <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-xl" style={{ background: "var(--skeleton-b)" }} />
              <div className="h-4 w-16 animate-pulse rounded" style={{ background: "var(--skeleton-b)" }} />
            </div>
            <div className="h-8 w-8 animate-pulse rounded-full" style={{ background: "var(--skeleton-b)" }} />
          </div>
        </header>
        <main className="mx-auto max-w-screen-lg px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="mb-6">
            <div className="h-8 w-32 animate-pulse rounded-lg" style={{ background: "var(--skeleton-b)" }} />
            <div className="mt-2 h-4 w-48 animate-pulse rounded" style={{ background: "var(--skeleton-b)" }} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl" style={{ background: "var(--skeleton-b)" }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
      <AppHeader
        maxWidthClassName="max-w-screen-lg"
        backHref="/play"
        backLabel="Back to game selector"
        badge="My Teams"
        mobileItems={[
          { href: "/play", label: "Launch Builder", description: "Choose a game and build" },
          { href: "/weaknesses", label: "Weakness Tool", description: "Check Pokemon weaknesses fast" },
          { href: "/type-chart", label: "Type Chart", description: "See type strengths and weaknesses" },
          { href: "/teams", label: "My Teams", description: "You are here" },
          { href: "/settings", label: "Settings", description: "Manage your account" },
        ]}
      />

      <main className="app-page-main mx-auto max-w-screen-lg px-4 sm:px-6">
        <Breadcrumb
          items={[{ label: "Slatedex", href: "/play" }, { label: "My Teams" }]}
          className="app-page-breadcrumb"
        />

        <section className="app-page-intro app-intro-card app-page-intro-card border" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="app-header-kicker">Collection</p>
            <h1 className="app-header-title font-display">My Teams</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {user?.name ? `${user.name}'s` : "Your"} saved Pokémon teams, organized by generation and ready to reopen in the builder.
            </p>
          </div>
          <AppLink
            href="/play"
            className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] cursor-pointer sm:w-auto"
            style={{
              background: "var(--accent-soft)",
              borderColor: "rgba(218,44,67,0.28)",
              color: "var(--text-primary)",
            }}
          >
            <FiPlus size={14} />
            New Team
          </AppLink>
        </div>
        </section>

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
          <div className="flex flex-col items-center justify-center py-24 gap-3" role="status" aria-live="polite">
            <FiLoader size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading your teams…</p>
          </div>
        ) : fetchError ? (
          <div className="panel p-6 text-center" role="alert">
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
            <AppLink
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
            </AppLink>
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
