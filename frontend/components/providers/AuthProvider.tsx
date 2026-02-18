"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

type AuthTab = "sign-in" | "sign-up";

interface AuthContextValue {
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    image?: string | null;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  openAuthDialog: (tab?: AuthTab) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  openAuthDialog: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const openAuthDialog = useCallback(
    (tab: AuthTab = "sign-in") => {
      const params = new URLSearchParams({ mode: tab });
      router.push(`/auth?${params.toString()}`);
    },
    [router]
  );

  const value: AuthContextValue = {
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    openAuthDialog,
  };

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
