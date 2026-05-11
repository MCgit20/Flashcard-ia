# FlashAI — AI-Powered Flashcard Generator

Generate smart Q&A flashcards from any text or PDF using Mistral AI, with built-in spaced repetition (SM-2 algorithm) powered by Supabase.

## Features

- **AI Generation** — Paste text or upload a PDF; Mistral Large generates focused Q&A flashcards
- **Spaced Repetition** — SM-2 algorithm schedules reviews at optimal intervals
- **4-Level Rating** — Again / Hard / Good / Easy updates each card's schedule
- **Session Stats** — Track your performance at the end of each study session
- **Keyboard Shortcuts** — Space to flip, 1-4 to rate cards
- **Dark Editorial UI** — Built with Next.js 14, Tailwind CSS, and Framer Motion

---

## Stack

| Layer       | Tech                     |
|-------------|--------------------------|
| Frontend    | Next.js 14 (App Router)  |
| Styling     | Tailwind CSS             |
| AI          | Mistral API (mistral-large-latest) |
| Database    | Supabase (PostgreSQL)    |
| Algorithm   | SM-2 Spaced Repetition   |

---

## Prerequisites

- **Node.js v20+** — [Download here](https://nodejs.org/en/download) or use `nvm`:
  ```bash
  nvm install 20
  nvm use 20
  ```

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd flashcard-ai
npm install
```

### 2. Configure Supabase

1. Go to [supabase.com](https://supabase.com) → create a new project
2. Open the **SQL Editor**
3. Run the contents of `supabase-schema.sql`
4. Copy your project URL and keys from **Settings → API**

### 3. Configure Mistral AI

1. Go to [console.mistral.ai](https://console.mistral.ai) → create an API key
2. Copy the key

### 4. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
MISTRAL_API_KEY=your_mistral_api_key

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Usage

1. **Generate** — Paste text or upload a PDF, choose card count (5/10/15/20), click Generate
2. **Browse** — Click a deck to see all cards and their review schedule
3. **Review** — Hit "Review N cards" to start a study session
4. **Rate** — After flipping each card, rate it: Again / Hard / Good / Easy
5. **Repeat** — Cards you struggle with appear sooner; easy cards are scheduled further out

---

## Project Structure

```
flashcard-ai/
├── app/
│   ├── page.tsx                   # Home: input + deck list
│   ├── study/[deckId]/page.tsx    # Study mode
│   ├── api/
│   │   ├── generate/route.ts      # POST: generate cards via Mistral
│   │   ├── decks/route.ts         # GET/DELETE decks
│   │   └── flashcards/route.ts    # GET/PATCH flashcards + SM-2
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── mistral.ts                 # Mistral AI client + prompts
│   ├── supabase.ts                # Supabase client + types
│   └── spacedRepetition.ts        # SM-2 algorithm
├── supabase-schema.sql            # Database schema
└── .env.local.example
```

---

## SM-2 Algorithm

Each card tracks:
- **ease_factor** — how easy/difficult the card is (default 2.5)
- **interval** — days until next review
- **repetitions** — consecutive correct answers

After rating a card:
- **Again (0)** → resets to day 1
- **Hard (2)** → resets to day 1, lowers ease factor
- **Good (4)** → interval × ease factor, slight ease adjustment
- **Easy (5)** → interval × ease factor, increases ease factor

---

## Deployment

```bash
# Vercel (recommended)
npx vercel

# Or build locally
npm run build
npm start
```

Add your environment variables in the Vercel dashboard under Project → Settings → Environment Variables.
