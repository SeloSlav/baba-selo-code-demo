"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "baba-selo-plan-debug-override";

export type PlanOverride = "logged_out" | "free" | "pro";

interface PlanDebugContextType {
  planOverride: PlanOverride;
  setPlanOverride: (v: PlanOverride) => void;
  /** Returns effective plan: override applied */
  usePlan: (realPlan: "free" | "pro") => "free" | "pro";
  /** When true, simulate logged-out state (no user) */
  simulateLoggedOut: boolean;
}

const PlanDebugContext = createContext<PlanDebugContextType | null>(null);

function getStoredOverride(): PlanOverride {
  if (typeof window === "undefined") return "logged_out";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "logged_out" || v === "free" || v === "pro") return v;
    return "logged_out";
  } catch {
    return "logged_out";
  }
}

export function PlanDebugProvider({ children }: { children: React.ReactNode }) {
  const [planOverride, setPlanOverrideState] = useState<PlanOverride>(() => getStoredOverride());

  useEffect(() => {
    setPlanOverrideState(getStoredOverride());
  }, []);

  const setPlanOverride = useCallback((v: PlanOverride) => {
    setPlanOverrideState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore
    }
  }, []);

  const usePlan = useCallback(
    (realPlan: "free" | "pro"): "free" | "pro" => {
      if (planOverride === "pro") return "pro";
      return "free"; // logged_out and free both = free plan
    },
    [planOverride]
  );

  return (
    <PlanDebugContext.Provider
      value={{
        planOverride,
        setPlanOverride,
        usePlan,
        simulateLoggedOut: planOverride === "logged_out",
      }}
    >
      {children}
    </PlanDebugContext.Provider>
  );
}

export function usePlanDebug() {
  const ctx = useContext(PlanDebugContext);
  return ctx;
}

/** Hook: pass your real plan, get effective plan (override applied if set) */
export function useEffectivePlan(realPlan: "free" | "pro"): "free" | "pro" {
  const ctx = usePlanDebug();
  if (!ctx) return realPlan;
  return ctx.usePlan(realPlan);
}
