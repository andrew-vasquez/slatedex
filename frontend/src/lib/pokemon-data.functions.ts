import { createServerFn } from "@tanstack/react-start";
import { getInitialPoolForGame, getLightweightPokemonByGeneration } from "./pokemon-data.server";

export const getGenerationPokemonList = createServerFn({ method: "GET" })
  .inputValidator((data: { generation: number }) => data)
  .handler(async ({ data }) => getLightweightPokemonByGeneration(data.generation));

export const getGameInitialPool = createServerFn({ method: "GET" })
  .inputValidator((data: { game: Parameters<typeof getInitialPoolForGame>[0] }) => data)
  .handler(async ({ data }) => getInitialPoolForGame(data.game));
