/**
 * Shared blog constants - DRY for author, related articles, etc.
 */

export const BABA_SELO_AUTHOR = {
  name: "Baba Selo",
  role: "AI Recipe Assistant",
  description:
    "Baba Selo is your digital grandmother from a little village on the Dalmatian coast—warm, wise, and always ready to help you cook. She loves turning your ingredients into delicious recipes, sharing kitchen tips, and making sure nothing goes to waste. Chat with her at Baba Selo to create, save, and share your culinary creations.",
  imagePath: "/apple-touch-icon.png",
} as const;

/** Related articles per slug - for internal linking and RelatedArticles section */
export const RELATED_ARTICLES: Record<string, string[]> = {
  "ai-recipe-generator-comparison": [
    "best-ai-recipe-generator",
    "how-to-use-ai-recipe-generators-guide",
    "ai-recipe-generator-vs-chatgpt",
  ],
  "how-to-use-ai-recipe-generators-guide": [
    "ai-recipe-generator-comparison",
    "recipes-from-leftovers-ai",
    "mistakes-using-ai-recipes",
  ],
  "recipes-from-leftovers-ai": [
    "how-to-use-ai-recipe-generators-guide",
    "save-ai-generated-recipes",
    "ai-recipe-generator-chicken",
  ],
  "ai-recipe-generator-vs-chatgpt": [
    "ai-recipe-generator-comparison",
    "how-to-use-ai-recipe-generators-guide",
    "save-ai-generated-recipes",
  ],
  "ai-recipe-generators-vegan-keto-glutenfree": [
    "ai-recipe-generator-vegan",
    "ai-recipe-generator-keto",
    "ai-recipe-generator-gluten-free",
  ],
  "mistakes-using-ai-recipes": [
    "how-to-use-ai-recipe-generators-guide",
    "ai-generated-recipes-safe",
    "ai-recipe-generator-accurate",
  ],
  "save-ai-generated-recipes": [
    "how-to-use-ai-recipe-generators-guide",
    "recipes-from-leftovers-ai",
    "ai-recipe-generator-meal-planning",
  ],
  "ai-recipe-generator-meal-planning": [
    "how-to-use-ai-recipe-generators-guide",
    "save-ai-generated-recipes",
    "ai-recipe-generator-quick-meals",
  ],
  "ai-generated-recipes-safe": [
    "how-to-use-ai-recipe-generators-guide",
    "mistakes-using-ai-recipes",
    "ai-recipe-generator-accurate",
  ],
  "best-ai-recipe-generator": [
    "ai-recipe-generator-comparison",
    "ai-recipe-generator-vs-chatgpt",
    "how-to-use-ai-recipe-generators-guide",
  ],
  "ai-recipe-generator-quick-meals": [
    "ai-recipe-generator-one-pot",
    "ai-recipe-generator-meal-planning",
    "ai-recipe-generator-chicken",
  ],
  "ai-recipe-generator-one-pot": [
    "ai-recipe-generator-quick-meals",
    "recipes-from-leftovers-ai",
    "ai-recipe-generator-pasta",
  ],
  "ai-recipe-generator-budget": [
    "recipes-from-leftovers-ai",
    "ai-recipe-generator-rice",
    "ai-recipe-generator-eggs",
  ],
  "ai-recipe-generator-family-dinner": [
    "ai-recipe-generator-meal-planning",
    "ai-recipe-generator-quick-meals",
    "ai-recipe-generator-chicken",
  ],
  "ai-recipe-generator-chicken": [
    "ai-recipe-generator-pasta",
    "recipes-from-leftovers-ai",
    "ai-recipe-generator-quick-meals",
  ],
  "ai-recipe-generator-ground-beef": [
    "ai-recipe-generator-chicken",
    "ai-recipe-generator-pasta",
    "ai-recipe-generator-one-pot",
  ],
  "ai-recipe-generator-pasta": [
    "ai-recipe-generator-chicken",
    "ai-recipe-generator-one-pot",
    "ai-recipe-generator-asian",
  ],
  "ai-recipe-generator-rice": [
    "ai-recipe-generator-asian",
    "recipes-from-leftovers-ai",
    "ai-recipe-generator-budget",
  ],
  "ai-recipe-generator-eggs": [
    "ai-recipe-generator-quick-meals",
    "ai-recipe-generator-budget",
    "ai-recipe-generator-dessert",
  ],
  "ai-recipe-generator-accurate": [
    "ai-generated-recipes-safe",
    "mistakes-using-ai-recipes",
    "ai-recipe-substitutions",
  ],
  "ai-recipe-substitutions": [
    "ai-recipe-generator-accurate",
    "how-to-use-ai-recipe-generators-guide",
    "ai-recipe-generator-vegan",
  ],
  "ai-recipe-scaling-portions": [
    "ai-recipe-generator-family-dinner",
    "ai-recipe-generator-accurate",
    "ai-recipe-generator-meal-planning",
  ],
  "ai-recipe-generator-gluten-free": [
    "ai-recipe-generators-vegan-keto-glutenfree",
    "ai-recipe-generator-dairy-free",
    "ai-generated-recipes-safe",
  ],
  "ai-recipe-generator-vegan": [
    "ai-recipe-generators-vegan-keto-glutenfree",
    "ai-recipe-generator-dairy-free",
    "ai-recipe-substitutions",
  ],
  "ai-recipe-generator-keto": [
    "ai-recipe-generators-vegan-keto-glutenfree",
    "ai-recipe-generator-low-carb",
    "ai-recipe-substitutions",
  ],
  "ai-recipe-generator-dairy-free": [
    "ai-recipe-generator-vegan",
    "ai-recipe-generator-gluten-free",
    "ai-recipe-substitutions",
  ],
  "ai-recipe-generator-low-carb": [
    "ai-recipe-generator-keto",
    "ai-recipe-generators-vegan-keto-glutenfree",
    "ai-recipe-generator-chicken",
  ],
  "ai-recipe-generator-mediterranean": [
    "ai-recipe-generator-vegan",
    "ai-recipe-generator-quick-meals",
    "ai-recipe-generator-chicken",
  ],
  "ai-recipe-generator-asian": [
    "ai-recipe-generator-pasta",
    "ai-recipe-generator-rice",
    "ai-recipe-generator-quick-meals",
  ],
  "ai-recipe-generator-dessert": [
    "ai-recipe-generator-eggs",
    "ai-recipe-substitutions",
    "save-ai-generated-recipes",
  ],
};
