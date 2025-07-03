const axios = require('axios');

async function testChatEndpoint() {
  try {
    // First, login to get token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      username: 'Victor',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token received:', token ? 'YES' : 'NO');
    
    // Test the chat endpoint
    console.log('Testing AI chat endpoint...');
    const chatResponse = await axios.post('http://localhost:5002/api/ai/chat', {
      message: 'Ce este Forex?'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Chat response:', chatResponse.data);
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

testChatEndpoint();