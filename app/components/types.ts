export interface RecipeClassification {
    diet: string[];
    cuisine: string;
    cooking_time: string;
    difficulty: string;
}

export interface Message {
    role: "user" | "assistant";
    content: string;
} 