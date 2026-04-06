import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "~/pages/home/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Slatedex - Pokemon Team Builder" },
      {
        name: "description",
        content: "Build the perfect Pokemon team. Analyze type coverage, find defensive gaps, and get smart picks across all 9 generations.",
      },
    ],
  }),
  component: LandingPage,
});
