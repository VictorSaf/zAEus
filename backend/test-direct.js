// Test direct function calls to isolate the issue
require('dotenv').config();
const { getChatResponse } = require('./services/openaiService');
const db = require('./config/database-sqlite');

async function testDirect() {
  try {
    console.log('Testing direct OpenAI call...');
    
    // Test the OpenAI service directly
    const response = await getChatResponse('Ce este Forex?', 'beginner', []);
    console.log('Direct OpenAI response:', response.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('Direct OpenAI test failed:', error.message);
    console.error('Full error:', error);
  }
  
  try {
    console.log('Testing database connection...');
    
    // Test database query
    const result = await db.query('SELECT level FROM users WHERE id = ?', [1]);
    console.log('Database test result:', result.rows);
    
  } catch (error) {
    console.error('Database test failed:', error.message);
  }
}

testDirect();