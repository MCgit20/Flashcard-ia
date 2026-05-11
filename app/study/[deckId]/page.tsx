"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Eye,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Calendar,
  Layers,
} from "lucide-react";
import type { Flashcard, Deck } from "@/lib/supabase";
import { RATING_LABELS, type Rating } from "@/lib/spacedRepetition";
import clsx from "clsx";

type StudyMode = "browse" | "review";

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [mode, setMode] = useState<StudyMode>("browse");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    fetchData();
  }, [deckId]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (mode !== "review" || sessionComplete) return;

    if (e.code === "Space" && !flipped) {
      e.preventDefault();
      setFlipped(true);
    }
    if (flipped) {
      const shortcuts: Record<string, Rating> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
      const rating = shortcuts[e.key];
      if (rating) handleRate(rating);
    }
  }, [mode, flipped, sessionComplete]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function fetchData() {
    try {
      const [deckRes, cardsRes, dueRes] = await Promise.all([
        fetch(`/api/decks?id=${deckId}`).then(r => r.json()),
        fetch(`/api/flashcards?deck_id=${deckId}`).then(r => r.json()),
        fetch(`/api/flashcards?deck_id=${deckId}&due=true`).then(r => r.json()),
      ]);

      setDeck(deckRes || null);
      setCards(Array.isArray(cardsRes) ? cardsRes : []);
      setDueCards(Array.isArray(dueRes) ? dueRes : []);
    } catch {
      toast.error("Failed to load deck");
    } finally {
      setLoading(false);
    }
  }

  async function handleRate(rating: Rating) {
    const card = dueCards[currentIndex];
    if (!card) return;

    try {
      await fetch("/api/flashcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, rating }),
      });

      setSessionStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

      if (currentIndex + 1 >= dueCards.length) {
        setSessionComplete(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
      }
    } catch {
      toast.error("Failed to save rating");
    }
  }

  function startReview() {
    if (dueCards.length === 0) {
      toast("No cards due for review!", { icon: "🎉" });
      return;
    }
    setMode("review");
    setCurrentIndex(0);
    setFlipped(false);
    setSessionComplete(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
  }

  function resetSession() {
    setSessionComplete(false);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    fetchData(); // Refresh due cards
  }

  const currentCard = dueCards[currentIndex];
  const progress = dueCards.length > 0 ? ((currentIndex) / dueCards.length) * 100 : 0;
  const totalReviewed = Object.values(sessionStats).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ghost border-t-acid rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-mist px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => mode === "review" ? setMode("browse") : router.push("/")}
          className="text-paper/50 hover:text-paper transition-colors flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {mode === "review" ? "Back to deck" : "All decks"}
        </button>
        {deck && (
          <>
            <span className="text-ghost">/</span>
            <span className="text-paper font-medium truncate">{deck.title}</span>
          </>
        )}
      </header>

      {mode === "browse" && (
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Deck stats */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-display text-5xl text-paper tracking-wide mb-2">
                {deck?.title?.toUpperCase()}
              </h1>
              <p className="text-paper/40 text-sm font-mono">
                {cards.length} cards total · {dueCards.length} due for review
              </p>
            </div>
            <button
              onClick={startReview}
              className={clsx(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                dueCards.length > 0
                  ? "bg-acid text-ink hover:bg-acid/90 animate-pulse-acid"
                  : "bg-slate text-paper/40 cursor-not-allowed"
              )}
            >
              <BookOpen className="w-5 h-5" />
              {dueCards.length > 0 ? `Review ${dueCards.length} cards` : "All caught up!"}
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: <Layers className="w-4 h-4" />, label: "Total", value: cards.length },
              { icon: <Calendar className="w-4 h-4" />, label: "Due today", value: dueCards.length },
              {
                icon: <CheckCircle2 className="w-4 h-4" />,
                label: "Reviewed",
                value: cards.filter((c) => c.last_reviewed).length,
              },
            ].map((stat, i) => (
              <div key={i} className="bg-slate rounded-xl p-4 border border-ghost">
                <div className="text-acid mb-2">{stat.icon}</div>
                <p className="font-display text-3xl text-paper">{stat.value}</p>
                <p className="text-paper/40 text-xs font-mono mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* All cards list */}
          <h2 className="text-paper/40 text-xs uppercase tracking-widest font-mono mb-4">
            All Cards
          </h2>
          <div className="space-y-2">
            {cards.map((card, i) => {
              const isDue = new Date(card.next_review) <= new Date();
              return (
                <div
                  key={card.id}
                  className="bg-slate border border-ghost rounded-xl p-4 flex items-start gap-4 hover:border-ghost/80 transition-colors"
                >
                  <span className="text-paper/20 font-mono text-xs w-6 shrink-0 pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-paper text-sm font-medium">{card.question}</p>
                    <p className="text-paper/40 text-xs mt-1 line-clamp-2">{card.answer}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={clsx(
                        "text-xs font-mono px-2 py-1 rounded",
                        isDue ? "bg-acid/15 text-acid" : "bg-ghost/30 text-paper/30"
                      )}
                    >
                      {isDue ? "DUE" : `${card.interval}d`}
                    </span>
                    <p className="text-paper/20 text-xs mt-1 font-mono">
                      ×{card.repetitions}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "review" && !sessionComplete && currentCard && (
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center text-xs font-mono text-paper/40 mb-2">
              <span>{currentIndex + 1} / {dueCards.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-ghost rounded-full overflow-hidden">
              <div
                className="h-full bg-acid rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Card */}
          <div className="card-flip-container mb-6">
            <div
              className={clsx("card-flip-inner relative", { flipped })}
              style={{ minHeight: "300px" }}
            >
              {/* Front */}
              <div
                className="card-face absolute inset-0 bg-slate border border-ghost rounded-2xl p-8 flex flex-col cursor-pointer hover:border-paper/20 transition-colors"
                onClick={() => !flipped && setFlipped(true)}
              >
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-mono text-paper/30 uppercase tracking-widest">
                    Question
                  </span>
                  <div className="flex-1 h-px bg-ghost" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-paper text-xl text-center leading-relaxed font-light">
                    {currentCard.question}
                  </p>
                </div>
                {!flipped && (
                  <div className="flex items-center justify-center gap-2 text-paper/25 text-sm mt-6">
                    <Eye className="w-4 h-4" />
                    <span>Click to reveal · Space</span>
                  </div>
                )}
              </div>

              {/* Back */}
              <div className="card-face card-back absolute inset-0 bg-mist border border-acid/30 rounded-2xl p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-mono text-acid/60 uppercase tracking-widest">
                    Answer
                  </span>
                  <div className="flex-1 h-px bg-acid/20" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-paper text-lg text-center leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          {flipped && (
            <div className="animate-slide-up">
              <p className="text-center text-paper/30 text-xs font-mono mb-4 uppercase tracking-widest">
                How well did you know it?
              </p>
              <div className="grid grid-cols-4 gap-3">
                {(Object.entries(RATING_LABELS) as [Rating, typeof RATING_LABELS[Rating]][]).map(
                  ([rating, { label, color, shortcut }]) => (
                    <button
                      key={rating}
                      onClick={() => handleRate(rating)}
                      className={clsx(
                        "py-3 px-2 rounded-xl border text-sm font-medium transition-all active:scale-95",
                        color
                      )}
                    >
                      <span className="block">{label}</span>
                      <span className="block text-xs opacity-50 font-mono mt-0.5">[{shortcut}]</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "review" && sessionComplete && (
        <div className="max-w-xl mx-auto px-6 py-20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-acid/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-acid" />
          </div>
          <h2 className="font-display text-5xl text-paper mb-3">SESSION DONE</h2>
          <p className="text-paper/40 mb-10">
            You reviewed {totalReviewed} cards in this session
          </p>

          {/* Session breakdown */}
          <div className="grid grid-cols-4 gap-3 mb-10">
            {(Object.entries(sessionStats) as [Rating, number][]).map(([rating, count]) => {
              const { label, color } = RATING_LABELS[rating];
              return (
                <div key={rating} className={clsx("rounded-xl p-4 border", color)}>
                  <p className="font-display text-3xl">{count}</p>
                  <p className="text-xs mt-1 opacity-70">{label}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={resetSession}
              className="flex items-center gap-2 bg-slate border border-ghost text-paper px-6 py-3 rounded-lg hover:border-paper/30 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Study again
            </button>
            <button
              onClick={() => setMode("browse")}
              className="bg-acid text-ink px-6 py-3 rounded-lg font-medium hover:bg-acid/90 transition-all"
            >
              Back to deck
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
