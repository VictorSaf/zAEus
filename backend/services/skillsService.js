const db = require('../config/database-sqlite');
const crypto = require('crypto');

/**
 * Service pentru gestionarea skill-urilor Forex și XP
 */

// Calculează hash pentru întrebări (pentru tagging consistent)
function generateQuestionHash(questionText) {
  return crypto.createHash('md5')
    .update(questionText.toLowerCase().trim())
    .digest('hex');
}

// Calculează nivelul bazat pe XP
function calculateLevel(currentXp, maxXp = 1000) {
  const level = Math.floor((currentXp / maxXp) * 10) + 1;
  return Math.min(level, 10); // Maxim nivel 10
}

// Calculează XP necesar pentru următorul nivel
function getXpForNextLevel(currentXp, maxXp = 1000) {
  const currentLevel = calculateLevel(currentXp, maxXp);
  if (currentLevel >= 10) return maxXp;
  
  const nextLevelXp = Math.ceil((currentLevel / 10) * maxXp);
  return nextLevelXp;
}

/**
 * Inițializează skill-urile pentru un utilizator nou
 */
async function initializeUserSkills(userId) {
  try {
    const skills = await db.query('SELECT id FROM forex_skills');
    
    for (const skill of skills.rows) {
      await db.query(
        `INSERT OR IGNORE INTO user_skills (user_id, skill_id, current_xp, level) 
         VALUES (?, ?, 0, 1)`,
        [userId, skill.id]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user skills:', error);
    throw error;
  }
}

/**
 * Obține toate skill-urile cu progresul utilizatorului
 */
async function getUserSkills(userId) {
  try {
    const result = await db.query(`
      SELECT 
        fs.id,
        fs.name,
        fs.description,
        fs.category,
        fs.max_xp,
        fs.icon,
        COALESCE(us.current_xp, 0) as current_xp,
        COALESCE(us.level, 1) as level,
        us.last_updated
      FROM forex_skills fs
      LEFT JOIN user_skills us ON fs.id = us.skill_id AND us.user_id = ?
      ORDER BY fs.category, fs.name
    `, [userId]);

    return result.rows.map(skill => ({
      ...skill,
      progress_percentage: Math.round((skill.current_xp / skill.max_xp) * 100),
      xp_for_next_level: getXpForNextLevel(skill.current_xp, skill.max_xp),
      is_max_level: skill.level >= 10
    }));
  } catch (error) {
    console.error('Error getting user skills:', error);
    throw error;
  }
}

/**
 * Adaugă XP pentru un skill specific
 */
async function addSkillXp(userId, skillId, xpAmount, source = 'quiz') {
  try {
    // Asigură-te că utilizatorul are skill-ul inițializat
    await db.query(
      `INSERT OR IGNORE INTO user_skills (user_id, skill_id, current_xp, level) 
       VALUES (?, ?, 0, 1)`,
      [userId, skillId]
    );

    // Obține XP-ul curent
    const currentResult = await db.query(
      'SELECT current_xp, level FROM user_skills WHERE user_id = ? AND skill_id = ?',
      [userId, skillId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Skill not found for user');
    }

    const currentXp = currentResult.rows[0].current_xp;
    const newXp = currentXp + xpAmount;
    const newLevel = calculateLevel(newXp);

    // Actualizează XP și nivelul
    await db.query(
      `UPDATE user_skills 
       SET current_xp = ?, level = ?, last_updated = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND skill_id = ?`,
      [newXp, newLevel, userId, skillId]
    );

    const leveledUp = newLevel > currentResult.rows[0].level;

    return {
      skill_id: skillId,
      old_xp: currentXp,
      new_xp: newXp,
      xp_gained: xpAmount,
      old_level: currentResult.rows[0].level,
      new_level: newLevel,
      leveled_up: leveledUp,
      source: source
    };
  } catch (error) {
    console.error('Error adding skill XP:', error);
    throw error;
  }
}

/**
 * Asociază o întrebare cu skill-urile și XP-ul corespunzător
 */
async function tagQuestionWithSkills(questionText, skillTags) {
  try {
    const questionHash = generateQuestionHash(questionText);
    
    // Șterge tag-urile existente pentru această întrebare
    await db.query(
      'DELETE FROM question_skills WHERE question_content_hash = ?',
      [questionHash]
    );

    // Adaugă noile tag-uri
    for (const tag of skillTags) {
      const skillResult = await db.query(
        'SELECT id FROM forex_skills WHERE name = ?',
        [tag.skillName]
      );

      if (skillResult.rows.length > 0) {
        await db.query(
          `INSERT INTO question_skills (question_content_hash, skill_id, xp_value) 
           VALUES (?, ?, ?)`,
          [questionHash, skillResult.rows[0].id, tag.xpValue || 10]
        );
      }
    }

    return questionHash;
  } catch (error) {
    console.error('Error tagging question with skills:', error);
    throw error;
  }
}

/**
 * Obține skill-urile asociate cu o întrebare
 */
async function getQuestionSkills(questionText) {
  try {
    const questionHash = generateQuestionHash(questionText);
    
    const result = await db.query(`
      SELECT fs.id, fs.name, qs.xp_value
      FROM question_skills qs
      JOIN forex_skills fs ON qs.skill_id = fs.id
      WHERE qs.question_content_hash = ?
    `, [questionHash]);

    return result.rows;
  } catch (error) {
    console.error('Error getting question skills:', error);
    throw error;
  }
}

/**
 * Procesează răspunsul la quiz și acordă XP pentru skill-uri
 */
async function processQuizAnswer(userId, questionText, isCorrect) {
  try {
    if (!isCorrect) return []; // Nu se acordă XP pentru răspunsuri greșite

    const questionSkills = await getQuestionSkills(questionText);
    const skillUpdates = [];

    for (const skill of questionSkills) {
      const update = await addSkillXp(userId, skill.id, skill.xp_value, 'quiz');
      skillUpdates.push({
        ...update,
        skill_name: skill.name
      });
    }

    return skillUpdates;
  } catch (error) {
    console.error('Error processing quiz answer:', error);
    throw error;
  }
}

/**
 * Obține statistici generale despre skill-uri pentru un utilizator
 */
async function getUserSkillsStats(userId) {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_skills,
        SUM(current_xp) as total_xp,
        AVG(current_xp * 100.0 / max_xp) as average_progress,
        COUNT(CASE WHEN level >= 10 THEN 1 END) as maxed_skills
      FROM user_skills us
      JOIN forex_skills fs ON us.skill_id = fs.id
      WHERE us.user_id = ?
    `, [userId]);

    return result.rows[0] || {
      total_skills: 0,
      total_xp: 0,
      average_progress: 0,
      maxed_skills: 0
    };
  } catch (error) {
    console.error('Error getting user skills stats:', error);
    throw error;
  }
}

module.exports = {
  initializeUserSkills,
  getUserSkills,
  addSkillXp,
  tagQuestionWithSkills,
  getQuestionSkills,
  processQuizAnswer,
  getUserSkillsStats,
  generateQuestionHash,
  calculateLevel
};