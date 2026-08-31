import { useState, useEffect, useCallback } from 'react';
import './QuizView.css';

export default function QuizView({ questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]); // track all answers for results

  const question = questions[currentIndex];
  const total = questions.length;
  const isLastQuestion = currentIndex === total - 1;

  const handleSelect = useCallback((optionIndex) => {
    if (isRevealed) return; // prevent changing answer after reveal

    setSelectedOption(optionIndex);
    setIsRevealed(true);

    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setAnswers(prev => [...prev, {
      question: question,
      selectedIndex: optionIndex,
      isCorrect,
    }]);
  }, [isRevealed, question]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      // Quiz complete — send results up
      onComplete({
        score: score,
        total: total,
        answers: answers,
        questions: questions,
      });
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsRevealed(false);
    }
  }, [isLastQuestion, onComplete, score, total, answers, questions, currentIndex]);

  // Number key shortcuts (1-4) to select options
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        e.preventDefault();
        handleSelect(num - 1);
      }

      if (e.key === 'Enter' && isRevealed) {
        e.preventDefault();
        handleNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelect, handleNext, isRevealed]);

  return (
    <div className="quiz-view">
      {/* Progress bar */}
      <div className="quiz-view__progress-bar">
        <div
          className="quiz-view__progress-fill"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div className="quiz-view__header">
        <span className="quiz-view__counter">
          Question {currentIndex + 1} of {total}
        </span>
        <span className="quiz-view__score">
          Score: {score}/{currentIndex + (isRevealed ? 1 : 0)}
        </span>
      </div>

      {/* Question */}
      <div className="quiz-view__question-card" key={question?.id}>
        <h2 className="quiz-view__question-text">{question?.question}</h2>

        <div className="quiz-view__options">
          {question?.options.map((option, i) => {
            let optionClass = 'quiz-view__option';

            if (isRevealed) {
              if (i === question.correctIndex) {
                optionClass += ' quiz-view__option--correct';
              } else if (i === selectedOption && i !== question.correctIndex) {
                optionClass += ' quiz-view__option--incorrect';
              } else {
                optionClass += ' quiz-view__option--dimmed';
              }
            } else if (i === selectedOption) {
              optionClass += ' quiz-view__option--selected';
            }

            return (
              <button
                key={i}
                className={optionClass}
                onClick={() => handleSelect(i)}
                disabled={isRevealed}
                id={`quiz-option-${i}`}
              >
                <span className="quiz-view__option-number">{i + 1}</span>
                <span className="quiz-view__option-text">{option}</span>
                {isRevealed && i === question.correctIndex && (
                  <span className="quiz-view__option-icon">✓</span>
                )}
                {isRevealed && i === selectedOption && i !== question.correctIndex && (
                  <span className="quiz-view__option-icon">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation (shown after answering) */}
        {isRevealed && (
          <div className={`quiz-view__explanation ${selectedOption === question.correctIndex ? 'quiz-view__explanation--correct' : 'quiz-view__explanation--incorrect'}`}>
            <div className="quiz-view__explanation-header">
              {selectedOption === question.correctIndex ? '🎉 Correct!' : '❌ Incorrect'}
            </div>
            <p>{question.explanation}</p>
          </div>
        )}

        {/* Next / Finish button */}
        {isRevealed && (
          <button
            className="quiz-view__next-btn"
            onClick={handleNext}
          >
            {isLastQuestion ? '🏁 See Results' : 'Next Question →'}
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="quiz-view__hints">
        <span>1-4 Select answer</span>
        <span>Enter Next question</span>
      </div>
    </div>
  );
}
