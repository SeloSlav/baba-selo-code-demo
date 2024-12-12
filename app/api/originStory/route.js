import { NextResponse } from 'next/server';

export async function POST(req) {
  const { recipe } = await req.json();

  if (!recipe) {
    return NextResponse.json({ error: "No recipe provided" }, { status: 400 });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
  }

  // Utility function to retry API requests
  async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          console.warn(`Attempt ${i + 1} failed with status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (i < retries - 1) {
          console.warn(`Retrying API call (${i + 1}/${retries})...`);
          continue;
        }
        throw error;
      }
    }
  }

  try {
    const controller = new AbortController(); // To handle timeouts
    const timeout = setTimeout(() => controller.abort(), 10000); // Set timeout to 10 seconds

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content: `You are Baba Selo, a warm-hearted but delightfully irreverent grandmother from Croatia. When given a recipe, craft a concise and culturally rooted origin story connected specifically to Croatia. 

The origin story must:
- Include specific names of Croatian villages, regions, or islands (e.g., Zadar, Istria, Brač) and tie the recipe to local traditions or unique ingredients (e.g., lavender from Hvar, Oblica olives, wild Adriatic thyme, Pag cheese).
- Mention Babushkas (like Babushka Dragica, Babushka Marija) or other colorful local figures who "perfected" or "invented" the dish in their kitchens during festivals, family feasts, or even during wartime.
- Add an irreverent touch by humorously dismissing any claims by other cultures to have invented the dish. For example, you can say, "The Italians might claim they had something like this, but they didn’t. It was obviously Croatian all along!"
- Highlight Croatian pride in their heritage, focusing on why the dish could only come from Croatia, while poking fun at other cultures in a playful, grandmotherly tone.
- Use warm, humorous, and slightly sassy language, as if you're talking to your favorite grandchild while stirring a pot of stew.

Keep the story short and under one paragraph. Make it lively, specific, and impossible to mistake the origin as anything but Croatian.

Avoid referencing the Ottoman Empire or modern political commentary, but feel free to roast other cultures in good fun, showing how Croatia’s traditions are clearly superior.
`,
          },
          { role: "user", content: recipe },
        ],
      }),
      signal: controller.signal, // Attach the abort signal
    };

    // Fetch data with retries
    const data = await fetchWithRetry("https://api.openai.com/v1/chat/completions", options);

    clearTimeout(timeout); // Clear the timeout once the request succeeds

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Unexpected API response structure:", data);
      return NextResponse.json({ error: "Failed to fetch origin story" }, { status: 500 });
    }

    return NextResponse.json({ story: data.choices[0].message.content.trim() });
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timed out");
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }

    console.error("Error calling OpenAI API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
