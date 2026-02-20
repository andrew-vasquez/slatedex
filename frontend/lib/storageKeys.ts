export const STORAGE_VERSION = 1;

export function getSelectedVersionStorageKey(gameId: number): string {
  return `selected_version_game_${gameId}_v${STORAGE_VERSION}`;
}

export function getVersionFilterStorageKey(gameId: number): string {
  return `version_filter_game_${gameId}_v${STORAGE_VERSION}`;
}

export function getSelectedGameStorageKey(generation: number): string {
  return `selected_game_gen_${generation}_v${STORAGE_VERSION}`;
}

export function getTeamStorageKey(generation: number, gameId: number): string {
  return `team_gen_${generation}_game_${gameId}_v${STORAGE_VERSION}`;
}

export function getTeamUpdatedAtStorageKey(generation: number, gameId: number): string {
  return `team_updated_gen_${generation}_game_${gameId}_v${STORAGE_VERSION}`;
}

export function getLockedSlotsStorageKey(generation: number, gameId: number): string {
  return `team_locked_gen_${generation}_game_${gameId}_v${STORAGE_VERSION}`;
}

export function getBuilderSettingsStorageKey(): string {
  return `builder_settings_v${STORAGE_VERSION}`;
}

export function getAiConversationTeamStorageKey(generation: number, gameId: number): string {
  return `ai_conversation_team_gen_${generation}_game_${gameId}_v${STORAGE_VERSION}`;
}
