import { createFileRoute } from "@tanstack/react-router";
import PrivacyPage from "~/pages/privacy/PrivacyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Slatedex" },
      { name: "description", content: "How Slatedex collects, stores, and uses account, analytics, and product data." },
    ],
  }),
  component: PrivacyPage,
});
