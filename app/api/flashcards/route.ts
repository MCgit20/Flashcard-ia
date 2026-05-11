import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateSM2, RATING_MAP, type Rating } from "@/lib/spacedRepetition";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/flashcards?deck_id=xxx&due=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deckId = searchParams.get("deck_id");
  const dueOnly = searchParams.get("due") === "true";

  if (!deckId) {
    return NextResponse.json({ error: "Missing deck_id" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("flashcards")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at");

  if (dueOnly) {
    query = query.lte("next_review", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/flashcards — update SM-2 after review
export async function PATCH(req: NextRequest) {
  const { cardId, rating } = await req.json() as { cardId: string; rating: Rating };

  // Fetch current card state
  const { data: card, error: fetchError } = await supabaseAdmin
    .from("flashcards")
    .select("ease_factor, interval, repetitions")
    .eq("id", cardId)
    .single();

  if (fetchError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const quality = RATING_MAP[rating];
  const result = calculateSM2(
    quality,
    card.ease_factor,
    card.interval,
    card.repetitions
  );

  const { error: updateError } = await supabaseAdmin
    .from("flashcards")
    .update({
      ease_factor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      next_review: result.nextReview.toISOString(),
      last_reviewed: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ...result, nextReview: result.nextReview.toISOString() });
}
