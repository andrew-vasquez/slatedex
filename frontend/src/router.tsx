import * as Sentry from "@sentry/tanstackstart-react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
  });

  if (!router.isServer && !Sentry.getClient()) {
    Sentry.init({
      dsn: "https://43af0bc9eaa1a1eb1d30a122707ee170@o4510846095589376.ingest.us.sentry.io/4510903101554688",
      sendDefaultPii: true,
      tunnel: "/tunnel",
      integrations: [
        Sentry.feedbackIntegration({
          autoInject: false,
        }),
      ],
    });
  }

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
