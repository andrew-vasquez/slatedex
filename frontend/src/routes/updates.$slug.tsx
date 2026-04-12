import { createFileRoute, notFound } from "@tanstack/react-router";
import UpdateDetailPage from "~/pages/updates/UpdateDetailPage";
import { getUpdateBySlug } from "~/lib/updates";

export const Route = createFileRoute("/updates/$slug")({
  loader: ({ params }) => {
    const entry = getUpdateBySlug(params.slug);
    if (!entry) {
      throw notFound();
    }
    return entry;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Update"} | Slatedex` },
      { name: "description", content: loaderData?.summary ?? "Read the latest Slatedex update." },
    ],
  }),
  component: function UpdateDetailRoute() {
    const entry = Route.useLoaderData();
    return <UpdateDetailPage entry={entry} />;
  },
});
