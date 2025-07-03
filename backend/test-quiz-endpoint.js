const axios = require('axios');

async function testQuizEndpoint() {
  try {
    // First, login to get token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      username: 'Victor',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token received:', token ? 'YES' : 'NO');
    
    // Test the quiz generation endpoint
    console.log('Testing quiz generation endpoint...');
    const quizResponse = await axios.get('http://localhost:5002/api/ai/quiz?level=beginner', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Quiz generated successfully!');
    console.log('Number of questions:', quizResponse.data.questions.length);
    console.log('Level:', quizResponse.data.level);
    console.log('Total questions:', quizResponse.data.totalQuestions);
    
  } catch (error) {
    console.error('Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testQuizEndpoint();