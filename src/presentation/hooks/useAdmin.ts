// ====================================================================
// useAdmin — React hook for admin authentication state management
// ====================================================================

import { useState, useCallback, useEffect } from "react";

interface UseAdminReturn {
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly login: (email: string, password: string) => Promise<boolean>;
  readonly logout: () => void;
}

/**
 * Hook for admin authentication state management.
 * In production, integrate with real Supabase Auth for the AVIORA brand.
 */
export function useAdmin(): UseAdminReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // TODO: Integrate with production Supabase Auth
      // Current implementation uses demo credentials for development only
      // In production, use: supabase.auth.signInWithPassword({ email, password })
      if (email.includes('@aviora.com') && password.length > 0) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
    setIsAuthenticated(!!storedToken);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
