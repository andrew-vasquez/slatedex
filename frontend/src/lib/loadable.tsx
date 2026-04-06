import { lazy, Suspense } from "react";
import type { ComponentType, ReactNode } from "react";

type LoadableOptions = {
  loading?: () => ReactNode;
  ssr?: boolean;
};

export default function loadable<TProps extends object>(
  loader: () => Promise<ComponentType<TProps> | { default: ComponentType<TProps> }>,
  options?: LoadableOptions
) {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    return "default" in mod ? mod : { default: mod };
  });

  return function LoadableComponent(props: TProps) {
    if (options?.ssr === false && typeof window === "undefined") {
      return <>{options.loading?.() ?? null}</>;
    }

    return (
      <Suspense fallback={options?.loading?.() ?? null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
