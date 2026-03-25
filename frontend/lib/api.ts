import type {
  BattleCheckpoint,
  BattlePlannerResult,
  BattleRealismMode,
  BossPreset,
  DexMode,
  Pokemon,
} from "./types";
import { authClient } from "./auth-client";
import { getClientSafeApiBaseUrl } from "./backend-url";
const SESSION_CONFIRMATION_ATTEMPTS = 5;
const SESSION_CONFIRMATION_DELAYS_MS = [150, 300, 500, 800];

export type UserRoleValue = "USER" | "ADMIN" | "OWNER";
export type UserPlanValue = "FREE" | "PRO";
export type UserBadgeValue = "Owner" | "Admin" | "Pro" | null;

export interface AiUsageActionSummary {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

export interface AiUsageSnapshot {
  periodStart: string;
  resetsAt: string;
  plan: UserPlanValue;
  chat: AiUsageActionSummary;
  analyze: AiUsageActionSummary;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface SavedTeam {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  checkpointBossName: string | null;
  checkpointStage: AiBossStage | null;
  checkpointGymOrder: number | null;
  pokemon: (Pokemon | null)[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileTeamSummary {
  generation: number;
  gameId: number;
  teamCount: number;
  lastUpdatedAt: string;
  latestTeamName: string;
}

export interface ProfilePokemonPreview {
  id: number | null;
  name: string;
  sprite: string | null;
}

export interface ProfileSavedTeam {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  updatedAt: string;
  pokemonPreview: ProfilePokemonPreview[];
}

export interface PublicProfile {
  username: string;
  name: string;
  image: string | null;
  badge?: UserBadgeValue;
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
    summaries: ProfileTeamSummary[];
  };
}

export interface MyProfile extends PublicProfile {
  role: UserRoleValue;
  plan: UserPlanValue;
  badge: UserBadgeValue;
  aiUsageSummary?: AiUsageSnapshot | null;
  usernameChangeWindow: {
    max: number;
    used: number;
    remaining: number;
    days: number;
  };
}

export type AiMessageRole = "user" | "assistant" | "system_event";
export type AiMessageKind = "chat" | "analysis";
export type AiBossStage = "gym" | "elite4" | "champion";
export interface TeamStoryCheckpoint {
  checkpointBossName: string | null;
  checkpointStage: AiBossStage | null;
  checkpointGymOrder: number | null;
}

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  kind: AiMessageKind;
  content: string;
  createdAt: string;
}

export interface AiBossGuidanceEntry {
  name: string;
  stage: AiBossStage;
  primaryTypes: string[];
  notes?: string;
  gymOrder?: number;
  recommendedPlayerLevelRange?: string;
  expectedEvolutionBand?: string;
}

export interface AiTeamContextPayload {
  teamId?: string;
  generation: number;
  gameId: number;
  selectedVersionId?: string | null;
  team: (Pokemon | null)[];
  dexMode?: DexMode;
  versionFilterEnabled?: boolean;
  typeFilter?: string[];
  allowedPokemonNames?: string[];
  regionalDexName?: string | null;
  checkpointBossName?: string | null;
  checkpointStage?: AiBossStage | null;
  checkpointGymOrder?: number | null;
  checkpointCatchableNames?: string[];
  checkpointCatchablePoolSize?: number | null;
  checkpointBlockedFinalNames?: string[];
  checkpointEvolutionFallbacks?: Array<{ fromName: string; toName: string }>;
}

export interface AdminOverview {
  range: "30d" | "90d" | "12m";
  period: {
    from: string;
    to: string;
  };
  kpis: {
    totalUsers: number;
    newUsersInRange: number;
    totalTeams: number;
    totalChats: number;
    totalAnalyzes: number;
    activeUsersLast30d: number;
    usersAtQuotaCurrentMonth: number;
  };
  charts: {
    newUsersByDay: Array<{ day: string; value: number }>;
    newTeamsByDay: Array<{ day: string; value: number }>;
    aiUsageByDay: Array<{ day: string; chat: number; analyze: number }>;
    usersByPlan: Array<{ key: UserPlanValue; value: number }>;
    usersByRole: Array<{ key: UserRoleValue; value: number }>;
  };
  topUsersThisMonth: Array<{
    userId: string;
    name: string;
    email: string;
    username: string | null;
    chatCount: number;
    analyzeCount: number;
    total: number;
  }>;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: UserRoleValue;
  plan: UserPlanValue;
  badge: UserBadgeValue;
  teamCount: number;
  entitlements: {
    monthlyChatLimit: number;
    monthlyAnalyzeLimit: number;
    unlimitedAiChat: boolean;
    unlimitedAiAnalyze: boolean;
  };
  usage: {
    periodStart: string;
    chat: AiUsageActionSummary;
    analyze: AiUsageActionSummary;
  };
  createdAt: string;
  updatedAt: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const apiBaseUrl = getClientSafeApiBaseUrl();
  const requestUrl = `${apiBaseUrl}${path}`;
  const res = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 404 && path.startsWith("/api/ai/")) {
      throw new ApiError(
        `AI endpoint returned 404 at ${requestUrl}. Check NEXT_PUBLIC_API_URL points to backend base URL (no /api suffix/path) and backend is deployed with /api/ai routes.`,
        res.status,
        body
      );
    }
    const fallbackMessage = `Request failed: ${res.status}`;
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : fallbackMessage;
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

export function fetchTeams(generation?: number, gameId?: number): Promise<SavedTeam[]> {
  const params = new URLSearchParams();
  if (generation != null) params.set("generation", String(generation));
  if (gameId != null) params.set("gameId", String(gameId));
  const qs = params.toString();
  return apiFetch(`/api/teams${qs ? `?${qs}` : ""}`);
}

export function fetchTeamCountsByGame(generation?: number): Promise<Array<{ gameId: number; count: number }>> {
  const params = new URLSearchParams({ summary: "countsByGame" });
  if (generation != null) params.set("generation", String(generation));
  return apiFetch<{ counts: Array<{ gameId: number; count: number }> }>(
    `/api/teams?${params.toString()}`
  ).then((result) => result.counts ?? []);
}

export function createTeam(data: {
  name: string;
  generation: number;
  gameId: number;
  pokemon: (Pokemon | null)[];
  selectedVersionId?: string | null;
  checkpointBossName?: string | null;
  checkpointStage?: AiBossStage | null;
  checkpointGymOrder?: number | null;
}): Promise<SavedTeam> {
  return apiFetch("/api/teams", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTeam(
  id: string,
  data: {
    name?: string;
    pokemon?: (Pokemon | null)[];
    selectedVersionId?: string | null;
    checkpointBossName?: string | null;
    checkpointStage?: AiBossStage | null;
    checkpointGymOrder?: number | null;
  }
): Promise<SavedTeam> {
  return apiFetch(`/api/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTeam(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/teams/${id}`, {
    method: "DELETE",
  });
}

export async function checkUsernameAvailable(
  username: string,
  signal?: AbortSignal
): Promise<{ available: boolean; reason?: string }> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return { available: false, reason: "invalid" };

  const result = await authClient
    .isUsernameAvailable({ username: normalized }, { signal })
    .catch(() => null);

  if (!result) return { available: false };
  if (result.error) {
    return {
      available: false,
      reason: result.error.message ?? "invalid",
    };
  }

  return { available: Boolean(result.data?.available) };
}

export async function loginWithIdentifier(
  identifier: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier || !password) {
    return { ok: false, error: "Email/username and password are required." };
  }

  const result = normalizedIdentifier.includes("@")
    ? await authClient.signIn.email({ email: normalizedIdentifier, password })
    : await authClient.signIn.username({
        username: normalizedIdentifier.toLowerCase(),
        password,
      });

  if (result.error) {
    return { ok: false, error: result.error.message ?? "Invalid credentials" };
  }

  const session = await waitForAuthenticatedSession();
  if (!session?.data?.user) {
    return {
      ok: false,
      error:
        "Sign in reached the auth server, but the session cookie was not available afterwards. On iPhone/iPad this usually means the auth cookie is being delayed or blocked. Please try again, and if it keeps happening, use the frontend and API on the same site domain.",
    };
  }

  return { ok: true };
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  username?: string
): Promise<{ ok: boolean; error?: string }> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim();
  const normalizedUsername = username?.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    return { ok: false, error: "Name, email, and password are required." };
  }

  const result = await authClient.signUp.email({
    name: normalizedName,
    email: normalizedEmail,
    password,
    ...(normalizedUsername ? { username: normalizedUsername } : {}),
  });

  if (result.error) {
    return { ok: false, error: result.error.message ?? "Sign up failed" };
  }

  const session = await waitForAuthenticatedSession();
  if (!session?.data?.user) {
    return {
      ok: false,
      error:
        "Account creation reached the auth server, but the session cookie was not available afterwards. On iPhone/iPad this usually means the auth cookie is being delayed or blocked. Please try again, and if it keeps happening, use the frontend and API on the same site domain.",
    };
  }

  return { ok: true };
}

async function waitForAuthenticatedSession() {
  for (let attempt = 0; attempt < SESSION_CONFIRMATION_ATTEMPTS; attempt += 1) {
    const session = await authClient.getSession().catch(() => null);
    if (session?.data?.user) {
      return session;
    }

    if (attempt < SESSION_CONFIRMATION_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, SESSION_CONFIRMATION_DELAYS_MS[attempt]));
    }
  }

  return null;
}

export function fetchPublicProfile(username: string): Promise<PublicProfile> {
  return apiFetch(`/api/profiles/${encodeURIComponent(username)}`);
}

export function fetchMyProfile(): Promise<MyProfile> {
  return apiFetch("/api/profiles/me");
}

export function updateMyProfile(data: {
  username?: string;
  bio?: string;
  avatarUrl?: string | null;
  avatarFrame?: string;
  favoriteTeamId?: string | null;
  favoriteGameIds?: number[];
  favoritePokemonNames?: string[];
}): Promise<{ success: boolean }> {
  return apiFetch("/api/profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function fetchAiMessages(teamId: string): Promise<{ teamId: string; messages: AiMessage[] }> {
  const qs = new URLSearchParams({ teamId }).toString();
  return apiFetch(`/api/ai/messages?${qs}`);
}

export function fetchAiBossGuidance(versionId: string): Promise<{
  versionId: string | null;
  bossGuidance: AiBossGuidanceEntry[];
}> {
  const qs = new URLSearchParams({ versionId }).toString();
  return apiFetch(`/api/ai/boss-guidance?${qs}`, { cache: "no-store" });
}

export function fetchAiUsage(): Promise<AiUsageSnapshot> {
  return apiFetch("/api/ai/usage");
}

export function sendAiChat(
  payload: AiTeamContextPayload & { message: string },
  options?: { signal?: AbortSignal }
): Promise<{
  teamId: string;
  reply: string;
  usage?: AiUsageSnapshot;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
}> {
  return apiFetch("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: options?.signal,
  });
}

export function analyzeAiTeam(
  payload: AiTeamContextPayload,
  options?: { signal?: AbortSignal }
): Promise<{
  teamId: string;
  analysisText: string;
  usage?: AiUsageSnapshot;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
}> {
  return apiFetch("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: options?.signal,
  });
}

// ── Battle Planner API ───────────────────────────────────────────────────────

export interface SavedOpponentTeam {
  id: string;
  name: string;
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  source: "MANUAL" | "PRESET";
  presetBossKey: string | null;
  pokemon: (Pokemon | null)[];
  notes: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchBattlePresets(
  gameId: number,
  selectedVersionId?: string | null
): Promise<{ supported: boolean; presets: BossPreset[] }> {
  const params = new URLSearchParams({ gameId: String(gameId) });
  if (selectedVersionId) params.set("selectedVersionId", selectedVersionId);
  return apiFetch(`/api/battle/presets?${params.toString()}`);
}

export function analyzeBattleMatchups(payload: {
  myTeam: (Pokemon | null)[];
  opponentTeam: (Pokemon | null)[];
  checkpoint?: BattleCheckpoint | null;
  realismMode?: BattleRealismMode;
  gameId?: number;
  selectedVersionId?: string | null;
  presetBossKey?: string | null;
}): Promise<BattlePlannerResult> {
  return apiFetch("/api/battle/matchups/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchOpponentTeams(
  gameId?: number,
  generation?: number
): Promise<SavedOpponentTeam[]> {
  const params = new URLSearchParams();
  if (gameId != null) params.set("gameId", String(gameId));
  if (generation != null) params.set("generation", String(generation));
  const qs = params.toString();
  return apiFetch(`/api/battle/opponent-teams${qs ? `?${qs}` : ""}`);
}

export function createOpponentTeam(data: {
  name: string;
  generation: number;
  gameId: number;
  pokemon: (Pokemon | null)[];
  selectedVersionId?: string | null;
  source?: "MANUAL" | "PRESET";
  presetBossKey?: string | null;
  notes?: string | null;
  checkpoint?: BattleCheckpoint | null;
  realismMode?: BattleRealismMode;
}): Promise<SavedOpponentTeam> {
  return apiFetch("/api/battle/opponent-teams", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateOpponentTeam(
  id: string,
  data: {
    name?: string;
    pokemon?: (Pokemon | null)[];
    notes?: string | null;
    selectedVersionId?: string | null;
    checkpoint?: BattleCheckpoint | null;
    realismMode?: BattleRealismMode;
  }
): Promise<SavedOpponentTeam> {
  return apiFetch(`/api/battle/opponent-teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteOpponentTeam(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/battle/opponent-teams/${id}`, {
    method: "DELETE",
  });
}

export function fetchAdminOverview(range: "30d" | "90d" | "12m" = "30d"): Promise<AdminOverview> {
  const qs = new URLSearchParams({ range }).toString();
  return apiFetch(`/api/admin/overview?${qs}`);
}

export function fetchAdminUsers(params?: {
  query?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ items: AdminUserRow[]; nextCursor: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (typeof params?.limit === "number") searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return apiFetch(`/api/admin/users${qs ? `?${qs}` : ""}`);
}

export function updateAdminUserEntitlements(
  userId: string,
  payload: {
    plan?: UserPlanValue;
    monthlyChatLimit?: number;
    monthlyAnalyzeLimit?: number;
    unlimitedAiChat?: boolean;
    unlimitedAiAnalyze?: boolean;
  }
): Promise<{
  success: true;
  user: {
    id: string;
    role: UserRoleValue;
    plan: UserPlanValue;
    monthlyChatLimit: number;
    monthlyAnalyzeLimit: number;
    unlimitedAiChat: boolean;
    unlimitedAiAnalyze: boolean;
  };
}> {
  return apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/entitlements`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateAdminUserRole(
  userId: string,
  role: UserRoleValue
): Promise<{
  success: true;
  user: {
    id: string;
    role: UserRoleValue;
  };
}> {
  return apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}
