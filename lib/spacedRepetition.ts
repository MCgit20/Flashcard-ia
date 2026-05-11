/**
 * SM-2 Spaced Repetition Algorithm
 * Quality ratings: 0-5
 * 0 = complete blackout
 * 1 = incorrect, but upon seeing correct answer it felt familiar
 * 2 = incorrect, but the correct answer seemed easy to recall
 * 3 = correct, with serious difficulty
 * 4 = correct, after hesitation
 * 5 = perfect response
 */

export type SM2Result = {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
};

export function calculateSM2(
  quality: number, // 0-5
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
): SM2Result {
  let easeFactor = currentEaseFactor;
  let interval: number;
  let repetitions = currentRepetitions;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response — reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview };
}

// Map user-facing ratings to SM2 quality
export const RATING_MAP = {
  again: 0,   // Complete failure
  hard: 2,    // Incorrect but familiar
  good: 4,    // Correct with hesitation
  easy: 5,    // Perfect response
} as const;

export type Rating = keyof typeof RATING_MAP;

export const RATING_LABELS: Record<Rating, { label: string; color: string; shortcut: string }> = {
  again: { label: "Again", color: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30", shortcut: "1" },
  hard:  { label: "Hard",  color: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30", shortcut: "2" },
  good:  { label: "Good",  color: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30", shortcut: "3" },
  easy:  { label: "Easy",  color: "bg-acid/20 text-acid border-acid/30 hover:bg-acid/30", shortcut: "4" },
};
