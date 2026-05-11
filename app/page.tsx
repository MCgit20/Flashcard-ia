"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Sparkles,
  Upload,
  FileText,
  BookOpen,
  Trash2,
  ChevronRight,
  Brain,
  Layers,
  Clock,
} from "lucide-react";
import type { Deck } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cardCount, setCardCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [activeTab, setActiveTab] = useState<"text" | "pdf">("text");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted[0]) {
        setFile(accepted[0]);
        setActiveTab("pdf");
      }
    },
  });

  useEffect(() => {
    fetchDecks();
  }, []);

  async function fetchDecks() {
    try {
      const res = await fetch("/api/decks");
      const data = await res.json();
      setDecks(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to load decks");
    } finally {
      setLoadingDecks(false);
    }
  }

  async function handleGenerate() {
    if (!text.trim() && !file) {
      toast.error("Please enter some text or upload a PDF");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Generating flashcards with AI...");

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      else formData.append("text", text);
      formData.append("count", cardCount.toString());

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Generated ${data.flashcards.length} flashcards!`, { id: toastId });
      setText("");
      setFile(null);
      fetchDecks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDeck(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this deck?")) return;
    await fetch(`/api/decks?id=${id}`, { method: "DELETE" });
    setDecks((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deck deleted");
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-mist px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-acid rounded flex items-center justify-center">
            <Brain className="w-5 h-5 text-ink" />
          </div>
          <span className="font-display text-2xl text-paper tracking-wide">FLASHAI</span>
        </div>
        <div className="flex items-center gap-2 text-paper/40 text-sm font-mono">
          <Layers className="w-4 h-4" />
          <span>{decks.length} decks</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="font-display text-6xl md:text-8xl text-paper leading-none mb-4">
            LEARN
            <span className="text-acid">.</span>
            <br />
            FASTER
            <span className="text-acid">.</span>
          </h1>
          <p className="text-paper/50 text-lg max-w-md font-light">
            Paste any text or drop a PDF. Mistral AI generates smart flashcards.
            Spaced repetition remembers when to study.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate rounded-lg w-fit">
              {(["text", "pdf"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-acid text-ink"
                      : "text-paper/60 hover:text-paper"
                  }`}
                >
                  {tab === "text" ? (
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Text
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" /> PDF
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Text input */}
            {activeTab === "text" && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your notes, article, textbook excerpt, or any content you want to learn..."
                className="w-full h-64 bg-slate border border-ghost rounded-xl p-4 text-paper placeholder-paper/25 font-body resize-none focus:outline-none focus:border-acid/50 transition-colors text-sm leading-relaxed"
              />
            )}

            {/* PDF dropzone */}
            {activeTab === "pdf" && (
              <div
                {...getRootProps()}
                className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-acid bg-acid/5"
                    : file
                    ? "border-acid/50 bg-acid/5"
                    : "border-ghost hover:border-paper/30"
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-acid mx-auto mb-3" />
                    <p className="text-paper font-medium">{file.name}</p>
                    <p className="text-paper/40 text-sm mt-1">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-3 text-paper/40 text-xs hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-paper/30 mx-auto mb-3" />
                    <p className="text-paper/60">Drop your PDF here</p>
                    <p className="text-paper/30 text-sm mt-1">or click to browse</p>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate border border-ghost rounded-lg px-4 py-2">
                <span className="text-paper/50 text-sm">Cards:</span>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCardCount(n)}
                    className={`w-8 h-8 rounded text-sm font-mono transition-all ${
                      cardCount === n
                        ? "bg-acid text-ink font-medium"
                        : "text-paper/50 hover:text-paper"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || (!text.trim() && !file)}
                className="flex-1 flex items-center justify-center gap-2 bg-acid text-ink font-medium py-3 px-6 rounded-lg hover:bg-acid/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {loading ? "Generating..." : "Generate Flashcards"}
              </button>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-paper/40 text-xs uppercase tracking-widest font-mono mb-4">
              How it works
            </h3>
            {[
              {
                icon: <FileText className="w-5 h-5" />,
                title: "Paste or Upload",
                desc: "Any text or PDF up to 8,000 characters",
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                title: "AI Generates",
                desc: "Mistral creates Q&A pairs from key concepts",
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: "Spaced Repetition",
                desc: "SM-2 algorithm schedules optimal reviews",
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: "Learn Efficiently",
                desc: "Rate cards: Again / Hard / Good / Easy",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate/50"
              >
                <div className="text-acid mt-0.5 shrink-0">{item.icon}</div>
                <div>
                  <p className="text-paper text-sm font-medium">{item.title}</p>
                  <p className="text-paper/40 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decks list */}
        {(loadingDecks || decks.length > 0) && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl text-paper tracking-wide">
                YOUR DECKS
              </h2>
              <span className="text-paper/30 text-sm font-mono">
                {decks.length} total
              </span>
            </div>

            {loadingDecks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-36 bg-slate rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck) => (
                  <div
                    key={deck.id}
                    onClick={() => router.push(`/study/${deck.id}`)}
                    className="group relative bg-slate border border-ghost rounded-xl p-5 cursor-pointer hover:border-acid/40 hover:bg-mist transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 bg-acid/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-acid" />
                      </div>
                      <button
                        onClick={(e) => handleDeleteDeck(deck.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-paper/30 hover:text-red-400 transition-all p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-paper font-medium text-sm leading-tight mb-1 line-clamp-2">
                      {deck.title}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-paper/40 text-xs font-mono">
                        {deck.card_count} cards
                      </span>
                      <div className="flex items-center gap-1 text-acid text-xs group-hover:gap-2 transition-all">
                        <span>Study</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
