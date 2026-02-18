"use client";

import { createContext, useContext } from "react";
import { useSession } from "@/lib/auth-client";

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
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: AuthContextValue = {
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  return useContext(AuthContext);
}
