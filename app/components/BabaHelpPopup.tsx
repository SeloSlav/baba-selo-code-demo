"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

interface BabaHelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const HELP_ITEMS = [
  {
    title: "Save recipes",
    text: "Say \"save this\" or \"add to my collection\" and I'll put the recipe in your saved recipes. You need to be signed in for that.",
  },
  {
    title: "Scale a recipe",
    text: "Ask me to \"make this for 6 people\" or \"double this recipe\"—I'll adjust all the ingredients for you.",
  },
  {
    title: "Nutrition info",
    text: "Want to know the calories or protein? Just ask \"how many calories in this?\" or \"what's the nutrition?\"",
  },
  {
    title: "Ingredient swaps",
    text: "Don't have kajmak or sour cream? Ask \"what can I use instead of X?\" and I'll suggest substitutes.",
  },
  {
    title: "Kitchen timer",
    text: "Say \"timer for 20 minutes\" or \"remind me in 5 minutes\" and I'll set one for you.",
  },
  {
    title: "Translate a recipe",
    text: "Want it in Croatian, Serbian, or another language? Just ask—\"give me this in Croatian\" or \"translate to Spanish.\"",
  },
  {
    title: "Meal planning",
    text: "Ask me to plan your meals for the week. Tell me your preferences (Mediterranean, quick dinners, etc.) and I'll create a plan with shopping list. Sign in to save it.",
  },
  {
    title: "Add to meal plan",
    text: "Got a recipe you love? Say \"add this to Saturday\" or \"put it in my meal plan for Monday.\"",
  },
  {
    title: "What's in season?",
    text: "Ask \"what's good right now?\" or \"what's in season?\" and I'll tell you what's best to cook with this month.",
  },
  {
    title: "Recipes from what you have",
    text: "Tell me what's in your fridge—\"I have chicken, rice, and paprika—what can I make?\"—and I'll find recipes that use those ingredients.",
  },
  {
    title: "Convert measurements",
    text: "Need to convert cups to grams or tablespoons to teaspoons? Just ask—\"how many cups is 200g flour?\" or \"1 cup to ml.\"",
  },
  {
    title: "Similar recipes",
    text: "Love a recipe and want more like it? Ask \"what else is like this?\" or \"something similar to sarma.\"",
  },
  {
    title: "Picture of a dish",
    text: "Want to see what something looks like? Ask \"show me a picture of burek\" or \"draw kajmak on bread\" and I'll generate one.",
  },
];

export const BabaHelpPopup: React.FC<BabaHelpPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-xl border border-amber-100 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-amber-100 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleQuestion} className="text-amber-700 text-xl" />
            <h2 className="text-lg font-semibold text-amber-900">What can Baba do for you?</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-amber-100 text-amber-800 transition-colors"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <p className="text-amber-900/80 text-sm">
            Just talk to me naturally—here are some things you can ask:
          </p>
          {HELP_ITEMS.map((item, i) => (
            <div key={i} className="border-l-2 border-amber-200 pl-3 py-1">
              <h3 className="font-medium text-amber-900 text-sm">{item.title}</h3>
              <p className="text-amber-800/80 text-sm mt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
