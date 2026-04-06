import { createFileRoute } from "@tanstack/react-router";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import PlayPage from "~/pages/play/PlayPage";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Choose a Generation for Team Building | Slatedex" },
      {
        name: "description",
        content:
          "Choose a Pokemon generation, compare regions and starters, and start building a stronger team with Slatedex coverage analysis and recommendations.",
      },
    ],
  }),
  pendingComponent: () => (
    <RoutePageSkeleton
      eyebrow="Loading Builder"
      title="Preparing generation picker"
      description="Loading generations, game cards, and your last-played selection."
      compact
    />
  ),
  component: PlayPage,
});
