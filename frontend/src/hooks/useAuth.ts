"use client";

import { useState, useEffect, useCallback } from "react";
import { authAPI } from "@/lib/api";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * useAuth — Client-side authentication hook.
 * Manages JWT tokens in localStorage and provides login/register/logout methods.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // ─── Load user from token on mount ─────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("lifeos_token");
    const savedUser = localStorage.getItem("lifeos_user");

    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setState({ user, token, isLoading: false, isAuthenticated: true });
      } catch {
        localStorage.removeItem("lifeos_token");
        localStorage.removeItem("lifeos_user");
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("lifeos_token", data.token);
    localStorage.setItem("lifeos_user", JSON.stringify(data.user));
    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    });
    return data.user;
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem("lifeos_token", data.token);
    localStorage.setItem("lifeos_user", JSON.stringify(data.user));
    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    });
    return data.user;
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    localStorage.removeItem("lifeos_token");
    localStorage.removeItem("lifeos_user");
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // ─── Refresh User ──────────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      localStorage.setItem("lifeos_user", JSON.stringify(data.user));
      setState((prev) => ({ ...prev, user: data.user }));
    } catch {
      // Token expired or invalid
      logout();
    }
  }, [logout]);

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };
}
