import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile('src/questions.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(code, context);

const questions = context.window.QUESTION_BANK;
if (!Array.isArray(questions)) throw new Error('QUESTION_BANK is not an array');
if (questions.length !== 150) throw new Error(`Expected 150 questions, got ${questions.length}`);

for (let test = 1; test <= 5; test += 1) {
  const items = questions.filter((question) => question.test === test);
  if (items.length !== 30) throw new Error(`Test ${test} should have 30 questions, got ${items.length}`);
  for (let number = 101; number <= 130; number += 1) {
    const matches = items.filter((question) => question.sourceNumber === number);
    if (matches.length !== 1) throw new Error(`Test ${test} question ${number} count is ${matches.length}`);
  }
}

for (const question of questions) {
  if (!question.id || !question.question) throw new Error(`Invalid question shape: ${JSON.stringify(question)}`);
  if (!Array.isArray(question.options) || question.options.length !== 4) throw new Error(`${question.id} must have 4 options`);
  if (!question.options.some((option) => option.letter === question.answer)) throw new Error(`${question.id} has invalid answer`);
}

console.log('Validated 150 TOEIC questions.');
