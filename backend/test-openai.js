require('dotenv').config();
const OpenAI = require('openai');

console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Hello, please respond in Romanian: Ce este Forex?' }
      ],
      max_tokens: 100,
    });

    console.log('Success! Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error type:', error.type);
  }
}

testOpenAI();