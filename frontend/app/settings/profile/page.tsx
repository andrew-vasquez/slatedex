"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchMyProfile, updateMyProfile, type MyProfile } from "@/lib/api";
import {
  formatPokemonList,
  GAME_NAME_BY_ID,
  GAME_OPTIONS,
  MAX_BIO_LENGTH,
  MAX_FAVORITE_GAMES,
  MAX_FAVORITE_POKEMON,
  USERNAME_REGEX,
} from "@/lib/profile";
import { useAuth } from "@/components/providers/AuthProvider";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ProfileSettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteGameIds, setFavoriteGameIds] = useState<number[]>([]);
  const [favoritePokemonInput, setFavoritePokemonInput] = useState("");

  const favoritePokemonNames = useMemo(
    () => formatPokemonList(favoritePokemonInput),
    [favoritePokemonInput]
  );

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    let cancelled = false;
    setLoadingProfile(true);
    setLoadError(null);

    fetchMyProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setUsername(data.username);
        setBio(data.bio);
        setFavoriteGameIds(data.favoriteGameIds);
        setFavoritePokemonInput(data.favoritePokemonNames.join(", "));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading]);

  function toggleFavoriteGame(gameId: number) {
    setFavoriteGameIds((current) => {
      if (current.includes(gameId)) return current.filter((id) => id !== gameId);
      if (current.length >= MAX_FAVORITE_GAMES) return current;
      return [...current, gameId];
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      setSaveError(
        "Username must be 3-30 chars using lowercase letters, numbers, and underscores."
      );
      return;
    }

    if (bio.trim().length > MAX_BIO_LENGTH) {
      setSaveError(`Bio must be ${MAX_BIO_LENGTH} characters or fewer.`);
      return;
    }

    if (favoriteGameIds.length > MAX_FAVORITE_GAMES) {
      setSaveError(`Choose up to ${MAX_FAVORITE_GAMES} favorite games.`);
      return;
    }

    if (favoritePokemonNames.length > MAX_FAVORITE_POKEMON) {
      setSaveError(`Choose up to ${MAX_FAVORITE_POKEMON} favorite Pokemon.`);
      return;
    }

    setSaveStatus("saving");
    try {
      await updateMyProfile({
        username: normalizedUsername,
        bio: bio.trim(),
        favoriteGameIds,
        favoritePokemonNames,
      });

      const refreshed = await fetchMyProfile();
      setProfile(refreshed);
      setUsername(refreshed.username);
      setBio(refreshed.bio);
      setFavoriteGameIds(refreshed.favoriteGameIds);
      setFavoritePokemonInput(refreshed.favoritePokemonNames.join(", "));
      setSaveStatus("saved");
    } catch (error: unknown) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Failed to save profile");
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="panel p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading account...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="panel p-6">
          <h1 className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>
            Profile Settings
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in to edit your public profile.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            Profile Settings
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Customize your public profile and favorites.
          </p>
        </div>
        {profile?.username && (
          <Link
            href={`/u/${profile.username}`}
            className="rounded-xl border px-3.5 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            View Public Profile
          </Link>
        )}
      </header>

      <section className="panel p-5 sm:p-6">
        {loadingProfile && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading profile...
          </p>
        )}

        {loadError && (
          <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#ef4444", color: "#fca5a5" }}>
            {loadError}
          </p>
        )}

        {!loadingProfile && !loadError && (
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Username
              </label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                }}
                placeholder="username"
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                URL: /u/{username.trim().toLowerCase() || "username"}.
              </p>
              {profile && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Username changes left: {profile.usernameChangeWindow.remaining} /{" "}
                  {profile.usernameChangeWindow.max} in {profile.usernameChangeWindow.days} days.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                }}
                placeholder="Tell other trainers about your style..."
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {bio.trim().length}/{MAX_BIO_LENGTH}
              </p>
            </div>

            <div>
              <p className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Favorite Games ({favoriteGameIds.length}/{MAX_FAVORITE_GAMES})
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GAME_OPTIONS.map((game) => {
                  const selected = favoriteGameIds.includes(game.id);
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => toggleFavoriteGame(game.id)}
                      className="rounded-xl border px-3 py-2 text-left text-sm transition-colors"
                      style={{
                        borderColor: selected ? "rgba(218, 44, 67, 0.45)" : "var(--border)",
                        background: selected ? "var(--accent-soft)" : "var(--surface-2)",
                        color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      {game.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Favorite Pokemon ({favoritePokemonNames.length}/{MAX_FAVORITE_POKEMON})
              </label>
              <input
                value={favoritePokemonInput}
                onChange={(event) => setFavoritePokemonInput(event.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                }}
                placeholder="charizard, pikachu, dragapult"
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Enter up to {MAX_FAVORITE_POKEMON} names, separated by commas.
              </p>
            </div>

            {profile && (
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                  Saved Teams Snapshot
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {profile.teamStats.totalTeams} total teams.
                </p>
                {profile.teamStats.summaries.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {profile.teamStats.summaries.slice(0, 6).map((entry) => (
                      <li key={`${entry.generation}-${entry.gameId}`}>
                        {GAME_NAME_BY_ID.get(entry.gameId) ?? `Game ${entry.gameId}`} • {entry.teamCount} team
                        {entry.teamCount > 1 ? "s" : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    No saved teams yet.
                  </p>
                )}
              </div>
            )}

            {saveError && (
              <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#ef4444", color: "#fca5a5" }}>
                {saveError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{
                  borderColor: "rgba(218, 44, 67, 0.4)",
                  background: "var(--accent-soft)",
                  color: "var(--text-primary)",
                }}
              >
                {saveStatus === "saving" ? "Saving..." : "Save Profile"}
              </button>
              {saveStatus === "saved" && (
                <span className="text-sm" style={{ color: "#86efac" }}>
                  Saved
                </span>
              )}
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
