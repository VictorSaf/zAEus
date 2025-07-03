const OpenAI = require('openai');

// Debug: verifică dacă API key este încărcat
console.log('OpenAI API Key loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FOREX_SYSTEM_PROMPT = `Ești un profesor expert în tranzacționare Forex cu experiență de peste 15 ani. Rolul tău este să explici concepte financiare în termeni simpli și să ghidezi utilizatorii în învățarea tranzacționării pe piețele valutare.

PRINCIPII PENTRU RĂSPUNSURI:
1. Explică întotdeauna în termeni simpli, evită jargonul tehnic excesiv
2. Oferă exemple practice și concrete
3. Adaptează explicațiile în funcție de nivelul utilizatorului (începător/intermediar/avansat)
4. Subliniază mereu riscurile și importanța gestionării acestora
5. Oferă sfaturi practice și acționabile
6. Fii empatic și încurajează învățarea progresivă

DOMENII DE EXPERTIZA:
- Concepte de bază Forex (pip, spread, leverage, margin)
- Analiza tehnică și fundamentală
- Gestionarea riscului și a capitalului
- Psihologia trading-ului
- Strategii de tranzacționare
- Alegerea brokerului
- Platforme de trading

STIL DE COMUNICARE:
- Prietenos și accesibil
- Structurat și clar
- Cu exemple concrete
- Încurajează întrebările de follow-up`;

const QUIZ_GENERATION_PROMPT = `Ești un expert în crearea testelor educaționale pentru tranzacționare Forex. Creează întrebări care testează înțelegerea reală a conceptelor, nu doar memorarea.

INSTRUCȚIUNI PENTRU GENERAREA TESTELOR:
1. Creează exact 10 întrebări pentru nivelul specificat
2. Fiecare întrebare să aibă 4 variante de răspuns (A, B, C, D)
3. Include o singură variantă corectă
4. Adaugă o explicație detaliată pentru răspunsul corect
5. Variază tipurile de întrebări: conceptuale, practice, scenarii
6. IMPORTANT: Distribuie răspunsurile corecte echilibrat între A, B, C, D (aproximativ 2-3 pentru fiecare literă)
7. Adaugă tag-uri pentru skill-uri Forex pentru fiecare întrebare

SKILL-URI DISPONIBILE:
- "Analiză tehnică" - pentru grafice, pattern-uri, trend-uri
- "Psihologie în trading" - pentru emoții, disciplină, mentalitate
- "Risk Management" - pentru gestionarea riscului, stop-loss
- "Price Action" - pentru analiza prețului fără indicatori
- "Indicatori tehnici" - pentru RSI, MACD, SMA, etc.
- "Money Management" - pentru sizing poziții, capital
- "Fundamente economice" - pentru știri, eventi economice

NIVELE:
- BEGINNER: Concepte de bază (ce este Forex, pip, spread, leverage simplu)
- INTERMEDIATE: Analiza tehnică, indicatori, strategii simple
- ADVANCED: Strategii complexe, gestionare risc avansată, analiza macro

FORMAT RĂSPUNS:
Returnează JSON cu structura:
{
  "questions": [
    {
      "id": 1,
      "question": "Textul întrebării",
      "options": {
        "A": "Prima variantă",
        "B": "A doua variantă", 
        "C": "A treia variantă",
        "D": "A patra variantă"
      },
      "correct": "B",
      "explanation": "Explicația detaliată pentru răspunsul corect",
      "skills": ["Analiză tehnică", "Risk Management"]
    }
  ],
  "level": "beginner|intermediate|advanced",
  "totalQuestions": 10
}`;

async function getChatResponse(message, userLevel = 'beginner', chatHistory = []) {
  try {
    console.log('getChatResponse called with:', { message, userLevel, historyLength: chatHistory.length });
    
    const systemPrompt = `${FOREX_SYSTEM_PROMPT}

NIVELUL UTILIZATORULUI: ${userLevel.toUpperCase()}
- Pentru ÎNCEPĂTORI: Explică conceptele de la zero, folosește analogii simple
- Pentru INTERMEDIARI: Poți folosi termeni tehnici dar explică-i
- Pentru AVANSAȚI: Poți discuta strategii complexe și nuanțe

Răspunde în română, clar și structurat.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI with', messages.length, 'messages');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    console.log('OpenAI streaming response initiated');
    return completion;
  } catch (error) {
    console.error('OpenAI API error details:', error.message);
    console.error('Full error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw new Error('Nu pot genera răspuns în acest moment. Te rog încearcă din nou.');
  }
}

async function generateQuiz(level = 'beginner') {
  try {
    const prompt = `${QUIZ_GENERATION_PROMPT}

NIVEL SOLICITAT: ${level.toUpperCase()}

Generează un test de 10 întrebări pentru acest nivel. Returnează doar JSON-ul, fără text suplimentar.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Creează un test de nivel ${level} pentru Forex trading. IMPORTANT: Returnează DOAR JSON-ul valid, fără text suplimentar. Asigură-te că toate 10 întrebări sunt complete și că răspunsurile corecte sunt distribuite echilibrat între A, B, C și D (cel puțin 2 pentru fiecare literă).` }
      ],
      max_tokens: 3000,
      temperature: 0.8,
    });

    const response = completion.choices[0].message.content;
    
    // Încearcă să extragă JSON-ul din răspuns
    try {
      // Caută primul { și ultimul } pentru a extrage JSON-ul complet
      const firstBrace = response.indexOf('{');
      const lastBrace = response.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonString = response.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);
      } else {
        throw new Error('Nu s-a găsit JSON valid în răspuns');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      throw new Error('Nu s-a putut interpreta răspunsul OpenAI');
    }
  } catch (error) {
    console.error('Quiz generation error:', error);
    throw new Error('Nu pot genera quiz-ul în acest moment. Te rog încearcă din nou.');
  }
}

async function evaluateQuizAnswers(questions, userAnswers, userLevel) {
  try {
    const evaluation = {
      score: 0,
      totalQuestions: questions.length,
      percentage: 0,
      feedback: [],
      overallFeedback: '',
      recommendedLevel: userLevel
    };

    // Calculează scorul
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === question.correct;
      
      if (isCorrect) {
        evaluation.score++;
      }
      
      evaluation.feedback.push({
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer,
        correctAnswer: question.correct,
        isCorrect: isCorrect,
        explanation: question.explanation
      });
    });

    evaluation.percentage = Math.round((evaluation.score / evaluation.totalQuestions) * 100);

    // Generează feedback general cu AI
    const feedbackPrompt = `Utilizatorul a obținut ${evaluation.score}/${evaluation.totalQuestions} (${evaluation.percentage}%) la un test de Forex nivel ${userLevel}.

Oferă un feedback constructiv și motivațional în 2-3 paragrafe, incluzând:
1. Felicitări pentru progres
2. Zone de îmbunătățire
3. Recomandări concrete pentru următorii pași în învățare
4. Sugestii de nivel pentru următorul test

Răspunde în română, într-un ton încurajator și profesional.`;

    const feedbackCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Ești un mentor în trading Forex care oferă feedback constructiv.' },
        { role: 'user', content: feedbackPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    evaluation.overallFeedback = feedbackCompletion.choices[0].message.content;

    // Recomandă nivelul pentru următorul test - doar pentru afișare, avansarea se face în controller
    evaluation.recommendedLevel = userLevel;

    return evaluation;
  } catch (error) {
    console.error('Quiz evaluation error:', error);
    throw new Error('Nu pot evalua quiz-ul în acest moment.');
  }
}

module.exports = {
  getChatResponse,
  generateQuiz,
  evaluateQuizAnswers
};