# 💡 StudyBuddy — AI-Powered Flashcard & Quiz Assistant

StudyBuddy is a full-stack web application that transforms study notes or topics into structured interactive flashcards and multiple-choice quizzes using an LLM with strict JSON-mode structured output.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- A free Groq API key (get one at [console.groq.com/keys](https://console.groq.com/keys))

### 2. Setup & Installation
```bash
npm install
cp .env.example .env
```

Open `.env` and set your key:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
PORT=3001
```

### 3. Run Development Mode
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) (Vite will pick the next available port if this one is busy).

### 4. Run Production Server
```bash
npm run build
npm start
```

---

## 🛠️ Architecture & Core Features

1. **Structured JSON output** — the model is prompted to return only JSON matching a fixed schema (`topic`, `flashcards`, `quiz`), using the provider's JSON-mode response format. The API key is proxied through the Express backend and never reaches the client.
2. **Defense-in-depth validation & JSON repair** — `server/jsonRepair.js` strips markdown fences and repairs common malformed-JSON issues; `validateStudySet.js` (server and client) checks required fields, array lengths, and option bounds before rendering.
3. **Stale-response protection (`useAbortableRequest.js`)** — an AbortController paired with a monotonically increasing request ID ensures an old in-flight request can never overwrite a newer one.
4. **In-place refinement (`POST /api/refine`)** — sends the current study set plus a follow-up instruction back to the model to update it without regenerating from scratch.
5. **Flashcard/Quiz UI** — flip animation, keyboard and swipe navigation, running score, "Retake Wrong Answers Only," and a dark/light theme toggle.

---

## 📂 Project Structure

(unchanged from your current version — this part is accurate)

---

## 🤖 AI Usage Note & Disclosure

I used Antigravity (Claude-based agent) to scaffold and generate most of this project from a detailed spec I wrote — including the component structure, the JSON-repair/validation approach, the abort-controller/request-ID pattern for stale-response protection, and the failure-handling requirements. I did not hand-write most of this code myself; I specified the requirements and architecture at a high level (e.g., "use an AbortController keyed to a request ID to prevent stale responses," "validate schema server- and client-side," "handle malformed JSON, timeouts, and rate limits distinctly") and reviewed/debugged the generated output.

Where I did the real work myself: diagnosing and fixing a live infrastructure issue during development — Google recently began issuing a new API key format (`AQ.` "Authentication Keys") that isn't accepted by the standard Gemini REST endpoint used by the older `@google/generative-ai` SDK, even with a correctly configured, freshly created, properly restricted key. I traced this through backend logs, verified it against Google's own developer forum reports of the same issue, tried the newer `@google/genai` SDK, and ultimately switched the project to Groq's API when the Gemini auth issue remained unresolved. I also debugged a Groq model deprecation (`llama-3.3-70b-versatile` was retired) by checking Groq's current model list and switching to `openai/gpt-oss-120b`.

I reviewed the generated code, understand how each piece works, and can walk through and extend it.

---

## ⏱️ Time Spent & Known Limitations

- **Time spent**: [fill in your honest total — this took well over the target 8 hours once the Gemini/Groq infrastructure debugging is included; say so plainly, e.g. "~X hours, including several hours diagnosing an external API key-format issue unrelated to the app's own code"]
- **Known limitations**:
  - Switched from Gemini to Groq mid-build due to a live Google API key-format transition (`AIza` → `AQ.` keys) that caused authentication failures against the Gemini REST endpoint — documented in commit history / can discuss in detail.
  - No persistent storage — study sets live in React state for the session only; a refresh returns to the input screen.
  - Free-tier rate limits apply on Groq; a 429 surfaces a clear retry message to the user.
