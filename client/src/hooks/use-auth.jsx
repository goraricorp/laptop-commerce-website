"use client";

import PropTypes from "prop-types";
import { AuthContext } from "@/hooks/auth-context";
import { useCallback, useMemo } from "react";
import {
  useAuthenticationQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from "@/services/auth";
export function AuthProvider({ children }) {
  const authentication = useAuthenticationQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const refresh = useCallback(async () => {
    const result = await authentication.refetch();
    return result?.data?.user ?? authentication.data?.user ?? null;
  }, [authentication]);
  const login = useCallback(
    async (data) => {
      const result = await loginMutation.mutateAsync(data);
      await authentication.refetch();
      return result;
    },
    [authentication, loginMutation],
  );
  const register = useCallback(
    async (data) => {
      return registerMutation.mutateAsync(data);
    },
    [registerMutation],
  );
  const logout = useCallback(async () => {
    const result = await logoutMutation.mutateAsync();
    await authentication.refetch();
    return result;
  }, [authentication, logoutMutation]);
  const value = useMemo(() => {
    const account = authentication.data?.user ?? null;
    return {
      account,
      user: account,
      session: authentication.data?.session ?? null,
      authenticated: Boolean(account),
      isAuthenticated: Boolean(account),
      loading: authentication.isPending,
      isLoading: authentication.isPending,
      error:
        authentication.error ??
        loginMutation.error ??
        registerMutation.error ??
        logoutMutation.error ??
        null,
      refresh,
      login,
      register,
      logout,
    };
  }, [
    authentication.data,
    authentication.error,
    authentication.isPending,
    login,
    loginMutation.error,
    logout,
    logoutMutation.error,
    refresh,
    register,
    registerMutation.error,
  ]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
AuthProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
