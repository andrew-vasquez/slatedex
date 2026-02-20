import type OpenAI from "openai";
import type { PersistedAiMessage } from "./types";

interface PromptContext {
  generation: number;
  gameId: number;
  selectedVersionId: string | null;
  filters: {
    dexMode: "regional" | "national";
    versionFilterEnabled: boolean;
    regionalDexName: string | null;
    typeFilter: string[];
  };
  constraints: {
    enforceSuggestionPool: boolean;
    allowedPokemonNames: string[];
    allowedPokemonCount: number;
    availableTypes: string[];
    unavailableTypes: string[];
    notes: {
      noFairyType: boolean;
      noDarkOrSteelType: boolean;
    };
  };
  teamSize: number;
  team: Array<{
    id: number;
    name: string;
    types: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
  }>;
  summary: {
    typeDistribution: Array<{ type: string; count: number }>;
    averageStats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    shape: {
      fastCount: number;
      bulkyCount: number;
      physicalCount: number;
      specialCount: number;
    };
  };
  bossGuidance: Array<{
    name: string;
    stage: "gym" | "elite4" | "champion";
    primaryTypes: string[];
    notes?: string;
  }>;
}

function contextToJson(context: PromptContext): string {
  return JSON.stringify(context, null, 2);
}

function buildConstraintInstruction(context: PromptContext): string {
  const rules: string[] = [
    "Follow the generation and filter constraints from Team context JSON exactly.",
    "When suggesting Pokemon swaps/additions, recommend species names only (no forms unless the exact form is in context).",
  ];

  if (context.constraints.enforceSuggestionPool && context.constraints.allowedPokemonCount > 0) {
    rules.push(
      "Only suggest Pokemon whose lowercase species names are present in constraints.allowedPokemonNames."
    );
    rules.push("If no good option exists in that allowed pool, say so and explain the tradeoff.");
  }

  if (context.constraints.notes.noFairyType) {
    rules.push("Do not reference Fairy type mechanics or Fairy-type Pokemon for this game.");
  }

  if (context.constraints.notes.noDarkOrSteelType) {
    rules.push("Do not reference Dark or Steel typing or moves for this game (Gen 1 rules).");
  }

  if (context.filters.dexMode === "regional") {
    rules.push(
      "User is in Regional Dex mode, so recommendations must stay in the selected game's regional dex scope."
    );
  }

  if (context.filters.versionFilterEnabled && context.selectedVersionId) {
    rules.push(
      `Version filter is enabled for ${context.selectedVersionId}; avoid version-exclusive suggestions outside that filter.`
    );
  }

  return rules.join(" ");
}

function historyToMessages(history: PersistedAiMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const output: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  for (const message of history) {
    if (message.role === "assistant") {
      output.push({ role: "assistant", content: message.content });
      continue;
    }
    if (message.role === "user") {
      output.push({ role: "user", content: message.content });
      continue;
    }
  }
  return output;
}

export function buildChatPrompt(params: {
  context: PromptContext;
  history: PersistedAiMessage[];
  userMessage: string;
}): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const { context, history, userMessage } = params;

  return [
    {
      role: "system",
      content:
        "You are Slatedex AI Coach, a practical Pokemon team-building strategist. Use only provided context and widely reliable mechanics. If data is missing, explicitly say what is unknown. Never invent exact encounter routes or boss rosters that are not in context.",
    },
    {
      role: "system",
      content:
        "Be concise and actionable. Prefer bullet-like short paragraphs. Recommend concrete next steps, matchup plans, and role suggestions. Respect generation constraints in the provided context.",
    },
    {
      role: "system",
      content: buildConstraintInstruction(context),
    },
    {
      role: "system",
      content: `Team context (JSON):\n${contextToJson(context)}`,
    },
    ...historyToMessages(history),
    {
      role: "user",
      content: userMessage,
    },
  ];
}

export function buildAnalyzePrompt(params: {
  context: PromptContext;
}): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const { context } = params;
  const bossLine =
    context.bossGuidance.length > 0
      ? "Use provided boss guidance to identify likely hard gyms, elite four members, and champion threats."
      : "Boss guidance data is unavailable for this version. Explicitly state that and provide generic risk patterns instead.";

  return [
    {
      role: "system",
      content:
        "You are Slatedex AI Coach. Produce a clear team report grounded in the provided context only. Do not fabricate specific game facts.",
    },
    {
      role: "system",
      content:
        "Output sections in this order: Team Identity, Main Threats, Tactical Fixes, Suggested Swaps (up to 3), Boss Matchup Outlook (Gyms, Elite Four, Champion).",
    },
    {
      role: "system",
      content: buildConstraintInstruction(context),
    },
    {
      role: "system",
      content: bossLine,
    },
    {
      role: "system",
      content: `Team context (JSON):\n${contextToJson(context)}`,
    },
    {
      role: "user",
      content:
        "Analyze my current team for this version. Include what it handles well, where it is likely to struggle, and concrete adjustment advice.",
    },
  ];
}
