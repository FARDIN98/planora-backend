const SYSTEM_PROMPT =
  "You are Planora Assistant, a helpful chatbot for the Planora event platform. " +
  "You can help users with: finding events, understanding event types, registration process, " +
  "how to create events, payment info, and general platform questions. " +
  "Keep responses concise (2-3 sentences max). Be friendly and helpful.";

async function chat(
  message: string,
  history: { role: string; content: string }[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return "AI assistant is currently unavailable. Please try again later.";
  }

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history.map((msg) => ({
        role: msg.role === "model" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[chatbot] Groq API error:", response.status, error);
      return "I'm having trouble processing your request right now. Please try again later.";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("[chatbot] Groq API error:", error);
    return "I'm having trouble processing your request right now. Please try again later.";
  }
}

export const chatbotService = { chat };
