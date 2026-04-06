import { createFileRoute } from "@tanstack/react-router";
import { GET as getCaptureGuide } from "~/server/routes/api/pokemon-capture-guide";

export const Route = createFileRoute("/api/pokemon-capture-guide")({
  server: {
    handlers: {
      GET: ({ request }) => getCaptureGuide(request),
    },
  },
});
