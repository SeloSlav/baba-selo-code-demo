"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useEffectivePlan } from "../context/PlanDebugContext";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc, Timestamp } from "firebase/firestore";
import { SidebarLayout } from "../components/SidebarLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faArrowRight, faChevronDown, faCalendarDays, faStop, faTrashCan } from "@fortawesome/free-solid-svg-icons";

const EXAMPLE_PROMPTS = [
  "Mediterranean, lots of veggies, olive oil. No red meat.",
  "Quick 30-min weeknight meals. Family-friendly.",
  "Keto, high fat. Avocado oil for cooking.",
  "Vegan, protein-focused. Legumes and tofu.",
  "Low-carb, gluten-free. Comfort food vibes.",
  "Light summer meals. Salads and grilled fish.",
];

const MEAL_PLAN_FAQ = [
  {
    q: "Daily or weekly—which should I choose?",
    a: "Weekly works best if you shop once a week and like to plan ahead. You get a full 7-day plan plus a shopping list. Daily is better if you prefer flexibility—Baba plans one day at a time based on what you might have on hand.",
  },
  {
    q: "When should my weekly plan arrive?",
    a: "Most people choose Saturday morning so they can shop on Sunday and start the week ready. Pick the day that fits your routine—the plan arrives at the time you set (in UTC).",
  },
  {
    q: "What goes in the preferences box?",
    a: "Anything that matters to you: diet (vegan, keto, etc.), cuisines, time limits (30-min meals), allergies, ingredients you love or avoid. The more you add, the more tailored the plans.",
  },
  {
    q: "How are the plans generated?",
    a: "Baba uses AI to create plans based on your preferences. Each plan is generated fresh—daily plans are new each day, weekly plans are new each week. They're emailed to you via Resend.",
  },
  {
    q: "Do I need a shopping list?",
    a: "For weekly plans, a consolidated list helps you buy everything in one trip. If you prefer to wing it or shop as you go, you can turn it off.",
  },
  {
    q: "Can I tell Baba what ingredients I have?",
    a: "Yes. Use the optional 'Ingredients on hand' field to list what's in your fridge or pantry. Baba will prioritize recipes that use those ingredients and reduce waste.",
  },
];

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function formatTimeForDisplay(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const min = String(m || 0).padStart(2, "0");
  if (h === 0) return `12:${min} AM`;
  if (h === 12) return `12:${min} PM`;
  if ((h ?? 0) < 12) return `${h}:${min} AM`;
  return `${(h ?? 12) - 12}:${min} PM`;
}

function getTimezoneLabel(tz: string): string {
  if (tz === "UTC") return "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || tz;
  } catch {
    return tz;
  }
}

const FALLBACK_FUN_FACTS = [
  "Olive oil was used in ancient Olympic games—athletes rubbed it on their skin before competing.",
  "The Mediterranean diet is one of the most studied eating patterns in the world.",
  "Meal prepping can save you up to 3 hours per week in the kitchen.",
  "Herbs like basil and oregano release more flavor when torn by hand than when cut with a knife.",
  "Eating the same breakfast every day can actually help with weight management—fewer decisions, fewer temptations.",
  "A well-stocked pantry is half the battle. Baba always says: good ingredients make good food.",
];

async function fetchPlan(): Promise<"free" | "pro"> {
  const user = auth?.currentUser;
  if (!user) return "free";
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.plan || "free";
    }
  } catch {
    // ignore
  }
  return "free";
}

export default function MealPlansPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<"free" | "pro" | null>(null);
  const effectivePlan = useEffectivePlan(plan ?? "free");

  const [mealPlanPrompt, setMealPlanPrompt] = useState("");
  const [ingredientsOnHand, setIngredientsOnHand] = useState("");
  const [mealPlanType, setMealPlanType] = useState<"daily" | "weekly">("weekly");
  const [mealPlanEnabled, setMealPlanEnabled] = useState(false);
  const [mealPlanTime, setMealPlanTime] = useState("08:00");
  const [mealPlanDay, setMealPlanDay] = useState(6); // Saturday default for weekly
  const [userTimezone, setUserTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [includeShoppingList, setIncludeShoppingList] = useState(true);
  const [calorieTarget, setCalorieTarget] = useState<number | "">(2000);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [funFacts, setFunFacts] = useState<string[]>([]);
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showExamplePrompts, setShowExamplePrompts] = useState(false);
  const [activeTab, setActiveTab] = useState<"configure" | "plans">("configure");
  const [planHistory, setPlanHistory] = useState<{
    id: string;
    type: string;
    content: string;
    subject: string;
    babaTip?: string;
    slots?: { timeSlot: string; recipeId: string; recipeName: string; description: string }[];
    days?: { day: number; dayName: string; slots: { timeSlot: string; recipeId: string; recipeName: string; description: string }[] }[];
    shoppingList?: string;
    createdAt: Timestamp;
  }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPlan("free");
      return;
    }
    fetchPlan().then(setPlan);
  }, [user]);


  useEffect(() => {
    if (!user || effectivePlan !== "pro") return;
    const load = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const d = userDoc.data();
      if (d?.mealPlanPrompt != null) setMealPlanPrompt(d.mealPlanPrompt);
      if (d?.ingredientsOnHand != null) setIngredientsOnHand(d.ingredientsOnHand);
      if (d?.mealPlanType === "daily" || d?.mealPlanType === "weekly") setMealPlanType(d.mealPlanType);
      if (d?.includeShoppingList != null) setIncludeShoppingList(d.includeShoppingList);
      if (d?.mealPlanCalorieTarget != null && typeof d.mealPlanCalorieTarget === "number" && d.mealPlanCalorieTarget > 0) setCalorieTarget(d.mealPlanCalorieTarget);
      else if (d && "mealPlanCalorieTarget" in d && d.mealPlanCalorieTarget == null) setCalorieTarget("");
      const s = d?.mealPlanSchedule;
      if (s) {
        setMealPlanEnabled(!!s.enabled);
        setMealPlanTime(s.time || "08:00");
        if (s.dayOfWeek != null) setMealPlanDay(s.dayOfWeek);
        if (s.timezone) setUserTimezone(s.timezone);
      }
    };
    load();
  }, [user, effectivePlan]);

  const fetchPlanHistory = useCallback(async (): Promise<typeof planHistory> => {
    if (!user) return [];
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const ref = collection(db, "users", user.uid, "mealPlanHistory");
      const snap = await getDocs(ref);
      const plans = snap.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt;
        return {
          id: d.id,
          type: data.type || "daily",
          content: data.content || "",
          subject: data.subject || "",
          babaTip: data.babaTip,
          slots: data.slots,
          days: data.days,
          shoppingList: data.shoppingList,
          createdAt: createdAt && typeof createdAt.toDate === "function" ? createdAt : undefined,
        };
      });
      // Sort by createdAt desc (no index required)
      plans.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const bT = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return bT - aT;
      });
      const result = plans.slice(0, 50);
      setPlanHistory(result);
      return result;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const msg = err?.message || String(e);
      setHistoryError(msg);
      if (err?.code === "permission-denied") {
        setHistoryError("Permission denied. Make sure Firestore rules for mealPlanHistory are deployed (firebase deploy --only firestore:rules).");
      }
      return [];
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && effectivePlan === "pro" && activeTab === "plans") {
      fetchPlanHistory();
    }
  }, [user, effectivePlan, activeTab, fetchPlanHistory]);

  const handleDeletePlan = async (planId: string) => {
    if (!user) return;
    setDeletingPlanId(planId);
    try {
      await deleteDoc(doc(db, "users", user.uid, "mealPlanHistory", planId));
      setPlanHistory((prev) => prev.filter((p) => p.id !== planId));
    } catch {
      setHistoryError("Failed to delete plan");
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleStopMealPlan = async () => {
    if (!user) return;
    setSaving(true);
    setSendError(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        mealPlanSchedule: {
          enabled: false,
          time: mealPlanTime,
          timezone: userTimezone,
          ...(mealPlanType === "weekly" && { dayOfWeek: mealPlanDay }),
        },
      });
      setMealPlanEnabled(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setSendError("Failed to stop. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveMealPlanConfig = async () => {
    if (!user) return;
    setSaving(true);
    setSendError(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const updates = {
        mealPlanPrompt: mealPlanPrompt.trim() || null,
        ingredientsOnHand: ingredientsOnHand.trim() || null,
        mealPlanType,
        includeShoppingList,
        mealPlanCalorieTarget: calorieTarget !== "" && calorieTarget > 0 ? calorieTarget : null,
        mealPlanSchedule: {
          enabled: mealPlanEnabled,
          time: mealPlanTime,
          timezone: userTimezone,
          ...(mealPlanType === "weekly" && { dayOfWeek: mealPlanDay }),
        },
      };
      await updateDoc(userDocRef, updates).catch(async (err: { code?: string }) => {
        if (err.code === "not-found") {
          await setDoc(userDocRef, updates);
        } else throw err;
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setSendError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Cycle through fun facts while meal plan is generating
  useEffect(() => {
    if (!sendingNow) return;
    const facts = funFacts.length > 0 ? funFacts : FALLBACK_FUN_FACTS;
    if (facts.length === 0) return;
    const interval = setInterval(() => {
      setFunFactIndex((i) => (i + 1) % facts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [sendingNow, funFacts.length]);

  const handleSendNow = async () => {
    if (!user) return;
    setSendingNow(true);
    setSendError(null);
    setFunFactIndex(0);
    setFunFacts([]);

    // Start both requests in parallel
    const funFactsPromise = fetch("/api/meal-plan/fun-facts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: mealPlanPrompt.trim() || undefined,
        type: mealPlanType,
      }),
    })
      .then((r) => r.json())
      .then((d) => (d.facts?.length ? d.facts : []))
      .catch(() => []);

    const token = await user.getIdToken();
    const mealPlanPromise = fetch("/api/meal-plan/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: mealPlanType,
        includeShoppingList,
        ingredientsOnHand: ingredientsOnHand.trim() || undefined,
        calorieTarget: calorieTarget !== "" && calorieTarget > 0 ? calorieTarget : undefined,
      }),
    });

    // Wait for fun facts first (max 4s) so we have them before/during the meal plan wait
    const facts = await Promise.race([
      funFactsPromise,
      new Promise<string[]>((r) => setTimeout(() => r([]), 4000)),
    ]);
    if (facts.length > 0) setFunFacts(facts);

    try {
      const res = await mealPlanPromise;
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        const plans = await fetchPlanHistory();
        setActiveTab("plans");
        setExpandedPlanId(data.planId || plans[0]?.id || null);
        if (!data.emailSent) {
          setSendError(data.message || "Email not configured");
        }
      } else {
        setSendError(data.error || "Failed to send");
      }
    } catch {
      setSendError("Failed to send meal plan");
    } finally {
      setSendingNow(false);
    }

    // If fun facts arrived after our 4s wait, use them for next time (or if overlay still showing)
    funFactsPromise.then((f) => f.length > 0 && setFunFacts(f));
  };

  // Not logged in
  if (!user) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
          <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-shrink-0">
              <Image src="/baba-removebg.png" alt="Baba Selo" width={160} height={160} className="object-contain" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Meal plans that fit your life
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Weekly plans with variety, shopping lists, and your preferences—delivered to your inbox.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-8">
                {["Weekly or daily", "Shopping list included", "Your schedule"].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faCheck} className="text-amber-600 text-xs" />
                    </span>
                    {item}
                  </span>
                ))}
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Sign in to get started
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </Link>

              <div className="mt-16 pt-12 border-t border-amber-100 w-full max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">How it works</h2>
                <div className="space-y-2">
                  {MEAL_PLAN_FAQ.map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-amber-100 overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-amber-50/50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{item.q}</span>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`text-amber-600 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                        />
                      </button>
                      {openFaq === i && (
                        <div className="px-5 pb-4 pt-0">
                          <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (plan === null) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-amber-600">Loading...</div>
        </div>
      </SidebarLayout>
    );
  }

  // Pro user
  if (effectivePlan === "pro") {
    const displayFacts = funFacts.length > 0 ? funFacts : FALLBACK_FUN_FACTS;
    const currentFact = displayFacts[funFactIndex % displayFacts.length] || displayFacts[0];

    return (
      <SidebarLayout>
        {/* Loading overlay with cycling fun facts */}
        {sendingNow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-50/95 backdrop-blur-sm">
            <div className="max-w-lg mx-auto px-6 py-12 text-center">
              <Image src="/baba-removebg.png" alt="Baba Selo" width={120} height={120} className="mx-auto mb-6 object-contain" />
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-800 font-medium animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Generating your meal plan...
                </div>
              </div>
              <p key={funFactIndex} className="text-gray-700 text-lg leading-relaxed italic">
                &ldquo;{currentFact}&rdquo;
              </p>
              <p className="mt-4 text-amber-600 text-sm font-medium">— Baba Selo</p>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
          <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Header with Baba */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
              <Image src="/baba-removebg.png" alt="Baba Selo" width={80} height={80} className="object-contain flex-shrink-0" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Your Meal Plans</h1>
                <p className="text-gray-600 mt-1">Configure how Baba plans your meals.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-amber-100">
              <button
                onClick={() => setActiveTab("configure")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === "configure" ? "bg-amber-100 text-amber-900 border-b-2 border-amber-600 -mb-px" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Configure
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === "plans" ? "bg-amber-100 text-amber-900 border-b-2 border-amber-600 -mb-px" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Your Plans
                {planHistory.length > 0 && (
                  <span className="ml-1.5 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
                    {planHistory.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === "plans" ? (
              /* Your Plans tab */
              <div className="space-y-6">
                {/* Status indicator */}
                <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {mealPlanEnabled ? (
                        <>
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                          <span className="text-gray-600 text-sm">
                            Next: {WEEKDAYS[mealPlanDay]?.label || "—"} at {formatTimeForDisplay(mealPlanTime)} {userTimezone === "UTC" ? "UTC" : `(${getTimezoneLabel(userTimezone)})`}
                            {mealPlanType === "weekly" && " (weekly)"}
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            <FontAwesomeIcon icon={faStop} className="text-xs" />
                            Paused
                          </span>
                          <span className="text-gray-500 text-sm">No plans will be sent until you enable delivery.</span>
                          <button
                            onClick={() => setActiveTab("configure")}
                            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                          >
                            Enable in Configure →
                          </button>
                        </div>
                      )}
                    </div>
                    {mealPlanEnabled && (
                      <button
                        onClick={handleStopMealPlan}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Stop meal plans
                      </button>
                    )}
                  </div>
                </div>

                {/* History list */}
                <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Plans you&apos;ve received</h2>
                  <p className="text-sm text-gray-500 mb-4">Plans are also emailed to you. Here you can view them anytime.</p>
                  {historyError && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      {historyError}
                    </div>
                  )}
                  {loadingHistory ? (
                    <div className="py-8 text-center text-gray-500">Loading...</div>
                  ) : planHistory.length === 0 && !historyError ? (
                    <div className="py-8 text-center text-gray-500">
                      <FontAwesomeIcon icon={faCalendarDays} className="text-4xl text-amber-200 mb-3" />
                      <p>No meal plans yet.</p>
                      <p className="text-sm mt-1">Click &quot;Send now&quot; in Configure, or enable delivery to get plans automatically.</p>
                      <button
                        onClick={() => setActiveTab("configure")}
                        className="mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm"
                      >
                        Go to Configure →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {planHistory.map((plan) => (
                        <div
                          key={plan.id}
                          className="border border-amber-100 rounded-xl overflow-hidden"
                        >
                          <div className="w-full px-4 py-3 flex items-center justify-between gap-4">
                            <button
                              onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                              className="flex-1 flex items-center justify-between gap-4 text-left hover:bg-amber-50/50 transition-colors -mx-2 px-2 py-1 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-800">
                                  {plan.type === "weekly" ? "Weekly" : "Daily"}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {plan.createdAt?.toDate ? new Date(plan.createdAt.toDate()).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }) : "—"}
                                </span>
                              </div>
                              <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`text-amber-600 transition-transform ${expandedPlanId === plan.id ? "rotate-180" : ""}`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(plan.id)}
                              disabled={deletingPlanId === plan.id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete plan"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                            </button>
                          </div>
                          {expandedPlanId === plan.id && (
                            <div className="px-4 pb-4 pt-0 border-t border-amber-50">
                              <div className="text-sm text-gray-700 font-sans bg-amber-50/50 p-4 rounded-lg max-h-96 overflow-y-auto space-y-4">
                                {plan.slots?.length ? (
                                  <>
                                    {plan.slots.map((slot) => (
                                      <div key={`${slot.timeSlot}-${slot.recipeId}`} className="border-b border-amber-100 pb-3 last:border-0 last:pb-0">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">{slot.timeSlot}</span>
                                        <p className="mt-1">
                                          <Link href={`/recipe/${slot.recipeId}`} className="text-amber-700 hover:text-amber-800 font-medium hover:underline">
                                            {slot.recipeName}
                                          </Link>
                                          <span className="text-gray-600 ml-1">— {slot.description}</span>
                                        </p>
                                      </div>
                                    ))}
                                    {plan.babaTip && (
                                      <p className="pt-2 text-amber-800/90 italic border-t border-amber-200 mt-2">
                                        Baba Tip: {plan.babaTip}
                                      </p>
                                    )}
                                  </>
                                ) : plan.days?.length ? (
                                  <>
                                    {plan.days.map((day) => (
                                      <div key={day.day} className="border-b border-amber-100 pb-4 last:border-0 last:pb-0">
                                        <h4 className="font-semibold text-amber-900 mb-2">{day.dayName}</h4>
                                        <div className="space-y-2 pl-2">
                                          {day.slots.map((slot) => (
                                            <div key={`${day.day}-${slot.timeSlot}-${slot.recipeId}`}>
                                              <span className="text-xs font-medium text-amber-700">{slot.timeSlot}: </span>
                                              <Link href={`/recipe/${slot.recipeId}`} className="text-amber-700 hover:text-amber-800 font-medium hover:underline">
                                                {slot.recipeName}
                                              </Link>
                                              <span className="text-gray-600"> — {slot.description}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                    {plan.shoppingList && (
                                      <div className="pt-2 border-t border-amber-200">
                                        <h4 className="font-semibold text-amber-900 mb-1">Shopping list</h4>
                                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">{plan.shoppingList}</pre>
                                      </div>
                                    )}
                                    {plan.babaTip && (
                                      <p className="pt-2 text-amber-800/90 italic border-t border-amber-200 mt-2">
                                        Baba Tip: {plan.babaTip}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <pre className="whitespace-pre-wrap">{plan.content}</pre>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: All preferences in one compact box */}
              <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Your preferences</h2>
                <p className="text-xs text-gray-500 mb-3">Diet, cuisines, time limits—in your own words.</p>
                <textarea
                  value={mealPlanPrompt}
                  onChange={(e) => setMealPlanPrompt(e.target.value)}
                  placeholder="e.g. Mediterranean, lots of veggies. No dairy. Quick weeknight meals."
                  className="w-full min-h-[64px] p-3 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => setShowExamplePrompts(!showExamplePrompts)}
                  className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  {showExamplePrompts ? "Hide" : "See"} example prompts
                </button>
                {showExamplePrompts && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {EXAMPLE_PROMPTS.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setMealPlanPrompt(ex)}
                        className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-full border border-amber-200 transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-amber-100 grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Ingredients on hand <span className="text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      value={ingredientsOnHand}
                      onChange={(e) => setIngredientsOnHand(e.target.value)}
                      placeholder="chicken, spinach, lemons..."
                      className="w-full p-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Calories/day <span className="text-gray-400">(optional)</span></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={800}
                        max={4000}
                        step={100}
                        value={calorieTarget === "" ? "" : calorieTarget}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCalorieTarget(v === "" ? "" : (parseInt(v, 10) || 0));
                        }}
                        placeholder="2000"
                        className="w-20 p-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Schedule + Plan type (above the fold) */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery schedule</h2>
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={mealPlanEnabled}
                      onChange={(e) => setMealPlanEnabled(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span>Email me {mealPlanType === "daily" ? "daily" : "weekly"} meal plans</span>
                  </label>
                  {mealPlanEnabled && (
                    <div className="flex flex-wrap items-center gap-4">
                      {mealPlanType === "weekly" && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">On</span>
                          <select
                            value={mealPlanDay}
                            onChange={(e) => setMealPlanDay(Number(e.target.value))}
                            className="p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                          >
                            {WEEKDAYS.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-gray-500">(shop next day)</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">at</span>
                        <input
                          type="time"
                          value={mealPlanTime}
                          onChange={(e) => setMealPlanTime(e.target.value)}
                          className="p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs text-gray-500">{userTimezone === "UTC" ? "UTC" : getTimezoneLabel(userTimezone)}</span>
                      </div>
                      {mealPlanType === "daily" && parseInt(mealPlanTime?.split(":")[0] || "0", 10) >= 18 && (
                        <p className="text-xs text-amber-700 mt-1">You&apos;ll get it the night before—wake up ready for breakfast.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan type</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setMealPlanType("daily");
                        if (mealPlanTime === "08:00") setMealPlanTime("20:00"); // Optimal: evening = plan for next morning
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        mealPlanType === "daily"
                          ? "border-amber-500 bg-amber-50"
                          : "border-amber-100 hover:border-amber-200"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">Daily</div>
                      <div className="text-sm text-gray-500 mt-1">One day at a time.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMealPlanType("weekly");
                        if (mealPlanTime === "20:00") setMealPlanTime("08:00"); // Optimal: Saturday morning = shop Sunday
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        mealPlanType === "weekly"
                          ? "border-amber-500 bg-amber-50"
                          : "border-amber-100 hover:border-amber-200"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">Weekly</div>
                      <div className="text-sm text-gray-500 mt-1">Full week + list.</div>
                    </button>
                  </div>
                  {mealPlanType === "weekly" && (
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeShoppingList}
                        onChange={(e) => setIncludeShoppingList(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span>Include shopping list</span>
                    </label>
                  )}
                </div>

                {sendError && <p className="text-red-600 text-sm">{sendError}</p>}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveMealPlanConfig}
                    disabled={saving}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
                  >
                    {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendNow}
                    disabled={sendingNow}
                    className="px-6 py-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {sendingNow ? "Generating..." : "Send now"}
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* FAQ */}
            <div className="mt-16 pt-12 border-t border-amber-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Common questions</h2>
              <div className="space-y-2">
                {MEAL_PLAN_FAQ.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-amber-100 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{item.q}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-amber-600 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4 pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Free user - CRO
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-shrink-0">
            <Image src="/baba-removebg.png" alt="Baba Selo" width={160} height={160} className="object-contain" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-amber-600 font-semibold text-sm uppercase tracking-wider mb-2">Pro</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Weekly plans, shopping lists, your way
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Choose daily or weekly. Get a consolidated shopping list. Tell Baba what you like—in plain language.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-8">
              {["Daily or weekly", "Shopping list", "Natural language prefs"].map((item) => (
                <span key={item} className="flex items-center gap-2 text-gray-700">
                  <FontAwesomeIcon icon={faCheck} className="text-amber-500" />
                  {item}
                </span>
              ))}
            </div>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Upgrade to Pro
              <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
            </Link>
            <p className="mt-4 text-sm text-gray-500">30-day guarantee · Cancel anytime</p>

            {/* FAQ for free users too */}
            <div className="mt-16 pt-12 border-t border-amber-100 w-full max-w-2xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">How it works</h2>
              <div className="space-y-2">
                {MEAL_PLAN_FAQ.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-amber-100 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{item.q}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-amber-600 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4 pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
