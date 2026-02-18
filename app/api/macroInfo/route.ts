import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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
            content: `You are a nutritionist API that ONLY responds with JSON. Based on a given recipe, calculate the total calories and macros (proteins, carbs, fats) for the entire recipe and per serving. First, determine the number of servings based on the recipe portions or ingredients. Then provide the total values for calories, proteins, carbs, and fats in grams, along with the number of servings. Structure the response EXACTLY as shown, with NO additional text or explanation:

{
  "servings": 4,
  "total": {
    "calories": 1200,
    "proteins": 60,
    "carbs": 140,
    "fats": 45
  },
  "per_serving": {
    "calories": 300,
    "proteins": 15,
    "carbs": 35,
    "fats": 11.25
  }
}`
          },
          { role: "user", content: recipe },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Unexpected OpenAI API response structure:", data);
      return NextResponse.json({ error: "Failed to fetch calorie and macro info" }, { status: 500 });
    }

    try {
      let rawContent = data.choices[0].message.content;
      rawContent = rawContent.replace(/```json\s*|\s*```/g, '').trim();
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      const nutritionData = JSON.parse(jsonMatch[0]);
      if (!nutritionData.servings || !nutritionData.total || !nutritionData.per_serving) {
        throw new Error('Invalid nutrition data structure');
      }
      return NextResponse.json({
        macros: nutritionData,
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI API response:", parseError);
      console.error("Raw message content:", data.choices[0].message.content);
      return NextResponse.json({ error: "Invalid response format from OpenAI" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
