import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { AVATAR_FRAME_OPTIONS, getAvatarFrameStyles, getGameDecoration, type AvatarFrameKey } from "@/lib/profile";
import FavoritePokemonDisplay from "@/app/u/[username]/FavoritePokemonDisplay";
import { getVersionLabel } from "@/lib/pokemon";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { safeImageSrc } from "@/lib/image";

type ProfilePokemonPreview = {
  id: number | null;
  name: string;
  sprite: string | null;
};

type ProfileSavedTeam = {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  updatedAt: string;
  pokemonPreview: ProfilePokemonPreview[];
};

type PublicProfilePayload = {
  username: string;
  name: string;
  image: string | null;
  badge?: "Owner" | "Admin" | "Pro" | null;
  memberSince: string;
  bio: string;
  avatarUrl: string | null;
  avatarFrame: string;
  favoriteTeamId: string | null;
  favoriteGameIds: number[];
  favoritePokemonNames: string[];
  savedTeams: ProfileSavedTeam[];
  favoriteTeam: ProfileSavedTeam | null;
  teamStats: {
    totalTeams: number;
    summaries: Array<{
      generation: number;
      gameId: number;
      teamCount: number;
      lastUpdatedAt: string;
      latestTeamName: string;
    }>;
  };
};

function getApiBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!rawUrl) return "http://localhost:3001";
  const withProtocol =
    !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")
      ? `https://${rawUrl}`
      : rawUrl;
  return withProtocol.replace(/\/+$/, "");
}

async function loadProfile(username: string): Promise<PublicProfilePayload> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/profiles/${encodeURIComponent(username.toLowerCase())}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) notFound();
  return response.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  try {
    const profile = await loadProfile(username);
    return {
      title: `${profile.name} (@${profile.username})`,
      description:
        profile.bio ||
        `${profile.name}'s Pokemon team builder profile with favorite teams and saved roster.`,
    };
  } catch {
    return {
      title: "Trainer Profile",
    };
  }
}

function PokemonSpriteStrip({ team }: { team: ProfileSavedTeam }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {team.pokemonPreview.length > 0 ? (
        team.pokemonPreview.map((pokemon) => (
          <div
            key={`${team.id}-${pokemon.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ borderColor: "var(--border)", background: "rgba(9, 15, 35, 0.58)" }}
            title={pokemon.name}
          >
            {safeImageSrc(pokemon.sprite) ? (
              <Image
                src={safeImageSrc(pokemon.sprite)!}
                alt={pokemon.name}
                width={28}
                height={28}
                sizes="28px"
                unoptimized
                className="h-7 w-7 object-contain"
              />
            ) : (
              <span className="text-[0.72rem] uppercase" style={{ color: "var(--text-muted)" }}>
                {pokemon.name.slice(0, 2)}
              </span>
            )}
          </div>
        ))
      ) : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          No Pokemon in this saved team
        </span>
      )}
    </div>
  );
}

function toAvatarFrame(value: string | null | undefined): AvatarFrameKey {
  const match = AVATAR_FRAME_OPTIONS.find((option) => option.key === value);
  return match?.key ?? "classic";
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await loadProfile(username);

  const joinedDate = new Date(profile.memberSince).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  const avatarInput = safeImageSrc(profile.avatarUrl) ?? safeImageSrc(profile.image) ?? "";
  const avatar = normalizeAvatarUrl(avatarInput);
  const avatarFrame = toAvatarFrame(profile.avatarFrame);
  const avatarFrameStyles = getAvatarFrameStyles(avatarFrame);
  const profileHighlights = [
    `${profile.teamStats.totalTeams} saved team${profile.teamStats.totalTeams === 1 ? "" : "s"}`,
    `${profile.favoriteGameIds.length} favorite game${profile.favoriteGameIds.length === 1 ? "" : "s"}`,
    `${profile.favoritePokemonNames.length} favorite Pokemon`,
  ];
  const badgeStyles =
    profile.badge === "Owner"
      ? { borderColor: "rgba(218,44,67,0.5)", background: "rgba(218,44,67,0.18)", color: "#fda4af" }
      : profile.badge === "Admin"
        ? { borderColor: "rgba(59,130,246,0.5)", background: "rgba(59,130,246,0.18)", color: "#93c5fd" }
        : profile.badge === "Pro"
          ? { borderColor: "rgba(16,185,129,0.5)", background: "rgba(16,185,129,0.18)", color: "#6ee7b7" }
          : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      {/* Sticky nav */}
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/play"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              aria-label="Back to builder"
            >
              <FiArrowLeft size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="font-display text-[0.95rem] leading-none"
              style={{ letterSpacing: "-0.02em", color: "var(--text-primary)", textDecoration: "none" }}
              aria-label="Slatedex home"
            >
              Slate<span style={{ color: "var(--accent)" }}>dex</span>
            </Link>
            <span
              className="hidden rounded-md px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] sm:inline-block"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              Trainer Profile
            </span>
          </div>
          <Link
            href="/play"
            className="hidden rounded-xl border px-3.5 py-2 text-[0.82rem] font-semibold transition-colors hover:border-[var(--border-hover)] sm:inline-flex items-center gap-1.5"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}
          >
            Open Builder
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
      <section
        className="relative overflow-hidden rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: "var(--border)",
          background:
            "radial-gradient(circle at 10% 10%, rgba(218, 44, 67, 0.18), transparent 45%), radial-gradient(circle at 90% 20%, rgba(59, 130, 246, 0.18), transparent 40%), var(--surface-1)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl border-2"
              style={{
                borderColor: avatarFrameStyles.border,
                boxShadow: avatarFrameStyles.glow,
                background: "rgba(8, 14, 31, 0.75)",
              }}
            >
              {avatar ? (
                <Image src={avatar} alt={`${profile.name} avatar`} width={56} height={56} className="rounded-xl object-cover" />
              ) : (
                <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                  {profile.name.slice(0, 2)}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                Trainer Profile
              </p>
              <h1 className="font-display mt-1 text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                {profile.name}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                @{profile.username} • Joined {joinedDate}
              </p>
              {profile.badge && badgeStyles && (
                <span
                  className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em]"
                  style={badgeStyles}
                >
                  {profile.badge}
                </span>
              )}
              <p className="text-[0.72rem] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                {avatarFrame} frame
              </p>
            </div>
          </div>
          <Link
            href="/play"
            className="hidden rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors hover:border-[var(--border-hover)] sm:inline-flex"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--surface-2)" }}
          >
            Open Builder
          </Link>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed sm:text-[0.95rem]" style={{ color: "var(--text-secondary)" }}>
          {profile.bio || "No bio added yet."}
        </p>

        <div className="mt-4">
          <FavoritePokemonDisplay names={profile.favoritePokemonNames} />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profileHighlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              {highlight}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <article className="panel p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Favorite Games
            </h2>
            {profile.favoriteGameIds.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {profile.favoriteGameIds.map((gameId) => {
                  const decor = getGameDecoration(gameId);
                  return (
                    <div
                      key={gameId}
                      className="rounded-xl border px-3 py-2"
                      style={{
                        borderColor: decor.accent,
                        background: decor.soft,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: decor.accent }}>
                          {decor.emblem}
                        </span>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {decor.label}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {decor.region} region
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                No favorite games listed.
              </p>
            )}
          </article>

          <article className="panel p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Team Activity
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {profile.teamStats.totalTeams} total saved teams
            </p>
            {profile.teamStats.summaries.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {profile.teamStats.summaries.slice(0, 5).map((summary) => (
                  <li
                    key={`${summary.generation}-${summary.gameId}`}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    Gen {summary.generation} • Game {summary.gameId} • {summary.teamCount} team
                    {summary.teamCount > 1 ? "s" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                No team activity yet.
              </p>
            )}
          </article>
        </div>

        <div className="space-y-4">
          <article className="panel p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Featured Team
            </h2>
            {profile.favoriteTeam ? (
              <div
                className="mt-3 rounded-2xl border p-3"
                style={{
                  borderColor: "rgba(218, 44, 67, 0.45)",
                  background: "linear-gradient(135deg, rgba(218, 44, 67, 0.12), rgba(59, 130, 246, 0.08))",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {profile.favoriteTeam.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Gen {profile.favoriteTeam.generation} · {getVersionLabel(profile.favoriteTeam.gameId, profile.favoriteTeam.selectedVersionId)}
                </p>
                <PokemonSpriteStrip team={profile.favoriteTeam} />
              </div>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                No featured team selected.
              </p>
            )}
          </article>

          <article className="panel p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Saved Teams
            </h2>
            {profile.savedTeams.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {profile.savedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="team-card-hover rounded-xl border px-3 py-2"
                    style={{
                      borderColor:
                        profile.favoriteTeamId === team.id
                          ? "rgba(218, 44, 67, 0.45)"
                          : "var(--border)",
                      background:
                        profile.favoriteTeamId === team.id
                          ? "rgba(218, 44, 67, 0.12)"
                          : "var(--surface-2)",
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {team.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Gen {team.generation} · {getVersionLabel(team.gameId, team.selectedVersionId)}
                    </p>
                    <PokemonSpriteStrip team={team} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                No saved teams available.
              </p>
            )}
          </article>
        </div>
      </section>
    </main>
    </div>
  );
}
