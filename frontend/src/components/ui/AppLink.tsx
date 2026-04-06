import { Link as RouterLink } from "@tanstack/react-router";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

type AppLinkProps = Omit<ComponentPropsWithoutRef<typeof RouterLink>, "to"> & {
  href: string;
};

const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { href, children, replace, ...props },
  ref
) {
  return (
    <RouterLink ref={ref} to={href} replace={replace} {...props}>
      {children}
    </RouterLink>
  );
});

export default AppLink;
