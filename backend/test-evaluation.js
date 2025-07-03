const axios = require('axios');

async function testQuizEvaluation() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      username: 'Victor',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');

    // Generează un quiz
    console.log('Generating quiz...');
    const quizResponse = await axios.get('http://localhost:5002/api/ai/quiz?level=beginner', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const quiz = quizResponse.data;
    console.log(`Quiz generated with ${quiz.questions.length} questions`);
    
    // Afișează întrebările și răspunsurile corecte
    quiz.questions.forEach((q, i) => {
      console.log(`Q${i + 1}: ${q.question}`);
      console.log(`  Correct: ${q.correct}`);
      console.log(`  Options: ${Object.keys(q.options).join(', ')}`);
    });

    // Simulează răspunsuri pentru testare (primele 3 corecte, restul greșite)
    const userAnswers = quiz.questions.map((q, index) => {
      if (index < 3) return q.correct; // Primele 3 corecte
      // Pentru restul, alege o opțiune greșită
      const options = Object.keys(q.options);
      return options.find(opt => opt !== q.correct) || 'B';
    });

    console.log('\nUser answers:', userAnswers);
    console.log('Correct answers:', quiz.questions.map(q => q.correct));

    // Evaluează quiz-ul
    console.log('\nEvaluating quiz...');
    const evalResponse = await axios.post('http://localhost:5002/api/ai/quiz/evaluate', {
      questions: quiz.questions,
      answers: userAnswers,
      level: quiz.level,
      timeSpent: 120
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const evaluation = evalResponse.data;
    console.log(`\nEvaluation result: ${evaluation.score}/${evaluation.totalQuestions} (${evaluation.percentage}%)`);
    
    evaluation.feedback.forEach((item, index) => {
      console.log(`Q${index + 1}: ${item.isCorrect ? '✓' : '✗'} User: ${item.userAnswer}, Correct: ${item.correctAnswer}`);
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testQuizEvaluation();