import { createFileRoute } from "@tanstack/react-router";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import TeamsPage from "~/pages/teams/TeamsPage";

export const Route = createFileRoute("/_authenticated/teams")({
  pendingComponent: () => (
    <RoutePageSkeleton
      eyebrow="Loading Teams"
      title="Opening your saved teams"
      description="Syncing your team list, version badges, and recent updates."
    />
  ),
  component: TeamsPage,
});
