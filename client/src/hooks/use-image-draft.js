import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { apiBaseUrl } from "@/lib/config/api";
export const DraftContext = createContext(null);
export const base = apiBaseUrl;
export async function discardImage(key) {
  const res = await fetch(`${base}/storage/object`, {
    method: "DELETE",
    credentials: "include",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
    }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.message ?? "Không thể xóa ảnh chưa lưu.");
  return result;
}
export function useImageDraft() {
  const pending = useRef(new Map());
  const mounted = useRef(true);
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const discard = useCallback(async (name) => {
    const entry = pending.current.get(name);
    if (!entry) return undefined;
    pending.current.delete(name);
    try {
      await discardImage(entry.key);
    } catch (error) {
      if (!pending.current.has(name)) pending.current.set(name, entry);
      throw error;
    }
    return entry.original;
  }, []);
  const discardAll = useCallback(async () => {
    const entries = [...pending.current];
    const results = await Promise.allSettled(
      entries.map(async ([name]) => [name, await discard(name)]),
    );
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length)
      toast.add({
        title: "Chưa xóa được một số ảnh; hệ thống sẽ thử dọn lại",
        type: "error",
      });
    return results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
  }, [discard]);
  useEffect(() => {
    mounted.current = true;
    const cleanup = () => {
      if (!saving.current) void discardAll();
    };
    window.addEventListener("pagehide", cleanup);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", cleanup);
      cleanup();
    };
  }, [discardAll]);
  return {
    busy,
    setBusy,
    pending,
    async register(name, key, original) {
      if (!mounted.current) {
        await discardImage(key);
        return false;
      }
      const previous = pending.current.get(name);
      if (previous) await discardImage(previous.key);
      pending.current.set(name, {
        key,
        original: previous ? previous.original : original,
      });
      return true;
    },
    discard,
    discardAll,
    beginSave() {
      saving.current = true;
    },
    endSave() {
      saving.current = false;
    },
    saved() {
      saving.current = false;
      pending.current.clear();
    },
  };
}
