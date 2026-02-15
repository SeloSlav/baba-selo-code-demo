import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Not sure which AI recipe generator to use? We tested six popular tools—Let&apos;s Foodie,
        DishGen, ChefGPT, FoodsGPT, Supercook, and Baba Selo—to help you find the best fit for your kitchen.
      </p>

      <h2>1. Let&apos;s Foodie</h2>
      <p>
        <a
          href="https://letsfoodie.com/ai-recipe-generator/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 underline"
        >
          Let&apos;s Foodie
        </a>{" "}
        offers a straightforward, 100% free AI recipe generator. Enter your ingredients (with or
        without quantities), pick a serving size, cuisine type, difficulty, and dietary
        preferences—then hit &quot;Generate My Recipe.&quot; It&apos;s simple and fast, with no
        sign-up required. Great for quick, no-fuss recipe ideas when you have random ingredients
        on hand.
      </p>
      <ul>
        <li>
          <strong>Pros:</strong> Free, no account needed, simple interface, cuisine and diet
          filters
        </li>
        <li>
          <strong>Cons:</strong> Basic output, limited customization, no meal planning or chat
        </li>
      </ul>

      <h2>2. DishGen</h2>
      <p>
        <a
          href="https://www.dishgen.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 underline"
        >
          DishGen
        </a>{" "}
        is a full-featured AI kitchen copilot. Describe ingredients, dietary needs, or meal ideas
        and get custom recipes and meal plans. Premium and Pro tiers add personalized AI models,
        longer chat context, AI recipe editing, and even AI-generated food images. Over 1 million
        AI recipes created. Best for users who want an ongoing AI cooking assistant and meal
        planning.
      </p>
      <ul>
        <li>
          <strong>Pros:</strong> Chat-based interface, meal planning, recipe remixing, personalized
          profiles, commercial rights on Pro
        </li>
        <li>
          <strong>Cons:</strong> Free tier has limited credits, premium features require
          subscription
        </li>
      </ul>

      <h2>3. ChefGPT</h2>
      <p>
        <a
          href="https://www.chefgpt.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 underline"
        >
          ChefGPT
        </a>{" "}
        is an AI-powered personal chef focused on health goals. Get recipes in one tap from
        ingredients or dish searches. Track calories by snapping a photo of your meal—AI detects
        ingredients and estimates nutrition. Smart meal plans and real-time pantry tracking help
        reduce waste. Over 1 million dinners saved. Best for calorie and macro tracking alongside
        recipe generation.
      </p>
      <ul>
        <li>
          <strong>Pros:</strong> Photo-based calorie tracking, pantry management, meal plans,
          shopping lists, mobile apps
        </li>
        <li>
          <strong>Cons:</strong> App-centric (iOS/Android), may require subscription for full
          features
        </li>
      </ul>

      <h2>4. FoodsGPT</h2>
      <p>
        <a
          href="https://foodsgpt.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 underline"
        >
          FoodsGPT
        </a>{" "}
        emphasizes smart ingredient understanding and personalized meals. Enter ingredients,
        dietary goals, or recipe ideas and get full recipes with step-by-step logic. The AI
        considers how ingredients behave when cooked, not just names. Supports diabetes meal
        plans, AI meal planning, and recipes tailored to skill level and time. No sign-up needed,
        unlimited recipe ideas.
      </p>
      <ul>
        <li>
          <strong>Pros:</strong> No sign-up, unlimited recipes, strong ingredient logic, diabetes
          plans, skill-level adaptation
        </li>
        <li>
          <strong>Cons:</strong> Web-only, fewer extras like pantry tracking or photo scanning
        </li>
      </ul>

      <h2>5. Supercook</h2>
      <p>
        <a
          href="https://www.supercook.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 underline"
        >
          Supercook
        </a>{" "}
        is a zero-waste recipe generator built around your pantry. Choose from 2,000+ ingredients
        by category or use voice dictation. It draws from over 11 million recipes from 18,000
        sites in 20 languages. AI food scanning identifies ingredients from fridge photos.
        Supports Keto, Vegan, Paleo, Gluten-Free, and more. ChatGPT integration for cooking
        questions and substitutions. Available on web, iOS, and Android.
      </p>
      <ul>
        <li>
          <strong>Pros:</strong> Huge recipe database, pantry-first approach, voice input, photo
          scanning, multi-language, diet filters
        </li>
        <li>
          <strong>Cons:</strong> More about matching existing recipes than generating new ones from
          scratch
        </li>
      </ul>

      <h2>6. Baba Selo</h2>
      <p>
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        is an AI recipe generator with a warm, conversational kitchen vibe. Chat naturally
        to create personalized recipes, generate AI food images in multiple styles, and save your
        creations to your profile. Free tier available with optional Pro for more generations.
        Best for cooks who love to chat, experiment with AI-generated recipe photos, and build a
        personal recipe collection.
      </p>
      <ul>
        <li>
          <strong>Pros:</strong> Conversational chat, AI recipe images, save & share
          recipes, personal profile, warm UX
        </li>
        <li>
          <strong>Cons:</strong> Web-focused, free tier has usage limits
        </li>
      </ul>

      <h2>Quick Comparison</h2>
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border border-amber-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-amber-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Tool</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Best For</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Free Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            <tr>
              <td className="px-4 py-3">Let&apos;s Foodie</td>
              <td className="px-4 py-3">Quick, simple recipes</td>
              <td className="px-4 py-3">100% free</td>
            </tr>
            <tr>
              <td className="px-4 py-3">DishGen</td>
              <td className="px-4 py-3">Meal plans & chat</td>
              <td className="px-4 py-3">Limited credits</td>
            </tr>
            <tr>
              <td className="px-4 py-3">ChefGPT</td>
              <td className="px-4 py-3">Calorie & macro tracking</td>
              <td className="px-4 py-3">Varies</td>
            </tr>
            <tr>
              <td className="px-4 py-3">FoodsGPT</td>
              <td className="px-4 py-3">Smart ingredient logic</td>
              <td className="px-4 py-3">Unlimited, no sign-up</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Supercook</td>
              <td className="px-4 py-3">Pantry-first, huge database</td>
              <td className="px-4 py-3">Free with premium options</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Baba Selo</td>
              <td className="px-4 py-3">AI images, recipe saving, chat</td>
              <td className="px-4 py-3">Free tier, Pro available</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Our Take</h2>
      <p>
        Each tool has a different strength. If you want the simplest free option, try Let&apos;s
        Foodie or FoodsGPT. For meal planning and chat, DishGen leads. For calorie tracking and
        pantry management, ChefGPT and Supercook shine. For recipe creation with AI
        images and a warm kitchen vibe,{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        is built for cooks who love to chat, create, and save their recipes. For more tips, see our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          complete guide to using AI recipe generators
        </Link>{" "}
        or compare{" "}
        <Link href="/blog/ai-recipe-generator-vs-chatgpt" className="text-amber-600 hover:text-amber-700 underline">
          AI recipe tools vs ChatGPT
        </Link>.
      </p>
    </ArticleWrapper>
  );
}
