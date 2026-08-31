import { useState, useCallback } from 'react';
import InputScreen from './components/InputScreen';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import ResultsScreen from './components/ResultsScreen';
import RefinementBar from './components/RefinementBar';
import ErrorBanner from './components/ErrorBanner';
import LoadingState from './components/LoadingState';
import ThemeToggle from './components/ThemeToggle';

import { useAbortableRequest } from './hooks/useAbortableRequest';
import { generateStudySet as apiGenerate, refineStudySet as apiRefine } from './utils/apiClient';
import { validateStudySet } from './utils/validateStudySet';

import './App.css';

export default function App() {
  // Views: 'input' | 'flashcards' | 'quiz' | 'results'
  const [activeTab, setActiveTab] = useState('flashcards');

  // Active study set data
  const [studySet, setStudySet] = useState(null);

  // Active quiz data for current quiz session (may be a full quiz or retake subset)
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);

  // Quiz results stored for ResultsScreen
  const [quizResults, setQuizResults] = useState(null);

  // Abortable request hook for stale-response protection
  const { execute, abort, isLoading, error, setError, elapsedMs } = useAbortableRequest();

  // Active action description for loading UI
  const [loadingMessage, setLoadingMessage] = useState('Generating study set...');

  /**
   * Handle primary "Generate Study Set" action from InputScreen.
   */
  const handleGenerate = useCallback(async (notes) => {
    setLoadingMessage('Generating study set with Gemini AI...');

    const result = await execute(async (signal) => {
      return await apiGenerate(notes, signal);
    });

    if (result) {
      // Validate client side before accepting
      const validation = validateStudySet(result);
      if (!validation.valid) {
        // Formulate readable error
        const err = new Error(validation.errors.join(' '));
        err.type = 'SCHEMA_VALIDATION';
        throw err;
      }

      setStudySet(result);
      setActiveQuizQuestions(result.quiz);
      setQuizResults(null);
      setActiveTab('flashcards');
    }
  }, [execute]);

  /**
   * Handle follow-up refinement from RefinementBar.
   */
  const handleRefine = useCallback(async (instruction) => {
    if (!studySet) return;
    setLoadingMessage(`Refining study set: "${instruction}"...`);

    const result = await execute(async (signal) => {
      return await apiRefine(studySet, instruction, signal);
    });

    if (result) {
      const validation = validateStudySet(result);
      if (!validation.valid) {
        const err = new Error(validation.errors.join(' '));
        err.type = 'SCHEMA_VALIDATION';
        throw err;
      }

      setStudySet(result);
      setActiveQuizQuestions(result.quiz);
      setQuizResults(null);
    }
  }, [studySet, execute]);

  /**
   * Handle quiz completion -> switch to results view.
   */
  const handleQuizComplete = useCallback((results) => {
    setQuizResults(results);
    setActiveTab('results');
  }, []);

  /**
   * Handle "Retake Wrong Answers Only" without new API call.
   */
  const handleRetakeWrong = useCallback(() => {
    if (!quizResults) return;

    const missedQuestions = quizResults.answers
      .filter(a => !a.isCorrect)
      .map(a => a.question);

    if (missedQuestions.length > 0) {
      setActiveQuizQuestions(missedQuestions);
      setQuizResults(null);
      setActiveTab('quiz');
    }
  }, [quizResults]);

  /**
   * Start fresh notes input.
   */
  const handleStartOver = useCallback(() => {
    abort();
    setStudySet(null);
    setQuizResults(null);
    setActiveTab('input');
  }, [abort]);

  const handleDismissError = useCallback(() => {
    if (setError) setError(null);
  }, [setError]);

  const hasStudySet = Boolean(studySet);

  return (
    <div className="app">
      {/* Top Header */}
      <header className="app__header">
        <div className="app__header-brand" onClick={handleStartOver} role="button" tabIndex={0}>
          <span className="app__header-logo">💡</span>
          <span className="app__header-title">StudyBuddy</span>
        </div>

        {hasStudySet && (
          <div className="app__header-topic">
            <span className="app__topic-badge">Topic:</span>
            <span className="app__topic-text" title={studySet.topic}>{studySet.topic}</span>
          </div>
        )}

        <div className="app__header-actions">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="app__main">
        {/* Persistent Error Banner */}
        <ErrorBanner
          error={error}
          onDismiss={handleDismissError}
          onRetry={() => {
            handleDismissError();
            if (!hasStudySet) {
              const notesInput = document.getElementById('notes-input');
              if (notesInput && notesInput.value) {
                handleGenerate(notesInput.value);
              }
            }
          }}
        />

        {/* Global Loading Overlay / Screen */}
        {isLoading ? (
          <LoadingState
            elapsedMs={elapsedMs}
            onCancel={abort}
            message={loadingMessage}
          />
        ) : !hasStudySet ? (
          /* Empty State / Input Screen */
          <InputScreen
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />
        ) : (
          /* Active Study Set Workspace */
          <div className="app__workspace">
            {/* View Navigation Tabs */}
            <nav className="app__nav-tabs">
              <button
                className={`app__tab ${activeTab === 'flashcards' ? 'app__tab--active' : ''}`}
                onClick={() => setActiveTab('flashcards')}
                id="tab-flashcards"
              >
                🎴 Flashcards ({studySet.flashcards.length})
              </button>
              <button
                className={`app__tab ${activeTab === 'quiz' ? 'app__tab--active' : ''}`}
                onClick={() => {
                  setActiveQuizQuestions(studySet.quiz);
                  setQuizResults(null);
                  setActiveTab('quiz');
                }}
                id="tab-quiz"
              >
                ❓ Quiz ({activeQuizQuestions.length})
              </button>
              {quizResults && (
                <button
                  className={`app__tab ${activeTab === 'results' ? 'app__tab--active' : ''}`}
                  onClick={() => setActiveTab('results')}
                  id="tab-results"
                >
                  🏆 Score ({quizResults.score}/{quizResults.total})
                </button>
              )}
              <button
                className="app__tab app__tab--new"
                onClick={handleStartOver}
                id="tab-new-set"
              >
                ➕ New Set
              </button>
            </nav>

            {/* Active Component */}
            <div className="app__content">
              {activeTab === 'flashcards' && (
                <FlashcardView flashcards={studySet.flashcards} />
              )}

              {activeTab === 'quiz' && (
                <QuizView
                  key={activeQuizQuestions.map(q => q.id).join('-')}
                  questions={activeQuizQuestions}
                  onComplete={handleQuizComplete}
                />
              )}

              {activeTab === 'results' && quizResults && (
                <ResultsScreen
                  results={quizResults}
                  onRetakeWrong={handleRetakeWrong}
                  onStartOver={handleStartOver}
                />
              )}
            </div>

            {/* Bottom Refinement Bar */}
            <footer className="app__footer">
              <RefinementBar onRefine={handleRefine} isLoading={isLoading} />
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
