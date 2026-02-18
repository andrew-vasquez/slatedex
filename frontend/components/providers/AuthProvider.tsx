"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import AuthDialog from "@/components/auth/AuthDialog";

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
  openAuthDialog: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  openAuthDialog: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const openAuthDialog = useCallback(() => setAuthDialogOpen(true), []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    openAuthDialog,
  };

  return (
    <AuthContext value={value}>
      {children}
      <AuthDialog isOpen={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </AuthContext>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
