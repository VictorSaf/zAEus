const db = require('./database-sqlite');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        level TEXT DEFAULT 'beginner',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Creare tabelă pentru progresul de învățare
    await db.query(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quiz_type TEXT,
        quiz_score INTEGER,
        total_questions INTEGER,
        level TEXT,
        ai_feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Creare tabelă pentru istoricul chat-ului AI
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        message_type TEXT DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Creare tabelă pentru logarea completă a activității utilizatorilor
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        endpoint TEXT,
        method TEXT,
        request_data TEXT,
        response_status INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        duration_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Creare tabelă pentru skill-urile Forex
    await db.query(`
      CREATE TABLE IF NOT EXISTS forex_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        category TEXT,
        max_xp INTEGER DEFAULT 1000,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Creare tabelă pentru progresul utilizatorilor pe skill-uri
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_id INTEGER NOT NULL,
        current_xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES forex_skills(id) ON DELETE CASCADE,
        UNIQUE(user_id, skill_id)
      )
    `);

    // Creare tabelă pentru tag-urile întrebărilor (asociere skill-uri)
    await db.query(`
      CREATE TABLE IF NOT EXISTS question_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_content_hash TEXT NOT NULL,
        skill_id INTEGER NOT NULL,
        xp_value INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (skill_id) REFERENCES forex_skills(id) ON DELETE CASCADE,
        UNIQUE(question_content_hash, skill_id)
      )
    `);

    // Creare tabelă pentru mini-misiunile zilnice
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mission_type TEXT NOT NULL,
        mission_data TEXT, -- JSON cu detalii misiune
        target_value INTEGER NOT NULL,
        current_progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active', -- active, completed, expired
        reward_xp INTEGER DEFAULT 0,
        reward_type TEXT,
        date_assigned DATE NOT NULL,
        completed_at DATETIME,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Creare tabelă pentru template-urile de misiuni
    await db.query(`
      CREATE TABLE IF NOT EXISTS mission_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        mission_type TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        reward_xp INTEGER DEFAULT 50,
        reward_type TEXT,
        difficulty TEXT DEFAULT 'easy', -- easy, medium, hard
        frequency TEXT DEFAULT 'daily', -- daily, weekly
        conditions TEXT, -- JSON cu condiții
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inserează skill-urile Forex de bază
    const skillsExist = await db.query('SELECT COUNT(*) as count FROM forex_skills');
    if (skillsExist.rows[0].count === 0) {
      const forexSkills = [
        {
          name: 'Analiză tehnică',
          description: 'Citirea și interpretarea graficelor, pattern-uri de preț',
          category: 'analysis',
          icon: '📈'
        },
        {
          name: 'Psihologie în trading',
          description: 'Controlul emoțiilor, disciplină, mentalitate de trader',
          category: 'psychology',
          icon: '🧠'
        },
        {
          name: 'Risk Management',
          description: 'Gestionarea riscului, poziționarea, stop-loss',
          category: 'risk',
          icon: '🛡️'
        },
        {
          name: 'Price Action',
          description: 'Analiza pură a mișcării prețului fără indicatori',
          category: 'analysis',
          icon: '💹'
        },
        {
          name: 'Indicatori tehnici',
          description: 'Utilizarea și interpretarea indicatorilor tehnici',
          category: 'analysis',
          icon: '📊'
        },
        {
          name: 'Money Management',
          description: 'Gestionarea capitalului, sizing-ul pozițiilor',
          category: 'risk',
          icon: '💰'
        },
        {
          name: 'Fundamente economice',
          description: 'Analiza fundamentală, evenimente economice',
          category: 'fundamentals',
          icon: '🌍'
        }
      ];

      for (const skill of forexSkills) {
        await db.query(
          `INSERT INTO forex_skills (name, description, category, icon) VALUES (?, ?, ?, ?)`,
          [skill.name, skill.description, skill.category, skill.icon]
        );
      }
      console.log('Forex skills initialized successfully');
    }

    // Inserează template-urile de misiuni zilnice
    const templatesExist = await db.query('SELECT COUNT(*) as count FROM mission_templates');
    if (templatesExist.rows[0].count === 0) {
      const missionTemplates = [
        {
          name: 'Quiz Master',
          description: 'Completează 3 quiz-uri astăzi',
          mission_type: 'complete_quizzes',
          target_value: 3,
          reward_xp: 50,
          difficulty: 'easy'
        },
        {
          name: 'Perfect Streak',
          description: 'Răspunde corect la 5 întrebări consecutive',
          mission_type: 'correct_streak',
          target_value: 5,
          reward_xp: 75,
          difficulty: 'medium'
        },
        {
          name: 'Skill Specialist',
          description: 'Îmbunătățește un skill cu 50 XP',
          mission_type: 'skill_improvement',
          target_value: 50,
          reward_xp: 100,
          difficulty: 'medium'
        },
        {
          name: 'Perfect Score',
          description: 'Obține scor de 100% la un quiz',
          mission_type: 'perfect_quiz',
          target_value: 1,
          reward_xp: 150,
          difficulty: 'hard'
        },
        {
          name: 'Chat Explorer',
          description: 'Pune 5 întrebări AI-ului astăzi',
          mission_type: 'chat_messages',
          target_value: 5,
          reward_xp: 30,
          difficulty: 'easy'
        }
      ];

      for (const template of missionTemplates) {
        await db.query(
          `INSERT INTO mission_templates (name, description, mission_type, target_value, reward_xp, difficulty) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [template.name, template.description, template.mission_type, template.target_value, template.reward_xp, template.difficulty]
        );
      }
      console.log('Mission templates initialized successfully');
    }

    // Check if admin exists
    const adminExists = await db.query('SELECT * FROM users WHERE username = ?', ['Victor']);
    
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        `INSERT INTO users (username, email, password, full_name, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Victor', 'admin@example.com', hashedPassword, 'Administrator', 'admin']
      );
      console.log('Admin user created successfully');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = initDatabase;