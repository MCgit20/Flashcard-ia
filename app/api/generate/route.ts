import { NextRequest, NextResponse } from "next/server";
import { generateFlashcards, generateDeckTitle } from "@/lib/mistral";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;
    const cardCount = parseInt((formData.get("count") as string) || "10");

    let sourceText = "";

    if (file && file.type === "application/pdf") {
      // Parse PDF server-side
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      sourceText = data.text;
    } else if (text) {
      sourceText = text;
    } else {
      return NextResponse.json(
        { error: "No text or PDF provided" },
        { status: 400 }
      );
    }

    if (sourceText.trim().length < 50) {
      return NextResponse.json(
        { error: "Text is too short to generate flashcards" },
        { status: 400 }
      );
    }

    // Generate title and flashcards in parallel
    const [cards, title] = await Promise.all([
      generateFlashcards(sourceText, Math.min(cardCount, 20)),
      generateDeckTitle(sourceText),
    ]);

    // Save deck to Supabase
    const { data: deck, error: deckError } = await supabaseAdmin
      .from("decks")
      .insert({
        title,
        source_text: sourceText.slice(0, 5000),
      })
      .select()
      .single();

    if (deckError) throw deckError;

    // Save flashcards
    const { data: flashcards, error: cardsError } = await supabaseAdmin
      .from("flashcards")
      .insert(
        cards.map((card) => ({
          deck_id: deck.id,
          question: card.question,
          answer: card.answer,
        }))
      )
      .select();

    if (cardsError) throw cardsError;

    return NextResponse.json({
      deck,
      flashcards,
    });
  } catch (err) {
    console.error("Generate error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate flashcards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
