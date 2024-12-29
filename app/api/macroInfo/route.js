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

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are a nutritionist. Based on a given recipe, calculate the total calories and macros (proteins, carbs, fats) for the entire recipe and per serving. Provide concise output with the total values for calories, proteins, carbs, and fats in grams. Do not include a detailed breakdown of each ingredient. Structure the response as JSON with "total" and "per_serving" keys.`
          },
          { role: "user", content: recipe },
        ],
      }),
    });

    const data = await response.json();
    // console.log("OpenAI API raw response:", data); // Debug raw response

    if (!response.ok || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Unexpected OpenAI API response structure:", data);
      return NextResponse.json({ error: "Failed to fetch calorie and macro info" }, { status: 500 });
    }

    // Strip backticks and parse JSON
    let rawContent = data.choices[0].message.content;
    try {
      // Remove triple backticks and "json" tag if present
      rawContent = rawContent.replace(/^```json\s*|```$/g, "").trim();
      const nutritionData = JSON.parse(rawContent); // Parse as JSON
      // console.log("Parsed nutrition data:", nutritionData); // Debug parsed data
      return NextResponse.json({
        macros: nutritionData,
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI API response:", parseError);
      console.error("Raw message content:", rawContent);
      return NextResponse.json({ error: "Invalid response format from OpenAI" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
