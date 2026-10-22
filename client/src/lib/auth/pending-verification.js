let pendingVerificationEmail = null;

export function getPendingVerificationEmail() {
  return pendingVerificationEmail;
}

export function setPendingVerificationEmail(email) {
  pendingVerificationEmail = email;
}

export function clearPendingVerificationEmail() {
  pendingVerificationEmail = null;
}
