import { caller } from "@/lib/utils/caller";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";
function throwAuthError(error) {
  const authError = new Error(error?.message ?? "Yêu cầu xác thực thất bại");
  authError.code = error?.code;
  authError.status = error?.status;
  authError.statusText = error?.statusText;
  throw authError;
}
async function unwrap(request) {
  const { data, error } = await request;
  if (error) throwAuthError(error);
  return data;
}
export function useAuthenticationQuery() {
  return authClient.useSession();
}
export async function getSession() {
  return unwrap(authClient.getSession());
}
export async function loginWithEmail(data) {
  return unwrap(
    data.email.includes("@")
      ? authClient.signIn.email(data)
      : authClient.signIn.username({
          username: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        }),
  );
}
export async function registerWithEmail(data) {
  return unwrap(authClient.signUp.email(data));
}
export async function sendVerificationOtp(data) {
  return unwrap(authClient.emailOtp.sendVerificationOtp(data));
}
export async function verifyEmailOtp(data) {
  return unwrap(authClient.emailOtp.verifyEmail(data));
}
export async function logout() {
  return unwrap(authClient.signOut());
}
export async function sendVerificationEmail(data) {
  return unwrap(authClient.sendVerificationEmail(data));
}
export async function verifyEmail(token, callbackURL) {
  return unwrap(
    authClient.verifyEmail({
      query: {
        token,
        callbackURL,
      },
    }),
  );
}
export async function requestPasswordReset(data) {
  return unwrap(authClient.requestPasswordReset(data));
}
export async function resetPassword(data) {
  return unwrap(authClient.resetPassword(data));
}
export async function updateUser(data) {
  return unwrap(authClient.updateUser(data));
}
export async function changeEmail(data) {
  return unwrap(authClient.changeEmail(data));
}
export async function changePassword(data) {
  return unwrap(authClient.changePassword(data));
}
export async function deleteUser(data = {}) {
  return caller({
    url: "/me/account/delete",
    method: "POST",
    body: data,
  });
}
export async function listAccounts() {
  return unwrap(authClient.listAccounts());
}
export async function listSessions() {
  return unwrap(authClient.listSessions());
}
export async function revokeSession(token) {
  return unwrap(
    authClient.revokeSession({
      token,
    }),
  );
}
export async function revokeOtherSessions() {
  return unwrap(authClient.revokeOtherSessions());
}
export async function revokeAllSessions() {
  return unwrap(authClient.revokeSessions());
}
export function useLoginMutation() {
  return useMutation({
    mutationFn: loginWithEmail,
  });
}
export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerWithEmail,
  });
}
export function useSendVerificationOtpMutation() {
  return useMutation({
    mutationFn: sendVerificationOtp,
  });
}
export function useVerifyEmailOtpMutation() {
  return useMutation({
    mutationFn: verifyEmailOtp,
  });
}
export function useLogoutMutation() {
  return useMutation({
    mutationFn: logout,
  });
}
export function useSendVerificationEmailMutation() {
  return useMutation({
    mutationFn: sendVerificationEmail,
  });
}
export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: ({ token, callbackURL }) => verifyEmail(token, callbackURL),
  });
}
export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: requestPasswordReset,
  });
}
export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
  });
}
export function useUpdateUserMutation() {
  return useMutation({
    mutationFn: updateUser,
  });
}
export function useChangeEmailMutation() {
  return useMutation({
    mutationFn: changeEmail,
  });
}
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: changePassword,
  });
}
export function useDeleteUserMutation() {
  return useMutation({
    mutationFn: deleteUser,
  });
}
export function useRevokeSessionMutation() {
  return useMutation({
    mutationFn: revokeSession,
  });
}
export function useRevokeOtherSessionsMutation() {
  return useMutation({
    mutationFn: revokeOtherSessions,
  });
}
export function useRevokeAllSessionsMutation() {
  return useMutation({
    mutationFn: revokeAllSessions,
  });
}
export function useSessionsQuery(enabled = true, ownerId) {
  return useQuery({
    queryKey: ["auth", "sessions", ownerId],
    queryFn: listSessions,
    enabled,
  });
}
export function useAccountsQuery(enabled = true, ownerId) {
  return useQuery({
    queryKey: ["auth", "accounts", ownerId],
    queryFn: listAccounts,
    enabled,
  });
}
