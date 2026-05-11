import Mistral from "@mistralai/mistralai";

export type GeneratedCard = {
  question: string;
  answer: string;
};

const client = new Mistral(process.env.MISTRAL_API_KEY!);

export async function generateFlashcards(
  text: string,
  count: number = 10
): Promise<GeneratedCard[]> {
  const prompt = `You are an expert educator. Analyze the following text and generate exactly ${count} high-quality flashcards.

Rules:
- Questions should test understanding, not just memorization
- Answers should be concise but complete (1-3 sentences max)
- Cover the most important concepts
- Vary question types: definitions, explanations, applications, comparisons
- Respond ONLY with a valid JSON array, no markdown, no explanation

Format:
[
  {"question": "...", "answer": "..."},
  ...
]

Text to analyze:
---
${text.slice(0, 8000)}
---`;

  const response = await client.chat({
    model: "mistral-large-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 4000,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from Mistral");
  }

  // Clean up potential markdown fences
  const cleaned = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const cards: GeneratedCard[] = JSON.parse(cleaned);

  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("Invalid flashcard format returned");
  }

  return cards;
}

export async function generateDeckTitle(text: string): Promise<string> {
  const response = await client.chat({
    model: "mistral-small-latest",
    messages: [
      {
        role: "user",
        content: `Generate a short, descriptive title (max 5 words) for a flashcard deck based on this text. Respond with ONLY the title, nothing else.\n\nText: ${text.slice(0, 500)}`,
      },
    ],
    temperature: 0.5,
    maxTokens: 20,
  });

  const title = response.choices?.[0]?.message?.content;
  return typeof title === "string" ? title.trim() : "My Flashcard Deck";
}
