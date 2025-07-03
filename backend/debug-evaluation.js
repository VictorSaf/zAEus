require('dotenv').config();
const { evaluateQuizAnswers } = require('./services/openaiService');

// Test cu date reale pentru a verifica evaluarea
async function debugEvaluation() {
  console.log('Testing quiz evaluation...');
  
  // Exemplu de întrebări (simulez structura reală)
  const questions = [
    {
      id: 1,
      question: "Ce reprezintă perechea valutară EUR/USD?",
      options: {
        "A": "Euro vs USD",
        "B": "USD vs GBP", 
        "C": "EUR vs JPY",
        "D": "GBP vs AUD"
      },
      correct: "A",
      explanation: "Perechea valutară EUR/USD reprezintă cât de mulți dolari americani (USD) sunt necesari pentru a cumpăra un euro (EUR)."
    },
    {
      id: 2,
      question: "Ce reprezintă un pip în tranzacționarea Forex?",
      options: {
        "A": "O mișcare de preț de 1 punct",
        "B": "O comisioană a brokerului", 
        "C": "O platformă de tranzacționare populară",
        "D": "O strategie de scalping"
      },
      correct: "A",
      explanation: "Un pip reprezintă cea mai mică schimbare posibilă în preț pentru o anumită pereche valutară, de obicei 0.0001 pentru majoritatea perechilor."
    },
    {
      id: 3,
      question: "Ce este spread-ul în tranzacționarea Forex?",
      options: {
        "A": "Diferența dintre prețul de cumpărare și de vânzare",
        "B": "Un indicator al volatilității pieței", 
        "C": "Un tip de comisioană",
        "D": "Un instrument derivat"
      },
      correct: "A",
      explanation: "Spread-ul reprezintă diferența dintre prețul la care poți cumpăra o pereche valutară și prețul la care poți vinde aceeași pereche valutară."
    }
  ];

  // Test cazuri diferite de răspunsuri
  console.log('\n=== Test 1: Toate răspunsurile corecte ===');
  const correctAnswers = ["A", "A", "A"];
  const eval1 = await evaluateQuizAnswers(questions, correctAnswers, 'beginner');
  console.log(`Scor: ${eval1.score}/${eval1.totalQuestions} (${eval1.percentage}%)`);
  eval1.feedback.forEach((item, index) => {
    console.log(`Q${index + 1}: User: ${item.userAnswer}, Correct: ${item.correctAnswer}, isCorrect: ${item.isCorrect}`);
  });

  console.log('\n=== Test 2: Primele două corecte, ultima greșită ===');
  const mixedAnswers = ["A", "A", "B"];
  const eval2 = await evaluateQuizAnswers(questions, mixedAnswers, 'beginner');
  console.log(`Scor: ${eval2.score}/${eval2.totalQuestions} (${eval2.percentage}%)`);
  eval2.feedback.forEach((item, index) => {
    console.log(`Q${index + 1}: User: ${item.userAnswer}, Correct: ${item.correctAnswer}, isCorrect: ${item.isCorrect}`);
  });

  console.log('\n=== Test 3: Toate răspunsurile greșite ===');
  const wrongAnswers = ["B", "B", "B"];
  const eval3 = await evaluateQuizAnswers(questions, wrongAnswers, 'beginner');
  console.log(`Scor: ${eval3.score}/${eval3.totalQuestions} (${eval3.percentage}%)`);
  eval3.feedback.forEach((item, index) => {
    console.log(`Q${index + 1}: User: ${item.userAnswer}, Correct: ${item.correctAnswer}, isCorrect: ${item.isCorrect}`);
  });
}

debugEvaluation().catch(console.error);