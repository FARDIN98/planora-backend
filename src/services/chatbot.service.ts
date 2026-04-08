import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT =
  "You are Planora Assistant, a helpful chatbot for the Planora event platform. " +
  "You can help users with: finding events, understanding event types, registration process, " +
  "how to create events, payment info, and general platform questions. " +
  "Keep responses concise (2-3 sentences max). Be friendly and helpful.";

function getGenAI(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

async function chat(
  message: string,
  history: { role: string; content: string }[],
): Promise<string> {
  const genAI = getGenAI();

  if (!genAI) {
    return "AI assistant is currently unavailable. Please try again later.";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Map history to Gemini format
    const geminiHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chatSession = model.startChat({
      history: geminiHistory,
    });

    const result = await chatSession.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("[chatbot] Gemini API error:", error);
    return "I'm having trouble processing your request right now. Please try again later.";
  }
}

export const chatbotService = { chat };
