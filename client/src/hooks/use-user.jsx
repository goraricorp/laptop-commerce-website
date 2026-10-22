"use client";

import { useCallback } from "react";
import { useAuth } from "@/hooks/auth-context";
import {
  useChangeEmailMutation,
  useChangePasswordMutation,
  useDeleteUserMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useRevokeAllSessionsMutation,
  useRevokeOtherSessionsMutation,
  useRevokeSessionMutation,
  useSendVerificationEmailMutation,
  useAccountsQuery,
  useSessionsQuery,
  useUpdateUserMutation,
  useVerifyEmailMutation,
} from "@/services/auth";
export function useUser({ loadAccounts = false, loadSessions = false } = {}) {
  const auth = useAuth();
  const updateUserMutation = useUpdateUserMutation();
  const changeEmailMutation = useChangeEmailMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const sendVerificationMutation = useSendVerificationEmailMutation();
  const verifyEmailMutation = useVerifyEmailMutation();
  const requestPasswordResetMutation = useRequestPasswordResetMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const sessions = useSessionsQuery(
    auth.authenticated && loadSessions,
    auth.user?.id,
  );
  const accounts = useAccountsQuery(
    auth.authenticated && loadAccounts,
    auth.user?.id,
  );
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();
  const revokeAllSessionsMutation = useRevokeAllSessionsMutation();
  const update = useCallback(
    async (data) => {
      const result = await updateUserMutation.mutateAsync(data);
      await auth.refresh();
      return result;
    },
    [auth, updateUserMutation],
  );
  const changeEmail = useCallback(
    async (data) => {
      const result = await changeEmailMutation.mutateAsync(data);
      await auth.refresh();
      return result;
    },
    [auth, changeEmailMutation],
  );
  const changePassword = useCallback(
    (data) =>
      changePasswordMutation.mutateAsync({
        revokeOtherSessions: true,
        ...data,
      }),
    [changePasswordMutation],
  );
  const remove = useCallback(
    async (data = {}) => {
      const result = await deleteUserMutation.mutateAsync(data);
      await auth.refresh();
      return result;
    },
    [auth, deleteUserMutation],
  );
  const resendVerification = useCallback(
    (data = {}) =>
      sendVerificationMutation.mutateAsync({
        email: data.email ?? auth.user?.email,
        callbackURL:
          data.callbackURL ?? new URL("/", window.location.origin).href,
      }),
    [auth.user?.email, sendVerificationMutation],
  );
  return {
    user: auth.user,
    raw: auth.user,
    session: auth.session,
    isLoggedIn: auth.authenticated,
    isLoading: auth.loading,
    loading: auth.loading,
    error: auth.error,
    refresh: auth.refresh,
    update,
    updateUser: update,
    changeEmail,
    changePassword,
    deleteUser: remove,
    sendVerificationEmail: resendVerification,
    verifyEmail: verifyEmailMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    sessions: sessions.data ?? [],
    sessionsQuery: sessions,
    accounts: accounts.data ?? [],
    accountsQuery: accounts,
    revokeSession: revokeSessionMutation.mutateAsync,
    revokeOtherSessions: revokeOtherSessionsMutation.mutateAsync,
    revokeAllSessions: revokeAllSessionsMutation.mutateAsync,
  };
}
export function useAccount() {
  return useUser();
}
