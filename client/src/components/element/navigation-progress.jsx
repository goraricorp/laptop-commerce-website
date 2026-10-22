import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BProgress } from "@bprogress/core";

BProgress.configure({
  easing: "ease",
  minimum: 0.08,
  showSpinner: false,
  speed: 250,
  trickle: true,
  trickleSpeed: 200,
  height: "2px",
});

export function NavigationProgress() {
  const status = useRouterState({ select: (state) => state.status });

  useEffect(() => {
    if (status === "pending") {
      BProgress.start();
      return;
    }

    BProgress.done();
  }, [status]);

  useEffect(() => () => BProgress.done(true), []);

  return null;
}
