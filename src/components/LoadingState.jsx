import './LoadingState.css';

export default function LoadingState({ elapsedMs = 0, onCancel, message = 'Generating study set...' }) {
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const isTakingLonger = elapsedSec >= 10;
  const isNearTimeout = elapsedSec >= 18;

  return (
    <div className="loading-state">
      <div className="loading-state__card">
        <div className="loading-state__spinner-outer">
          <div className="loading-state__spinner" />
          <div className="loading-state__sparkle">✨</div>
        </div>

        <h3 className="loading-state__title">{message}</h3>

        <p className="loading-state__status">
          {!isTakingLonger && 'Analyzing your notes and crafting structured flashcards & quiz...'}
          {isTakingLonger && !isNearTimeout && '⚡ Taking longer than expected... hanging tight!'}
          {isNearTimeout && '⏳ Still processing... almost at timeout threshold.'}
        </p>

        <div className="loading-state__timer">
          Elapsed: {elapsedSec}s
        </div>

        {isTakingLonger && onCancel && (
          <button className="loading-state__cancel-btn" onClick={onCancel}>
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
}
