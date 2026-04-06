"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiCheck, FiCopy, FiExternalLink, FiImage, FiSave, FiStar } from "react-icons/fi";
import AppImage from "~/components/ui/AppImage";
import AppLink from "~/components/ui/AppLink";
import { fetchMyProfile, updateMyProfile, type MyProfile, type ProfileSavedTeam } from "@/lib/api";
import {
  AVATAR_FRAME_OPTIONS,
  getAvatarFrameStyles,
  GAME_OPTIONS,
  getGameDecoration,
  MAX_BIO_LENGTH,
  MAX_FAVORITE_GAMES,
  MAX_FAVORITE_POKEMON,
  toPublicProfilePath,
  USERNAME_REGEX,
  type AvatarFrameKey,
} from "@/lib/profile";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { safeImageSrc } from "@/lib/image";
import { useAuth } from "@/components/providers/AuthProvider";
import AvatarPickerModal from "~/pages/settings/AvatarPickerModal";
import FavoritePokemonPicker from "~/pages/settings/FavoritePokemonPicker";
import Breadcrumb from "@/components/ui/Breadcrumb";
import DesktopToolsMenu from "@/components/ui/DesktopToolsMenu";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type CopyStatus = "idle" | "copied" | "error";

function toAvatarFrame(value: string | null | undefined): AvatarFrameKey {
  const match = AVATAR_FRAME_OPTIONS.find((option) => option.key === value);
  return match?.key ?? "classic";
}

function TeamPreviewCard({
  team,
  selected,
  onSelect,
}: {
  team: ProfileSavedTeam;
  selected: boolean;
  onSelect: (teamId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(team.id)}
      className="w-full rounded-2xl border px-3 py-3 text-left transition-all"
      style={{
        borderColor: selected ? "rgba(218, 44, 67, 0.42)" : "var(--border)",
        background: selected ? "var(--accent-soft)" : "var(--surface-2)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {team.name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Gen {team.generation} • Game {team.gameId}
          </p>
        </div>
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border"
          style={{
            borderColor: selected ? "rgba(218, 44, 67, 0.55)" : "var(--border)",
            color: selected ? "var(--accent)" : "var(--text-muted)",
            background: selected ? "rgba(218, 44, 67, 0.16)" : "transparent",
          }}
        >
          <FiStar size={13} />
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {team.pokemonPreview.length > 0 ? (
          team.pokemonPreview.map((pokemon) => {
            const spriteSrc = safeImageSrc(pokemon.sprite);

            return (
              <div
                key={`${team.id}-${pokemon.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border"
                style={{
                  borderColor: "var(--border)",
                  background: "rgba(8, 15, 34, 0.6)",
                }}
                title={pokemon.name}
              >
                {spriteSrc ? (
                  <AppImage
                    src={spriteSrc}
                    alt={pokemon.name}
                    width={28}
                    height={28}
                    sizes="28px"
                    unoptimized
                    className="h-7 w-7 object-contain"
                  />
                ) : (
                  <span className="text-[0.62rem] uppercase" style={{ color: "var(--text-muted)" }}>
                    {pokemon.name.slice(0, 2)}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Empty team slots
          </span>
        )}
      </div>
    </button>
  );
}

export default function ProfileSettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [origin, setOrigin] = useState("");
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrameKey>("classic");
  const [favoriteTeamId, setFavoriteTeamId] = useState<string | null>(null);
  const [favoriteGameIds, setFavoriteGameIds] = useState<number[]>([]);
  const [favoritePokemonNames, setFavoritePokemonNames] = useState<string[]>([]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicPath = toPublicProfilePath(username || profile?.username || "username");
  const publicUrl = origin ? `${origin}${publicPath}` : publicPath;

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
        setAvatarUrl(data.avatarUrl ?? "");
        setAvatarFrame(toAvatarFrame(data.avatarFrame));
        setFavoriteTeamId(data.favoriteTeamId);
        setFavoriteGameIds(data.favoriteGameIds);
        setFavoritePokemonNames(data.favoritePokemonNames);
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

  function resetIdentitySection() {
    setUsername(profile?.username ?? "");
    setBio(profile?.bio ?? "");
  }

  function resetAvatarSection() {
    setAvatarUrl(profile?.avatarUrl ?? "");
    setAvatarFrame(toAvatarFrame(profile?.avatarFrame));
  }

  function resetFavoritesSection() {
    setFavoriteTeamId(profile?.favoriteTeamId ?? null);
    setFavoriteGameIds(profile?.favoriteGameIds ?? []);
    setFavoritePokemonNames(profile?.favoritePokemonNames ?? []);
  }

  async function copyPublicUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
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
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
        avatarFrame,
        favoriteTeamId,
        favoriteGameIds,
        favoritePokemonNames,
      });

      const refreshed = await fetchMyProfile();
      setProfile(refreshed);
      setUsername(refreshed.username);
      setBio(refreshed.bio);
      setAvatarUrl(refreshed.avatarUrl ?? "");
      setAvatarFrame(toAvatarFrame(refreshed.avatarFrame));
      setFavoriteTeamId(refreshed.favoriteTeamId);
      setFavoriteGameIds(refreshed.favoriteGameIds);
      setFavoritePokemonNames(refreshed.favoritePokemonNames);
      window.dispatchEvent(
        new CustomEvent("profile-appearance-updated", {
          detail: {
            avatarUrl: refreshed.avatarUrl ?? refreshed.image ?? null,
            avatarFrame: refreshed.avatarFrame,
          },
        })
      );
      setSaveStatus("saved");
    } catch (error: unknown) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Failed to save profile");
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="panel p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading account...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="panel p-6">
          <h1 className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>
            Profile Settings
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in to edit your public profile.
          </p>
          <AppLink
            href="/"
            className="mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Back to Home
          </AppLink>
        </div>
      </main>
    );
  }

  const normalizedAvatarInput = safeImageSrc(avatarUrl) ?? safeImageSrc(profile?.image) ?? "";
  const previewAvatar = normalizeAvatarUrl(normalizedAvatarInput);
  const avatarFrameStyles = getAvatarFrameStyles(avatarFrame);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb
        items={[{ label: "Slatedex", href: "/play" }, { label: "Settings", href: "/settings" }, { label: "Profile" }]}
        className="mb-4"
      />

      <header className="mb-4 rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
              Trainer Profile Control Room
            </p>
            <h1 className="font-display mt-1 text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              Profile Settings
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Edit your profile and preview exactly what other users will see.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DesktopToolsMenu />
            <AppLink
              href={publicPath}
              target="_blank"
              className="landing-cta-secondary header-nav-button inline-flex items-center gap-1.5 border"
              style={{
                borderColor: "rgba(218, 44, 67, 0.4)",
                background: "var(--accent-soft)",
                color: "var(--text-primary)",
              }}
            >
              <FiExternalLink size={14} />
              Open Public Page
            </AppLink>
            <button
              type="button"
              onClick={copyPublicUrl}
              className="landing-cta-secondary header-nav-button inline-flex items-center gap-1.5 border"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {copyStatus === "copied" ? <FiCheck size={14} /> : <FiCopy size={14} />}
              {copyStatus === "copied" ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <form className="panel space-y-5 p-4 sm:p-5" onSubmit={onSubmit}>
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
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Avatar Preview
                    </p>
                    <button
                      type="button"
                      onClick={resetAvatarSection}
                      className="text-[0.68rem] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border-2"
                      style={{
                        borderColor: avatarFrameStyles.border,
                        boxShadow: avatarFrameStyles.glow,
                        background: "rgba(11, 20, 46, 0.7)",
                      }}
                    >
                      {previewAvatar ? (
                        <AppImage
                          src={previewAvatar}
                          alt="Profile avatar preview"
                          width={56}
                          height={56}
                          sizes="56px"
                          unoptimized
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                          {user?.name?.slice(0, 2) || "PK"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        Frame: {avatarFrame}. Pick a trainer portrait and frame style.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAvatarPickerOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                        style={{
                          borderColor: avatarFrameStyles.border,
                          background: avatarFrameStyles.chipBg,
                          color: "var(--text-primary)",
                        }}
                      >
                        <FiImage size={12} />
                        Open Avatar Picker
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                      Username
                    </label>
                    <button
                      type="button"
                      onClick={resetIdentitySection}
                      className="text-[0.68rem] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Reset
                    </button>
                  </div>
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
                    Public URL: {publicUrl}
                  </p>
                  {profile && (
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Username changes left: {profile.usernameChangeWindow.remaining} /{" "}
                      {profile.usernameChangeWindow.max} in {profile.usernameChangeWindow.days} days.
                    </p>
                  )}
                </div>
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
                  placeholder="Tell trainers your preferred playstyle..."
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {bio.trim().length}/{MAX_BIO_LENGTH}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                    Favorites
                  </p>
                  <button
                    type="button"
                    onClick={resetFavoritesSection}
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Reset
                  </button>
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  Favorite Games ({favoriteGameIds.length}/{MAX_FAVORITE_GAMES})
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {GAME_OPTIONS.map((game) => {
                    const selected = favoriteGameIds.includes(game.id);
                    const decor = getGameDecoration(game.id);
                    return (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => toggleFavoriteGame(game.id)}
                        className="rounded-xl border px-3 py-2 text-left text-sm transition-all"
                        style={{
                          borderColor: selected ? decor.accent : "var(--border)",
                          background: selected ? decor.soft : "var(--surface-2)",
                          color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                        }}
                      >
                        <span className="mr-1.5 text-xs" style={{ color: decor.accent }}>
                          {decor.emblem}
                        </span>
                        {game.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  Favorite Pokémon ({favoritePokemonNames.length}/{MAX_FAVORITE_POKEMON})
                </p>
                <FavoritePokemonPicker
                  value={favoritePokemonNames}
                  onChange={setFavoritePokemonNames}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                    Favorite Team
                  </p>
                  {favoriteTeamId && (
                    <button
                      type="button"
                      onClick={() => setFavoriteTeamId(null)}
                      className="text-xs underline underline-offset-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {profile?.savedTeams.length ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {profile.savedTeams.map((team) => (
                      <TeamPreviewCard
                        key={team.id}
                        team={team}
                        selected={favoriteTeamId === team.id}
                        onSelect={setFavoriteTeamId}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    Save a team in the builder first, then set it as your profile favorite.
                  </p>
                )}
              </div>

              {saveError && (
                <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#ef4444", color: "#fca5a5" }}>
                  {saveError}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  style={{
                    borderColor: "rgba(218, 44, 67, 0.4)",
                    background: "var(--accent-soft)",
                    color: "var(--text-primary)",
                  }}
                >
                  <FiSave size={14} />
                  {saveStatus === "saving" ? "Saving..." : "Save Profile"}
                </button>
                {saveStatus === "saved" && (
                  <span className="text-sm" style={{ color: "#86efac" }}>
                    Saved
                  </span>
                )}
              </div>
            </>
          )}
        </form>

        <aside className="panel p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            Public Snapshot
          </p>
          <div className="mt-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <div className="flex items-start gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl border-2"
                style={{
                  borderColor: avatarFrameStyles.border,
                  boxShadow: avatarFrameStyles.glow,
                  background: "rgba(11, 20, 46, 0.72)",
                }}
              >
                {previewAvatar ? (
                  <AppImage
                    src={previewAvatar}
                    alt="avatar"
                    width={48}
                    height={48}
                    sizes="48px"
                    unoptimized
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                    {user?.name?.slice(0, 2) || "PK"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {user?.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  @{username || "username"}
                </p>
                <p className="text-[0.62rem] uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                  {avatarFrame} frame
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {bio.trim() || "Your profile bio will appear here."}
            </p>

            {favoriteTeamId && profile?.savedTeams && (
              <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "rgba(8, 15, 34, 0.45)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                  Featured Team
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-primary)" }}>
                  {profile.savedTeams.find((team) => team.id === favoriteTeamId)?.name ?? "Selected"}
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        selectedAvatarUrl={avatarUrl}
        selectedFrame={avatarFrame}
        fallbackInitials={user?.name?.slice(0, 2).toUpperCase() || "PK"}
        onClose={() => setIsAvatarPickerOpen(false)}
        onApply={(nextAvatarUrl, nextFrame) => {
          setAvatarUrl(nextAvatarUrl ?? "");
          setAvatarFrame(nextFrame);
          setIsAvatarPickerOpen(false);
        }}
      />
    </main>
  );
}
