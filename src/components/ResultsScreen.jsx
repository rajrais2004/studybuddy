import { useMemo } from 'react';
import './ResultsScreen.css';

export default function ResultsScreen({ results, onRetakeWrong, onStartOver }) {
  const { score, total, answers } = results;
  const percentage = Math.round((score / total) * 100);

  const missedQuestions = useMemo(() =>
    answers.filter(a => !a.isCorrect),
    [answers]
  );

  // Score category for styling
  const scoreCategory = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : percentage >= 40 ? 'fair' : 'needs-work';

  const scoreEmoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪';
  const scoreMessage = percentage >= 80
    ? 'Excellent work!'
    : percentage >= 60
    ? 'Good job! Keep studying.'
    : percentage >= 40
    ? 'Not bad, but review the missed questions.'
    : 'Keep at it! Review the material and try again.';

  return (
    <div className="results-screen">
      {/* Score circle */}
      <div className="results-screen__score-section">
        <div className={`results-screen__score-circle results-screen__score-circle--${scoreCategory}`}>
          <svg viewBox="0 0 120 120" className="results-screen__score-ring">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              opacity="0.15"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
              className="results-screen__score-ring-fill"
            />
          </svg>
          <div className="results-screen__score-value">
            <span className="results-screen__score-emoji">{scoreEmoji}</span>
            <span className="results-screen__score-number">{percentage}%</span>
            <span className="results-screen__score-fraction">{score}/{total} correct</span>
          </div>
        </div>
        <p className="results-screen__score-message">{scoreMessage}</p>
      </div>

      {/* Missed questions */}
      {missedQuestions.length > 0 && (
        <div className="results-screen__missed">
          <h3 className="results-screen__missed-title">
            Questions to Review ({missedQuestions.length})
          </h3>
          <div className="results-screen__missed-list">
            {missedQuestions.map((a, i) => (
              <div key={i} className="results-screen__missed-item">
                <div className="results-screen__missed-question">
                  <span className="results-screen__missed-number">Q{answers.indexOf(a) + 1}</span>
                  {a.question.question}
                </div>
                <div className="results-screen__missed-answers">
                  <div className="results-screen__missed-wrong">
                    <span className="results-screen__missed-label">Your answer:</span>
                    {a.question.options[a.selectedIndex]}
                  </div>
                  <div className="results-screen__missed-correct">
                    <span className="results-screen__missed-label">Correct:</span>
                    {a.question.options[a.question.correctIndex]}
                  </div>
                </div>
                <p className="results-screen__missed-explanation">
                  💡 {a.question.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="results-screen__actions">
        {missedQuestions.length > 0 && (
          <button
            className="results-screen__retake-btn"
            onClick={onRetakeWrong}
            id="retake-wrong-btn"
          >
            🔄 Retake Wrong Answers Only
          </button>
        )}
        <button
          className="results-screen__start-over-btn"
          onClick={onStartOver}
          id="start-over-btn"
        >
          📝 New Study Set
        </button>
      </div>
    </div>
  );
}
