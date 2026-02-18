"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { renderMarkdown } from "./messageUtils";
import { faUtensils, faSun, faMoon, faCoffee } from "@fortawesome/free-solid-svg-icons";

interface MealSlot {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  description: string;
}

interface MealDay {
  dayName: string;
  slots: MealSlot[];
}

function parseMealPlan(content: string): { intro: string; days: MealDay[]; babaTip: string; footer: string } {
  const intro: string[] = [];
  const days: MealDay[] = [];
  let babaTip = "";
  let footerStart = 0;

  const lines = content.split(/\n/);
  let i = 0;
  const dayRegex = /[-•]?\s*\*{0,2}Day\s+(\d+)\s*:\s*(.+?)\*{0,2}\s*$/i;
  const mealRegex = /^\s*(Breakfast|Lunch|Dinner|Snack(?:\s*\(optional\))?)\s*:\s*(.+)$/i;

  // Skip intro until we hit "Day 1" or "- Day 1" or "**Day 1:**"
  while (i < lines.length) {
    const line = lines[i];
    if (/[-•]?\s*\*{0,2}Day\s+1\s*:/i.test(line) || /^Day\s+1\s*:/i.test(line)) break;
    if (line.trim()) intro.push(line.trim());
    i++;
  }

  while (i < lines.length) {
    const line = lines[i];
    const dayMatch = line.match(dayRegex);
    if (dayMatch) {
      const dayName = `Day ${dayMatch[1]}: ${dayMatch[2].trim().replace(/\*+$/g, "")}`;
      const slots: MealSlot[] = [];
      i++;
      while (i < lines.length) {
        const mealLine = lines[i];
        if (dayRegex.test(mealLine)) break;
        if (/Baba'?s?\s*Tip/i.test(mealLine)) {
          babaTip = mealLine.replace(/Baba'?s?\s*Tip\s*:?\s*\*{0,2}/i, "").trim().replace(/^\*+|\*+$/g, "");
          i++;
          footerStart = i;
          break;
        }
        const mealMatch = mealLine.match(mealRegex);
        if (mealMatch) {
          const type = mealMatch[1].toLowerCase().startsWith("break") ? "breakfast" :
            mealMatch[1].toLowerCase().startsWith("lunch") ? "lunch" :
            mealMatch[1].toLowerCase().startsWith("dinner") ? "dinner" : "snack";
          const rest = mealMatch[2].trim();
          const dashIdx = rest.indexOf(" - ");
          const name = dashIdx >= 0 ? rest.slice(0, dashIdx).trim() : rest;
          const description = dashIdx >= 0 ? rest.slice(dashIdx + 3).trim() : "";
          slots.push({ type, name, description });
        }
        i++;
      }
      if (slots.length > 0) days.push({ dayName, slots });
      continue;
    }
    if (/Baba'?s?\s*Tip/i.test(line)) {
      babaTip = line.replace(/Baba'?s?\s*Tip\s*:?\s*\*{0,2}/i, "").trim().replace(/^\*+|\*+$/g, "");
      i++;
      footerStart = i;
      break;
    }
    i++;
  }

  const footer = footerStart > 0 ? lines.slice(footerStart).join("\n").trim() : "";
  return {
    intro: intro.join(" ").trim(),
    days,
    babaTip,
    footer,
  };
}

function isMealPlanContent(text: string): boolean {
  if (typeof text !== "string") return false;
  return (
    (/\*{0,2}Day\s+[1-7]\s*:/i.test(text) || /Day\s+[1-7]\s*:/i.test(text) || /-\s*Day\s+[1-7]\s*:/i.test(text)) &&
    (/Breakfast\s*:/i.test(text) || /Lunch\s*:/i.test(text) || /Dinner\s*:/i.test(text))
  );
}

const MEAL_ICONS: Record<string, React.ReactNode> = {
  breakfast: <FontAwesomeIcon icon={faCoffee} className="w-3.5 h-3.5 text-amber-600" />,
  lunch: <FontAwesomeIcon icon={faSun} className="w-3.5 h-3.5 text-amber-600" />,
  dinner: <FontAwesomeIcon icon={faMoon} className="w-3.5 h-3.5 text-amber-600" />,
  snack: <FontAwesomeIcon icon={faUtensils} className="w-3.5 h-3.5 text-amber-600" />,
};

export function isMealPlan(text: string | unknown): boolean {
  return typeof text === "string" && isMealPlanContent(text);
}

export const MealPlanMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  const parsed = parseMealPlan(content);

  if (parsed.days.length === 0) {
    return (
      <div className="bg-[#fef3c7] text-[#171717] px-5 py-2.5 rounded-3xl max-w-[95%]">
        <div className="whitespace-pre-wrap [&_a]:text-amber-700 [&_a]:underline">{renderMarkdown(content)}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-amber-100 shadow-lg overflow-hidden max-w-[95%]">
        {parsed.intro && (
          <div className="px-5 py-4 bg-amber-50/50 border-b border-amber-100">
            <p className="text-gray-800">{renderMarkdown(parsed.intro)}</p>
          </div>
        )}
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {parsed.days.map((day, idx) => (
            <div key={idx} className="border-b border-amber-100 last:border-0 pb-4 last:pb-0">
              <h3 className="text-base font-bold text-amber-900 mb-3">{day.dayName}</h3>
              <div className="space-y-2">
                {day.slots.map((slot, sIdx) => (
                  <div key={sIdx} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 flex items-center justify-center text-amber-600">
                      {MEAL_ICONS[slot.type] || MEAL_ICONS.snack}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-800 capitalize">{slot.type}:</span>{" "}
                      <span className="text-gray-700">{renderMarkdown(slot.name)}</span>
                      {slot.description && (
                        <span className="text-gray-600"> — {slot.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {parsed.babaTip && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
            <p className="text-sm text-amber-800 italic">Baba&apos;s Tip: {renderMarkdown(parsed.babaTip)}</p>
          </div>
        )}
        {parsed.footer && (
          <div className="px-5 py-3 border-t border-amber-100 text-sm text-gray-700">
            {renderMarkdown(parsed.footer)}
          </div>
        )}
      </div>
    </div>
  );
};
