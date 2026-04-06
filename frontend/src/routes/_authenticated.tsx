import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentSession } from "~/lib/session.functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const session = await getCurrentSession();

    if (!session) {
      throw redirect({
        to: "/auth",
        search: {
          mode: "sign-in",
          redirect: location.href,
        },
      });
    }

    return { session };
  },
  component: () => <Outlet />,
});
