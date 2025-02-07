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
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use "gpt-4" or "gpt-3.5-turbo" if unavailable
        max_tokens: 500,  
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are an expert sommelier and culinary pairing specialist. Given a recipe, suggest an ideal dish pairing (e.g., wine, side dish, or dessert) that complements it. Respond concisely and elegantly. Do not use any markdown formatting or asterisks in your response. Respond concisely and elegantly.`
          },
          { role: "user", content: recipe }
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return NextResponse.json({ error: "Failed to fetch pairing suggestions" }, { status: 500 });
    }

    return NextResponse.json({ suggestion: data.choices?.[0]?.message?.content || "No pairing suggestion available." });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}