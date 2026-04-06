import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "~/pages/auth/AuthPage";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});
