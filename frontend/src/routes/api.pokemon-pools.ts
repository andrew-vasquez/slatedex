import { createFileRoute } from "@tanstack/react-router";
import { GET as getPokemonPools } from "~/server/routes/api/pokemon-pools";

export const Route = createFileRoute("/api/pokemon-pools")({
  server: {
    handlers: {
      GET: ({ request }) => getPokemonPools(request),
    },
  },
});
