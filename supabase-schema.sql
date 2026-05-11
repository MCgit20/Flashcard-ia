-- Run this in your Supabase SQL editor

-- Decks table
CREATE TABLE decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source_text TEXT,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  -- SM-2 spaced repetition fields
  ease_factor FLOAT DEFAULT 2.5,
  interval INTEGER DEFAULT 1,        -- days until next review
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review);

-- Auto-update deck card_count
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET card_count = card_count + 1, updated_at = NOW() WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET card_count = card_count - 1, updated_at = NOW() WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deck_card_count
AFTER INSERT OR DELETE ON flashcards
FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- Grant permissions to service role (for API operations)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON public.decks TO service_role;
GRANT ALL PRIVILEGES ON public.flashcards TO service_role;
GRANT EXECUTE ON FUNCTION update_deck_card_count() TO service_role;

-- Enable Row Level Security
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Allow all operations without authentication (for public API)
CREATE POLICY "Allow all on decks" ON decks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on flashcards" ON flashcards FOR ALL USING (true) WITH CHECK (true);
