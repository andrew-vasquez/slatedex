import { createFileRoute } from "@tanstack/react-router";
import TermsPage from "~/pages/terms/TermsPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Slatedex" },
      { name: "description", content: "Terms governing the use of Slatedex, including accounts, AI features, and acceptable use." },
    ],
  }),
  component: TermsPage,
});
