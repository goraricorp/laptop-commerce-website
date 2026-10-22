const configuredApiOrigin = import.meta.env.VITE_PUBLIC_SERVER_URL?.trim();
const localApiOrigin = import.meta.env.DEV ? "http://127.0.0.1:5172" : "";
const origin = configuredApiOrigin || localApiOrigin;

if (!origin) {
  throw new Error("VITE_PUBLIC_SERVER_URL must point to the Express API origin.");
}

const parsedOrigin = new URL(origin);
if (parsedOrigin.pathname !== "/" || parsedOrigin.search || parsedOrigin.hash) {
  throw new Error("VITE_PUBLIC_SERVER_URL must be an origin without path or query.");
}

export const apiBaseUrl = parsedOrigin.origin;
export const authBaseUrl = `${apiBaseUrl}/auth`;
