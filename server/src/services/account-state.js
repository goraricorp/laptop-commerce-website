import { eq } from "drizzle-orm";
import { user } from "../database/schema.js";
export const domainError = (message, status = 409) =>
  Object.assign(new Error(message), { status });
export async function activeOwner(tx, id) {
  const [row] = await tx
    .select()
    .from(user)
    .where(eq(user.id, id))
    .for("update");
  if (!row || row.anonymizedAt || row.banned)
    throw domainError("Tài khoản không còn hoạt động.", 403);
  return row;
}
