const axios = require('axios');

async function testFrontendQuiz() {
  try {
    // Simulează exact cum frontend-ul face request-ul
    console.log('Testing quiz like frontend does...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      username: 'Victor',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Create axios instance like frontend's api.ts
    const api = axios.create({
      baseURL: 'http://localhost:5002/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add auth interceptor like frontend
    api.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    
    // Make the same request as frontend
    const response = await api.get('/ai/quiz?level=beginner');
    console.log('Quiz generated successfully from frontend simulation!');
    console.log('Questions count:', response.data.questions.length);
    
  } catch (error) {
    console.error('Frontend simulation failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testFrontendQuiz();