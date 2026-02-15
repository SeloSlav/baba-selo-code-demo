"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "baba-selo-plan-debug-override";

type PlanOverride = "free" | "pro" | null;

interface PlanDebugContextType {
  planOverride: PlanOverride;
  setPlanOverride: (v: PlanOverride) => void;
  /** Returns effective plan: override if set, else realPlan */
  usePlan: (realPlan: "free" | "pro") => "free" | "pro";
}

const PlanDebugContext = createContext<PlanDebugContextType | null>(null);

function getStoredOverride(): PlanOverride {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "free" || v === "pro") return v;
    return null;
  } catch {
    return null;
  }
}

export function PlanDebugProvider({ children }: { children: React.ReactNode }) {
  const [planOverride, setPlanOverrideState] = useState<PlanOverride>(null);

  useEffect(() => {
    setPlanOverrideState(getStoredOverride());
  }, []);

  const setPlanOverride = useCallback((v: PlanOverride) => {
    setPlanOverrideState(v);
    try {
      if (v) localStorage.setItem(STORAGE_KEY, v);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const usePlan = useCallback(
    (realPlan: "free" | "pro"): "free" | "pro" => {
      return planOverride ?? realPlan;
    },
    [planOverride]
  );

  return (
    <PlanDebugContext.Provider value={{ planOverride, setPlanOverride, usePlan }}>
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
