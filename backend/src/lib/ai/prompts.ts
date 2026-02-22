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
    evolutionStage: number | null;
    evolutionLine: string[];
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
  progression: {
    checkpoint: {
      name: string;
      stage: "gym" | "elite4" | "champion";
      gymOrder: number | null;
      primaryTypes: string[];
      notes: string | null;
      recommendedPlayerLevelRange: string | null;
      expectedEvolutionBand: string | null;
    } | null;
    storyPhase: "early" | "mid" | "late" | "elite4" | "champion" | null;
    checkpointCatchablePokemonNames: string[];
    checkpointCatchablePoolSize: number;
    checkpointEvolutionStageCap: number;
    checkpointBlockedFinalNames: string[];
    checkpointEvolutionFallbacks: Array<{ fromName: string; toName: string }>;
    assumedTeamForms: Array<{
      sourceSpeciesName: string;
      assumedSpeciesName: string;
      reason: string;
    }>;
  };
  bossGuidance: Array<{
    name: string;
    stage: "gym" | "elite4" | "champion";
    primaryTypes: string[];
    notes?: string;
    gymOrder?: number;
    recommendedPlayerLevelRange?: string;
    expectedEvolutionBand?: string;
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

function buildProgressionInstruction(context: PromptContext): string {
  const checkpoint = context.progression.checkpoint;
  const catchableCount = context.progression.checkpointCatchablePokemonNames.length;
  const catchablePoolSize = context.progression.checkpointCatchablePoolSize;
  const assumedTeamForms = context.progression.assumedTeamForms;
  const blockedFinalsCount = context.progression.checkpointBlockedFinalNames.length;

  if (!checkpoint) {
    return [
      "No explicit story checkpoint is selected.",
      "If user asks for early/mid/late gym planning, resolve checkpoint from their wording first (for example: first gym, Brock, gym 3).",
      "If checkpoint remains ambiguous, ask a concise clarification before giving specific species-stage advice.",
    ].join(" ");
  }

  const checkpointLabel =
    checkpoint.stage === "gym" && checkpoint.gymOrder
      ? `Gym ${checkpoint.gymOrder} (${checkpoint.name})`
      : checkpoint.name;
  const rules: string[] = [
    `Active story checkpoint is ${checkpointLabel}. Keep recommendations realistic for this exact point in the run.`,
    checkpoint.recommendedPlayerLevelRange
      ? `Assume player level range ${checkpoint.recommendedPlayerLevelRange}.`
      : "Use conservative level assumptions for this checkpoint.",
    checkpoint.expectedEvolutionBand
      ? `Evolution realism rule: ${checkpoint.expectedEvolutionBand}`
      : "Use progression-accurate evolution stages and avoid late-game assumptions.",
    "Do not suggest late-game final evolutions for early checkpoints unless user explicitly states overleveling/trade acceleration.",
    "Pseudo-legendary finals and late availability species (for example Dragonite) should be treated as late-game only by default.",
  ];

  if (assumedTeamForms.length > 0) {
    rules.push(
      `Use progression.assumedTeamForms when discussing current team members at this checkpoint. If a final-stage mon appears in team context, refer to its assumed checkpoint form instead.`
    );
  }

  if (catchableCount > 0) {
    rules.push(
      `Use progression.checkpointCatchablePokemonNames for "catch around now" ideas (${catchableCount} sampled names from roughly ${catchablePoolSize} legal options at this checkpoint).`
    );
    rules.push(
      "Prioritize those names for capture suggestions unless the user's existing team already includes a different legal line."
    );
  } else {
    rules.push(
      "No checkpoint catchable sample list was provided, so say encounter timing is approximate instead of claiming exact route availability."
    );
  }

  if (blockedFinalsCount > 0) {
    rules.push(
      `Avoid recommending species in progression.checkpointBlockedFinalNames (${blockedFinalsCount} known late-form blockers for this checkpoint).`
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
        "Be concise and actionable. Prefer short sections and bullet points when useful. Recommend concrete next steps, matchup plans, and role suggestions. Respect generation constraints in the provided context.",
    },
    {
      role: "system",
      content:
        "Output style rules: use plain text section headers with trailing colons (example: Team Grade:). Avoid markdown syntax like ###, **, *, or code fences. Keep line length compact for mobile readability.",
    },
    {
      role: "system",
      content:
        "When the user asks for team-wide evaluation, analysis, threats, swaps, or overall strategy, include this structure in order: Team Grade, Quick Read, Main Threats, Tactical Fixes, Next Actions. Team Grade must include letter grade (A+..D) and confidence (High/Medium/Low). Quick Read should cover speed curve, type overlap, and hazard posture.",
    },
    {
      role: "system",
      content:
        "For narrow questions (single matchup, one swap, one role), keep answer brief and skip full report sections unless user explicitly asks for full analysis.",
    },
    {
      role: "system",
      content:
        "When discussing bosses/gyms, follow progression realism from context.bossGuidance: respect recommendedPlayerLevelRange and expectedEvolutionBand. For early gyms (especially gym 1-2, e.g. Brock), avoid assuming final evolutions like Dragonite/Charizard/Pidgeot unless explicitly marked as an exception in notes. Use context.progression checkpoint when available.",
    },
    {
      role: "system",
      content: buildProgressionInstruction(context),
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
        "Output sections in this exact order with plain text headers ending in colons: Team Grade, Quick Read, Team Identity, Main Threats, Tactical Fixes, Suggested Swaps (up to 3), Boss Matchup Outlook, Next Actions.",
    },
    {
      role: "system",
      content:
        "Team Grade must include: letter grade (A+..D), confidence (High/Medium/Low), and a 1-sentence rationale. Quick Read must include: speed curve (Aggressive/Balanced/Bulky), type overlap summary, and hazard posture summary.",
    },
    {
      role: "system",
      content:
        "Formatting rules: avoid markdown syntax (no ###, **, *, code blocks). Use short bullets under each section and keep text compact and scannable.",
    },
    {
      role: "system",
      content:
        "Suggested Swaps must remain legal under provided constraints. If no legal improvement exists, explicitly say so and provide non-swap tactical adjustments.",
    },
    {
      role: "system",
      content:
        "Boss Matchup Outlook must be progression-aware. For each gym, use its recommendedPlayerLevelRange and expectedEvolutionBand. For early gyms, discuss realistic pre-evo/mid-evo states (starter often first evolution around Lv16) and avoid late-game final-evolution assumptions. If context.progression checkpoint exists, anchor to it first.",
    },
    {
      role: "system",
      content: buildProgressionInstruction(context),
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
        "Analyze my current team for this version. Give me a Team Grade and Quick Read first, then explain what it handles well, where it is likely to struggle, and concrete legal adjustment advice.",
    },
  ];
}
