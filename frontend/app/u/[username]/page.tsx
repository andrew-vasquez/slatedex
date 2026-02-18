import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GAME_NAME_BY_ID } from "@/lib/profile";

type PublicProfilePayload = {
  username: string;
  name: string;
  image: string | null;
  memberSince: string;
  bio: string;
  favoriteGameIds: number[];
  favoritePokemonNames: string[];
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
        `${profile.name}'s Pokemon team builder profile with saved generation/game team summaries.`,
    };
  } catch {
    return {
      title: "Trainer Profile",
    };
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await loadProfile(username);
  const joinedDate = new Date(profile.memberSince).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
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
        </div>
        <Link
          href="/"
          className="rounded-xl border px-3.5 py-2 text-sm font-semibold"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          Back to Builder
        </Link>
      </header>

      <section className="panel p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <article>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Bio
              </h2>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {profile.bio || "No bio added yet."}
              </p>
            </article>

            <article>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Favorite Games
              </h2>
              {profile.favoriteGameIds.length > 0 ? (
                <ul className="mt-1 space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {profile.favoriteGameIds.map((gameId) => (
                    <li key={gameId}>{GAME_NAME_BY_ID.get(gameId) ?? `Game ${gameId}`}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  No favorite games listed.
                </p>
              )}
            </article>

            <article>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Favorite Pokemon
              </h2>
              {profile.favoritePokemonNames.length > 0 ? (
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {profile.favoritePokemonNames.map((name) => (
                    <li
                      key={name}
                      className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)" }}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  No favorite Pokemon listed.
                </p>
              )}
            </article>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Saved Teams
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {profile.teamStats.totalTeams} total teams
            </p>
            {profile.teamStats.summaries.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {profile.teamStats.summaries.map((summary) => (
                  <li
                    key={`${summary.generation}-${summary.gameId}`}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p style={{ color: "var(--text-primary)" }}>
                      {GAME_NAME_BY_ID.get(summary.gameId) ?? `Game ${summary.gameId}`}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {summary.teamCount} team{summary.teamCount > 1 ? "s" : ""} • Last update{" "}
                      {new Date(summary.lastUpdatedAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                No saved teams yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
