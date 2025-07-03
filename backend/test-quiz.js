require('dotenv').config();
const { generateQuiz } = require('./services/openaiService');

async function testQuiz() {
  try {
    console.log('Testing quiz generation...');
    const quiz = await generateQuiz('beginner');
    console.log('Quiz generated successfully:', JSON.stringify(quiz, null, 2));
  } catch (error) {
    console.error('Quiz generation failed:', error.message);
    console.error('Full error:', error);
  }
}

testQuiz();