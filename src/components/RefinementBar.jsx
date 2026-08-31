import { useState } from 'react';
import './RefinementBar.css';

export default function RefinementBar({ onRefine, isLoading }) {
  const [instruction, setInstruction] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!instruction.trim() || isLoading) return;
    onRefine(instruction.trim());
    setInstruction('');
  }

  return (
    <div className="refinement-bar">
      <form className="refinement-bar__form" onSubmit={handleSubmit}>
        <div className="refinement-bar__icon">✏️</div>
        <input
          type="text"
          className="refinement-bar__input"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='Refine: "make it harder", "add 3 more on X", "focus on dates"...'
          disabled={isLoading}
          id="refinement-input"
        />
        <button
          type="submit"
          className="refinement-bar__btn"
          disabled={!instruction.trim() || isLoading}
          id="refine-button"
        >
          {isLoading ? (
            <span className="refinement-bar__spinner" />
          ) : (
            'Refine'
          )}
        </button>
      </form>
    </div>
  );
}
