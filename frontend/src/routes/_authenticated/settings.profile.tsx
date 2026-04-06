import { createFileRoute } from "@tanstack/react-router";
import RoutePageSkeleton from "~/components/ui/RoutePageSkeleton";
import ProfileSettingsPage from "~/pages/settings/ProfileSettingsPage";

export const Route = createFileRoute("/_authenticated/settings/profile")({
  pendingComponent: () => (
    <RoutePageSkeleton
      eyebrow="Loading Profile"
      title="Preparing your public profile settings"
      description="Fetching profile details, favorites, saved teams, and avatar data."
    />
  ),
  component: ProfileSettingsPage,
});
