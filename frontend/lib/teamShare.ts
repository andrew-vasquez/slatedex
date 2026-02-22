import type { DexMode } from "@/lib/types";
import type { AiBossStage } from "@/lib/api";

export interface SharedTeamPayload {
  v: 1;
  generation: number;
  gameId: number;
  team: Array<number | null>;
  lockedSlots?: number[];
  selectedVersionId?: string;
  dexMode?: DexMode;
  checkpointBossName?: string | null;
  checkpointStage?: AiBossStage | null;
  checkpointGymOrder?: number | null;
}

function encodeBase64Url(input: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }

  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(token: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(token, "base64url").toString("utf8");
  }

  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function normalizePayload(input: unknown): SharedTeamPayload | null {
  if (!input || typeof input !== "object") return null;

  const candidate = input as Partial<SharedTeamPayload>;
  const team = Array.isArray(candidate.team) ? candidate.team.slice(0, 6) : [];
  const normalizedTeam: Array<number | null> = Array.from({ length: 6 }, (_, index) => {
    const value = team[index] ?? null;
    return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
  });

  const lockedSlots = Array.isArray(candidate.lockedSlots)
    ? [...new Set(candidate.lockedSlots.filter((slot) => Number.isInteger(slot) && slot >= 0 && slot < 6))]
    : [];

  const dexMode = candidate.dexMode === "regional" || candidate.dexMode === "national" ? candidate.dexMode : undefined;
  const checkpointStage =
    candidate.checkpointStage === "gym" ||
    candidate.checkpointStage === "elite4" ||
    candidate.checkpointStage === "champion"
      ? candidate.checkpointStage
      : undefined;
  const checkpointBossName =
    typeof candidate.checkpointBossName === "string" && candidate.checkpointBossName.trim().length > 0
      ? candidate.checkpointBossName.trim()
      : undefined;
  const checkpointGymOrder =
    typeof candidate.checkpointGymOrder === "number" && Number.isInteger(candidate.checkpointGymOrder)
      ? candidate.checkpointGymOrder
      : undefined;

  if (!Number.isInteger(candidate.generation) || !Number.isInteger(candidate.gameId)) {
    return null;
  }

  return {
    v: 1,
    generation: Number(candidate.generation),
    gameId: Number(candidate.gameId),
    team: normalizedTeam,
    lockedSlots,
    selectedVersionId: typeof candidate.selectedVersionId === "string" ? candidate.selectedVersionId : undefined,
    dexMode,
    checkpointBossName,
    checkpointStage,
    checkpointGymOrder,
  };
}

export function encodeSharedTeamPayload(payload: SharedTeamPayload): string {
  return encodeBase64Url(JSON.stringify(payload));
}

export function decodeSharedTeamPayload(token: string): SharedTeamPayload | null {
  try {
    const decoded = decodeBase64Url(token.trim());
    const parsed = JSON.parse(decoded);
    return normalizePayload(parsed);
  } catch {
    return null;
  }
}

export function parseSharedTeamInput(raw: string): SharedTeamPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      return normalizePayload(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get("team");
    return token ? decodeSharedTeamPayload(token) : null;
  } catch {
    return decodeSharedTeamPayload(trimmed);
  }
}
