import { createFileRoute } from "@tanstack/react-router";
import UpdatesIndexPage from "~/pages/updates/UpdatesIndexPage";

export const Route = createFileRoute("/updates/")({
  head: () => ({
    meta: [
      { title: "Updates | Slatedex" },
      {
        name: "description",
        content: "Follow Slatedex devlogs, release notes, and product updates as the Pokemon team builder keeps evolving.",
      },
    ],
  }),
  component: UpdatesIndexPage,
});
