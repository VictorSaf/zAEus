const db = require('../config/database-sqlite');

/**
 * Service pentru gestionarea misiunilor zilnice
 */

/**
 * Generează misiuni zilnice pentru un utilizator
 */
async function generateDailyMissions(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Verifică dacă utilizatorul are deja misiuni pentru azi
    const existingMissions = await db.query(
      'SELECT COUNT(*) as count FROM daily_missions WHERE user_id = ? AND date_assigned = ?',
      [userId, today]
    );

    if (existingMissions.rows[0].count > 0) {
      return await getUserDailyMissions(userId);
    }

    // Obține template-urile active
    const templates = await db.query(
      'SELECT * FROM mission_templates WHERE is_active = 1 ORDER BY RANDOM() LIMIT 3'
    );

    const missions = [];
    
    for (const template of templates.rows) {
      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999); // Expiră la sfârșitul zilei

      await db.query(
        `INSERT INTO daily_missions 
         (user_id, mission_type, mission_data, target_value, reward_xp, reward_type, date_assigned, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          template.mission_type,
          JSON.stringify({
            name: template.name,
            description: template.description,
            difficulty: template.difficulty
          }),
          template.target_value,
          template.reward_xp,
          template.reward_type,
          today,
          expiresAt.toISOString()
        ]
      );

      missions.push({
        id: await db.lastInsertRowId(),
        mission_type: template.mission_type,
        name: template.name,
        description: template.description,
        target_value: template.target_value,
        current_progress: 0,
        reward_xp: template.reward_xp,
        difficulty: template.difficulty,
        status: 'active'
      });
    }

    return missions;
  } catch (error) {
    console.error('Error generating daily missions:', error);
    throw error;
  }
}

/**
 * Obține misiunile zilnice ale utilizatorului
 */
async function getUserDailyMissions(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(`
      SELECT 
        id,
        mission_type,
        mission_data,
        target_value,
        current_progress,
        status,
        reward_xp,
        reward_type,
        completed_at,
        expires_at
      FROM daily_missions 
      WHERE user_id = ? AND date_assigned = ?
      ORDER BY created_at ASC
    `, [userId, today]);

    return result.rows.map(mission => {
      const missionData = JSON.parse(mission.mission_data || '{}');
      return {
        id: mission.id,
        mission_type: mission.mission_type,
        name: missionData.name || 'Misiune necunoscută',
        description: missionData.description || '',
        difficulty: missionData.difficulty || 'easy',
        target_value: mission.target_value,
        current_progress: mission.current_progress,
        progress_percentage: Math.round((mission.current_progress / mission.target_value) * 100),
        status: mission.status,
        reward_xp: mission.reward_xp,
        reward_type: mission.reward_type,
        completed_at: mission.completed_at,
        expires_at: mission.expires_at,
        is_completed: mission.status === 'completed',
        is_expired: new Date() > new Date(mission.expires_at)
      };
    });
  } catch (error) {
    console.error('Error getting user daily missions:', error);
    throw error;
  }
}

/**
 * Actualizează progresul unei misiuni
 */
async function updateMissionProgress(userId, missionType, incrementValue = 1, additionalData = {}) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Găsește misiunea activă de acest tip pentru utilizator
    const missionResult = await db.query(
      `SELECT id, target_value, current_progress, status 
       FROM daily_missions 
       WHERE user_id = ? AND mission_type = ? AND date_assigned = ? AND status = 'active'`,
      [userId, missionType, today]
    );

    if (missionResult.rows.length === 0) {
      return null; // Nu există misiune de acest tip
    }

    const mission = missionResult.rows[0];
    const newProgress = Math.min(mission.current_progress + incrementValue, mission.target_value);
    const isCompleted = newProgress >= mission.target_value;

    // Actualizează progresul
    if (isCompleted) {
      await db.query(
        `UPDATE daily_missions 
         SET current_progress = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newProgress, mission.id]
      );
    } else {
      await db.query(
        `UPDATE daily_missions 
         SET current_progress = ? 
         WHERE id = ?`,
        [newProgress, mission.id]
      );
    }

    return {
      mission_id: mission.id,
      mission_type: missionType,
      old_progress: mission.current_progress,
      new_progress: newProgress,
      target_value: mission.target_value,
      is_completed: isCompleted,
      additional_data: additionalData
    };
  } catch (error) {
    console.error('Error updating mission progress:', error);
    throw error;
  }
}

/**
 * Procesează evenimentele pentru actualizarea misiunilor
 */
async function processMissionEvent(userId, eventType, eventData = {}) {
  try {
    const updates = [];

    switch (eventType) {
      case 'quiz_completed':
        const quizUpdate = await updateMissionProgress(userId, 'complete_quizzes', 1, eventData);
        if (quizUpdate) updates.push(quizUpdate);
        
        if (eventData.score === eventData.totalQuestions) {
          const perfectUpdate = await updateMissionProgress(userId, 'perfect_quiz', 1, eventData);
          if (perfectUpdate) updates.push(perfectUpdate);
        }
        break;

      case 'correct_answer':
        // Verifică streak-ul de răspunsuri corecte
        if (eventData.streak >= 5) {
          const streakUpdate = await updateMissionProgress(userId, 'correct_streak', 1, eventData);
          if (streakUpdate) updates.push(streakUpdate);
        }
        break;

      case 'skill_xp_gained':
        const skillUpdate = await updateMissionProgress(userId, 'skill_improvement', eventData.xpGained, eventData);
        if (skillUpdate) updates.push(skillUpdate);
        break;

      case 'chat_message_sent':
        const chatUpdate = await updateMissionProgress(userId, 'chat_messages', 1, eventData);
        if (chatUpdate) updates.push(chatUpdate);
        break;

      default:
        console.log(`Unknown mission event type: ${eventType}`);
    }

    return updates;
  } catch (error) {
    console.error('Error processing mission event:', error);
    throw error;
  }
}

/**
 * Marchează misiunile expirate
 */
async function expireOldMissions() {
  try {
    const now = new Date().toISOString();
    
    const result = await db.query(
      `UPDATE daily_missions 
       SET status = 'expired' 
       WHERE status = 'active' AND expires_at < ?`,
      [now]
    );

    return result.changes || 0;
  } catch (error) {
    console.error('Error expiring old missions:', error);
    throw error;
  }
}

/**
 * Obține statistici despre misiuni pentru un utilizator
 */
async function getUserMissionsStats(userId) {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_missions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_missions,
        COUNT(CASE WHEN date_assigned = date('now') THEN 1 END) as today_missions,
        COUNT(CASE WHEN date_assigned = date('now') AND status = 'completed' THEN 1 END) as today_completed,
        SUM(CASE WHEN status = 'completed' THEN reward_xp ELSE 0 END) as total_mission_xp
      FROM daily_missions 
      WHERE user_id = ?
    `, [userId]);

    const stats = result.rows[0] || {
      total_missions: 0,
      completed_missions: 0,
      today_missions: 0,
      today_completed: 0,
      total_mission_xp: 0
    };

    return {
      ...stats,
      completion_rate: stats.total_missions > 0 ? Math.round((stats.completed_missions / stats.total_missions) * 100) : 0,
      today_completion_rate: stats.today_missions > 0 ? Math.round((stats.today_completed / stats.today_missions) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting user missions stats:', error);
    throw error;
  }
}

/**
 * Revendică recompensa pentru o misiune completată
 */
async function claimMissionReward(userId, missionId) {
  try {
    const missionResult = await db.query(
      `SELECT reward_xp, reward_type, status 
       FROM daily_missions 
       WHERE id = ? AND user_id = ?`,
      [missionId, userId]
    );

    if (missionResult.rows.length === 0) {
      throw new Error('Mission not found');
    }

    const mission = missionResult.rows[0];
    
    if (mission.status !== 'completed') {
      throw new Error('Mission not completed');
    }

    // Aici poți adăuga logica pentru a acorda recompensele
    // De exemplu, XP general, badge-uri, etc.

    return {
      mission_id: missionId,
      reward_xp: mission.reward_xp,
      reward_type: mission.reward_type
    };
  } catch (error) {
    console.error('Error claiming mission reward:', error);
    throw error;
  }
}

module.exports = {
  generateDailyMissions,
  getUserDailyMissions,
  updateMissionProgress,
  processMissionEvent,
  expireOldMissions,
  getUserMissionsStats,
  claimMissionReward
};