import { Outlet, createFileRoute } from "@tanstack/react-router";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";

export const Route = createFileRoute("/_authenticated/settings")({
  pendingComponent: () => (
    <RoutePageSkeleton
      eyebrow="Loading Settings"
      title="Opening your settings"
      description="Restoring preferences, permissions, and account tools."
      compact
    />
  ),
  component: Outlet,
});
