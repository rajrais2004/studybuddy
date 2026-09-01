import { repairAndParse } from '../server/jsonRepair.js';
import { validateStudySet } from '../server/validateStudySet.js';

console.log('--- Testing jsonRepair ---');

// Test 1: Markdown fences + trailing comma
const raw1 = `\`\`\`json
{
  "topic": "Test Topic",
  "flashcards": [
    { "id": "fc1", "front": "Q1?", "back": "A1!", "difficulty": "easy" },
  ],
  "quiz": [
    { "id": "q1", "question": "What is X?", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "Because A" },
  ],
}
\`\`\``;

const parsed1 = repairAndParse(raw1);
console.log('✓ Repair test 1 passed:', parsed1.topic === 'Test Topic');

const val1 = validateStudySet(parsed1);
console.log('✓ Validation test 1 passed:', val1.valid);

// Test 2: Invalid correctIndex rejection
const invalidData = {
  topic: 'Bad Quiz',
  flashcards: [{ id: 'fc1', front: 'F', back: 'B', difficulty: 'easy' }],
  quiz: [{ id: 'q1', question: 'Q', options: ['A', 'B', 'C', 'D'], correctIndex: 5, explanation: 'Exp' }]
};

const val2 = validateStudySet(invalidData);
console.log('✓ Validation test 2 (invalid index detection):', val2.valid === false && val2.errors.some(e => e.includes('invalid correct answer index')));

console.log('--- All backend utility checks passed! ---');
