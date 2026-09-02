# 💡 StudyBuddy — AI-Powered Flashcard & Quiz Assistant

**🌐 Live Demo:** https://studybuddy-nj5y.onrender.com/

StudyBuddy turns study notes or topics into interactive flashcards and multiple-choice quizzes, using an LLM constrained to strict JSON output so the UI renders real interactive components — never a chat window.

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, a free Groq API key ([console.groq.com/keys](https://console.groq.com/keys))

```bash
npm install
cp .env.example .env
```

Set your key in `.env`:

```env
GROQ_API_KEY=your_actual_groq_api_key_here
PORT=3001
```

```bash
npm run dev
```

Open the local URL Vite prints (defaults to http://localhost:5173).

**Production build:**

```bash
npm run build
npm start
```

---

## 🛠️ Architecture & Core Features

1. **Structured JSON output** — the model returns only JSON matching a fixed schema (`topic`, `flashcards`, `quiz`) via the provider's JSON-mode. The API key stays server-side, proxied through Express, and never reaches the browser.
2. **Defense-in-depth validation & repair** — `server/jsonRepair.js` strips markdown fences and fixes common malformed-JSON patterns before parsing; `validateStudySet.js` (server and client) checks required fields, array lengths, and option-index bounds before anything renders.
3. **Stale-response protection** — `useAbortableRequest.js` pairs an `AbortController` with a monotonically increasing request ID, so an older in-flight request can never overwrite a newer one.
4. **In-place refinement** — `POST /api/refine` sends the current study set plus a follow-up instruction ("make it harder") back to the model and updates the set without a full regeneration.
5. **Flashcard/Quiz UI** — flip animation, keyboard and swipe navigation, running score, "Retake Wrong Answers Only," dark/light theme.

---

## 📂 Project Structure

```text
flamai/
├── server/
│   ├── index.js
│   ├── routes.js
│   ├── geminiClient.js
│   ├── jsonRepair.js
│   └── validateStudySet.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── components/
│   │   ├── InputScreen.jsx
│   │   ├── FlashcardView.jsx
│   │   ├── QuizView.jsx
│   │   ├── ResultsScreen.jsx
│   │   ├── RefinementBar.jsx
│   │   ├── ErrorBanner.jsx
│   │   ├── LoadingState.jsx
│   │   └── ThemeToggle.jsx
│   ├── hooks/
│   │   └── useAbortableRequest.js
│   └── utils/
│       ├── apiClient.js
│       └── validateStudySet.js
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 🤖 AI Usage Note

I built this with Antigravity (an agentic coding assistant) from a detailed technical specification I wrote — including the failure-handling requirements (stale-response protection via abort-controller + request ID, server- and client-side JSON validation, distinct error handling per failure type, exponential backoff), component breakdown, and API design. I directed the architecture and requirements; the agent implemented them.

The engineering work on my end was diagnosing problems the agent couldn't solve for me: partway through the build, Google began issuing a new Gemini API key format (`AQ.` "Authentication Keys") that fails against the standard REST endpoint used by the Gemini SDK. I confirmed this by reading backend error logs, cross-checking Google's developer forums, and testing two different SDKs, before switching the project to Groq's API. I also hit and fixed a Groq model deprecation (`llama-3.3-70b-versatile` had been retired) by checking their current model list and repointing the client.

I reviewed the generated code end-to-end, understand each module's logic, and can explain, debug, or extend any part of it.

---

## ⏱️ Time Spent & Known Limitations

* **Time spent:** ~2-3 hours, including diagnosing and resolving the Gemini→Groq API migration issue described above.
* **Known limitations:**

  * Originally built against Gemini; switched to Groq mid-build due to the API key-format issue above (see AI Usage Note).
  * No persistent storage — study sets live in React state for the session; a refresh returns to the input screen.
  * Free-tier rate limits apply on Groq; a 429 shows a clear retry message rather than failing silently.

```
