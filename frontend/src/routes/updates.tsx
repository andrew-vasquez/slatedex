import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/updates")({
  component: UpdatesLayout,
});

function UpdatesLayout() {
  return <Outlet />;
}
