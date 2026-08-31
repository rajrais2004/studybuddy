# 💡 StudyBuddy — AI-Powered Flashcard & Quiz Assistant

StudyBuddy is a full-stack web application that transforms study notes, articles, or lecture transcripts into structured interactive flashcards and multiple-choice quizzes using Google's **Gemini 2.0 Flash** model via native API JSON mode.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- A Google Gemini API key (Get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey))

### 2. Setup & Installation
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Open `.env` and set your API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
```

### 3. Run Development Mode
```bash
# Starts both Express backend (port 3001) and Vite dev server (port 5173)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Production Server
```bash
# Build frontend bundle
npm run build

# Start production server (serves both API and static UI)
npm start
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🛠️ Architecture & Core Features

### Key Technical Highlights

1. **Native Gemini JSON Schema (`responseSchema`)**
   - LLM calls use `generationConfig.responseMimeType: "application/json"` and an explicit OpenAPI JSON schema defining `topic`, `flashcards` (8-12 cards with difficulty levels), and `quiz` (5-8 questions with 4 options and correct answer index).
   - Gemini API key is securely proxied through the Express server and never reaches the client.

2. **Defense-in-Depth Validation & JSON Repair Layer**
   - **`server/jsonRepair.js`**: Strips markdown code fences (` ```json ... ``` `), cleans trailing commas, and handles unescaped control characters before parsing.
   - **`server/validateStudySet.js` & `src/utils/validateStudySet.js`**: Both server and client validate array lengths, option bounds `[0,3]`, required fields, and difficulty enums. Rejects malformed or incomplete output cleanly with human-readable error messages.

3. **Stale-Response & Abort Protection (`useAbortableRequest.js`)**
   - Manages an `AbortController` coupled with a monotonically increasing request ID.
   - Any new generation or refinement request immediately aborts previous in-flight HTTP calls.
   - Late-resolving responses from aborted/superseded requests are discarded by ID check, rendering race conditions impossible.

4. **In-Place Refinement (`POST /api/refine`)**
   - A dedicated refinement bar passes the active study set JSON and user instruction ("make it harder", "add 3 cards on X") back to Gemini to update the set in-place without starting from scratch.

5. **Interactive UI & Accessibility**
   - **Flashcard View**: 3D flip card animation, keyboard navigation (`Space` to flip, `←` `→` to navigate), mobile touch/swipe support, and per-card "Known / Review Again" tracking.
   - **Quiz View**: Keyboard shortcuts (`1-4` to choose, `Enter` to advance), immediate feedback with explanation reveal, and running score tracking.
   - **Results & Retake**: Detailed breakdown of missed questions and an instant **"Retake Wrong Answers Only"** option that re-runs the quiz without calling the API again.
   - **Theme System**: Dynamic light/dark theme toggled via CSS variables with `localStorage` persistence.

---

## 📂 Project Structure

```
flamai/
├── server/
│   ├── index.js              # Express entry point & static file server
│   ├── routes.js             # /api/generate & /api/refine routes with 20s timeout
│   ├── geminiClient.js       # Gemini API client with responseSchema
│   ├── jsonRepair.js         # Multi-step JSON repair utility
│   └── validateStudySet.js   # Server-side business rule schema validator
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Main state machine & workspace orchestrator
│   ├── App.css
│   ├── index.css             # Global CSS design system & theme variables
│   ├── components/
│   │   ├── InputScreen.jsx   # Textarea, char counter, example chips
│   │   ├── FlashcardView.jsx # 3D flip cards, swipe & keyboard nav
│   │   ├── QuizView.jsx      # Interactive quiz with 1-4 key support
│   │   ├── ResultsScreen.jsx # SVG score ring & retake wrong answers
│   │   ├── RefinementBar.jsx # In-place set updater
│   │   ├── ErrorBanner.jsx   # Per-type error messages with retry
│   │   ├── LoadingState.jsx  # Escalating loading status (10s/20s)
│   │   └── ThemeToggle.jsx   # Dark/light mode switcher
│   ├── hooks/
│   │   └── useAbortableRequest.js # Stale-response protection hook
│   └── utils/
│       ├── apiClient.js      # Client HTTP wrapper with exponential backoff
│       └── validateStudySet.js # Client-side defense-in-depth validator
├── index.html
├── vite.config.js            # Vite config with API proxy
├── package.json
├── .env.example
└── README.md
```

---

## 🤖 AI Usage Note & Disclosure

- **AI Assistance**: Used Antigravity AI agent to assist with rapid boilerplate generation, CSS variable scheme design, and drafting test cases for JSON repair edge cases.
- **Human Review & Design Decisions**:
  - Designed the dual-layer validation and JSON repair algorithm (`jsonRepair.js`).
  - Architecture choice for `useAbortableRequest`: combining `AbortController` with monotonically increasing request IDs to guarantee zero race conditions.
  - Formulated the exact `responseSchema` constraints and error classification scheme for HTTP 400, 422, 429, 502, and 504 status handling.
  - Tuned touch-swipe gesture thresholds and keydown event delegation in React.

---

## ⏱️ Time Spent & Known Limitations

- **Time Spent**: ~2.5 hours total (scaffolding, backend API, client state machine, component styling, error handling layer, and polish).
- **Known Limitations**:
  - **Free Tier Rate Limits**: Gemini 2.0 Flash free tier has a rate limit (RPM/TPM). If exceeded, HTTP 429 rate limit banner will pop up with clear instructions to wait.
  - **Local Persistence**: Study sets are maintained in React state during the session. Browser refresh returns to the input screen (intentional for privacy and simple setup).
