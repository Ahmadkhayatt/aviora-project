// ====================================================================
// useAdmin — React hook for admin authentication state management
// ====================================================================

import { useState, useCallback, useEffect } from "react";

interface UseAdminReturn {
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly login: (username: string, password: string) => Promise<boolean>;
  readonly logout: () => void;
}

const DEMO_CREDENTIALS = {
  username: "admin@luxejewels.com",
  password: "admin123",
};

/**
 * Hook for admin authentication state management.
 * In production, replace with real authentication (e.g., NextAuth, JWT).
 */
export function useAdmin(): UseAdminReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
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
