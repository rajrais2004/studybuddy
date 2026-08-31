import { useState } from 'react';
import './InputScreen.css';

const EXAMPLE_TOPICS = [
  { label: '🌿 Photosynthesis', text: 'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll. It involves the conversion of carbon dioxide and water into glucose and oxygen. The process occurs in two stages: the light-dependent reactions and the Calvin cycle (light-independent reactions). Key components include chloroplasts, thylakoids, stroma, NADPH, and ATP.' },
  { label: '🏛️ French Revolution', text: 'The French Revolution (1789-1799) was a period of radical political and societal change in France. It began with the Estates General of 1789 and ended with the coup of Napoleon Bonaparte. Key events include the storming of the Bastille, the Declaration of the Rights of Man, the Reign of Terror led by Robespierre, and the rise of Napoleon. Important concepts: Enlightenment ideals, the three estates, the National Assembly, Jacobins vs Girondins.' },
  { label: '⚡ JavaScript Closures', text: 'A closure in JavaScript is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned. Closures are created every time a function is created. They are used for data privacy, function factories, partial application, and maintaining state in asynchronous operations. Key concepts: lexical scoping, the scope chain, variable lifetime, memory implications, and common patterns like IIFE and module pattern.' },
  { label: '❤️ Circulatory System', text: 'The human circulatory system consists of the heart, blood vessels, and blood. The heart has four chambers: right atrium, right ventricle, left atrium, and left ventricle. Blood flows through two circuits: pulmonary (heart to lungs and back) and systemic (heart to body and back). Key concepts include arteries, veins, capillaries, blood pressure, cardiac cycle, and the role of hemoglobin in oxygen transport.' },
];

export default function InputScreen({ onGenerate, isLoading }) {
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const charCount = notes.trim().length;
  const isValid = charCount >= 10;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) {
      setValidationError('Please enter at least 10 characters to generate a study set.');
      return;
    }
    setValidationError('');
    onGenerate(notes.trim());
  }

  function handleChipClick(text) {
    setNotes(text);
    setValidationError('');
  }

  function handleNotesChange(e) {
    setNotes(e.target.value);
    if (validationError && e.target.value.trim().length >= 10) {
      setValidationError('');
    }
  }

  return (
    <div className="input-screen">
      <div className="input-screen__hero">
        <div className="input-screen__icon">📚</div>
        <h1 className="input-screen__title">StudyBuddy</h1>
        <p className="input-screen__subtitle">
          Turn your notes into interactive flashcards and quizzes powered by AI
        </p>
      </div>

      <form className="input-screen__form" onSubmit={handleSubmit}>
        <div className="input-screen__textarea-wrapper">
          <textarea
            id="notes-input"
            className={`input-screen__textarea ${validationError ? 'input-screen__textarea--error' : ''}`}
            placeholder="Paste your study notes, describe a topic, or click an example below..."
            value={notes}
            onChange={handleNotesChange}
            rows={6}
            disabled={isLoading}
          />
          <div className="input-screen__textarea-footer">
            {validationError && (
              <span className="input-screen__validation-error">{validationError}</span>
            )}
            <span className={`input-screen__char-count ${charCount > 0 && !isValid ? 'input-screen__char-count--warning' : ''}`}>
              {charCount} character{charCount !== 1 ? 's' : ''}
              {charCount > 0 && !isValid && ' (min 10)'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          id="generate-button"
          className="input-screen__generate-btn"
          disabled={isLoading || !isValid}
        >
          {isLoading ? (
            <>
              <span className="input-screen__spinner" />
              Generating...
            </>
          ) : (
            <>
              <span className="input-screen__btn-icon">✨</span>
              Generate Study Set
            </>
          )}
        </button>
      </form>

      <div className="input-screen__examples">
        <p className="input-screen__examples-label">Or try an example:</p>
        <div className="input-screen__chips">
          {EXAMPLE_TOPICS.map((topic) => (
            <button
              key={topic.label}
              type="button"
              className="input-screen__chip"
              onClick={() => handleChipClick(topic.text)}
              disabled={isLoading}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
