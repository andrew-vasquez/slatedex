import { createFileRoute } from "@tanstack/react-router";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import AdminSettingsPage from "~/pages/settings/AdminSettingsPage";

export const Route = createFileRoute("/_authenticated/settings/admin")({
  pendingComponent: () => (
    <RoutePageSkeleton
      eyebrow="Loading Admin"
      title="Opening admin dashboard"
      description="Loading usage analytics, account metrics, and admin controls."
    />
  ),
  component: AdminSettingsPage,
});
