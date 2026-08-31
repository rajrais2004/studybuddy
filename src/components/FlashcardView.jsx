import { useState, useEffect, useCallback, useRef } from 'react';
import './FlashcardView.css';

export default function FlashcardView({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const containerRef = useRef(null);

  // Touch/swipe state
  const touchStartRef = useRef(null);
  const touchDeltaRef = useRef(0);

  const card = flashcards[currentIndex];
  const total = flashcards.length;

  // Reset flip when navigating to a new card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const flip = useCallback(() => {
    setIsFlipped(f => !f);
  }, []);

  const toggleKnown = useCallback(() => {
    setKnownCards(prev => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else {
        next.add(card.id);
      }
      return next;
    });
  }, [card?.id]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goPrev();
          break;
        case ' ':
          e.preventDefault();
          flip();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, flip]);

  // Touch/swipe handlers for mobile navigation
  function handleTouchStart(e) {
    touchStartRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
  }

  function handleTouchMove(e) {
    if (touchStartRef.current === null) return;
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
  }

  function handleTouchEnd() {
    const delta = touchDeltaRef.current;
    const threshold = 50; // minimum swipe distance in px

    if (Math.abs(delta) > threshold) {
      if (delta < 0) goNext();  // swipe left → next
      else goPrev();            // swipe right → prev
    }

    touchStartRef.current = null;
    touchDeltaRef.current = 0;
  }

  const isKnown = knownCards.has(card?.id);
  const knownCount = knownCards.size;
  const difficultyClass = `flashcard__difficulty--${card?.difficulty || 'medium'}`;

  return (
    <div className="flashcard-view">
      {/* Progress bar */}
      <div className="flashcard-view__progress-bar">
        <div
          className="flashcard-view__progress-fill"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flashcard-view__header">
        <span className="flashcard-view__counter">
          Card {currentIndex + 1} of {total}
        </span>
        <span className="flashcard-view__known-count">
          ✓ {knownCount} known
        </span>
      </div>

      {/* Card */}
      <div
        ref={containerRef}
        className="flashcard-container"
        onClick={flip}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Flashcard back side. Click or press space to flip.' : 'Flashcard front side. Click or press space to flip.'}
      >
        <div className={`flashcard ${isFlipped ? 'flashcard--flipped' : ''}`}>
          <div className="flashcard__face flashcard__front">
            <span className={`flashcard__difficulty ${difficultyClass}`}>
              {card?.difficulty}
            </span>
            <div className="flashcard__content">
              <p>{card?.front}</p>
            </div>
            <span className="flashcard__hint">Click or press Space to flip</span>
          </div>
          <div className="flashcard__face flashcard__back">
            <div className="flashcard__content">
              <p>{card?.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flashcard-view__controls">
        <button
          className="flashcard-view__nav-btn"
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          ← Prev
        </button>

        <button
          className={`flashcard-view__known-btn ${isKnown ? 'flashcard-view__known-btn--active' : ''}`}
          onClick={toggleKnown}
        >
          {isKnown ? '✓ Known' : '📌 Review Again'}
        </button>

        <button
          className="flashcard-view__nav-btn"
          onClick={goNext}
          disabled={currentIndex === total - 1}
          aria-label="Next card"
        >
          Next →
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="flashcard-view__hints">
        <span>← → Navigate</span>
        <span>Space Flip</span>
        <span>Swipe on mobile</span>
      </div>
    </div>
  );
}
