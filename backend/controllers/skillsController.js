const { getUserSkills, getUserSkillsStats, initializeUserSkills } = require('../services/skillsService');
const { 
  generateDailyMissions, 
  getUserDailyMissions, 
  getUserMissionsStats,
  claimMissionReward,
  expireOldMissions 
} = require('../services/missionsService');

/**
 * Controller pentru skill-uri și misiuni
 */

async function getSkills(req, res) {
  try {
    const userId = req.user.id;
    
    // Asigură-te că utilizatorul are skill-urile inițializate
    await initializeUserSkills(userId);
    
    const skills = await getUserSkills(userId);
    const stats = await getUserSkillsStats(userId);
    
    res.json({
      skills,
      stats
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Nu pot încărca skill-urile' });
  }
}

async function getDailyMissions(req, res) {
  try {
    const userId = req.user.id;
    
    // Expiră misiunile vechi înainte de a genera altele noi
    await expireOldMissions();
    
    // Generează misiuni zilnice dacă nu există
    await generateDailyMissions(userId);
    
    const missions = await getUserDailyMissions(userId);
    const stats = await getUserMissionsStats(userId);
    
    res.json({
      missions,
      stats
    });
  } catch (error) {
    console.error('Get daily missions error:', error);
    res.status(500).json({ error: 'Nu pot încărca misiunile zilnice' });
  }
}

async function claimReward(req, res) {
  try {
    const userId = req.user.id;
    const { missionId } = req.params;
    
    const reward = await claimMissionReward(userId, parseInt(missionId));
    
    res.json({
      message: 'Recompensă revendicată cu succes',
      reward
    });
  } catch (error) {
    console.error('Claim reward error:', error);
    res.status(500).json({ error: error.message || 'Nu pot revendica recompensa' });
  }
}

async function getSkillsOverview(req, res) {
  try {
    const userId = req.user.id;
    
    const skills = await getUserSkills(userId);
    const skillsStats = await getUserSkillsStats(userId);
    const missionsStats = await getUserMissionsStats(userId);
    
    // Grupează skill-urile pe categorii
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {});
    
    // Calculează progresul general
    const overallProgress = skills.length > 0 
      ? Math.round(skills.reduce((sum, skill) => sum + skill.progress_percentage, 0) / skills.length)
      : 0;
    
    res.json({
      overview: {
        overall_progress: overallProgress,
        total_skills: skills.length,
        maxed_skills: skillsStats.maxed_skills,
        total_xp: skillsStats.total_xp,
        mission_completion_rate: missionsStats.completion_rate
      },
      skills_by_category: skillsByCategory,
      recent_activities: [] // Poate fi implementat ulterior
    });
  } catch (error) {
    console.error('Get skills overview error:', error);
    res.status(500).json({ error: 'Nu pot încărca overview-ul skill-urilor' });
  }
}

module.exports = {
  getSkills,
  getDailyMissions,
  claimReward,
  getSkillsOverview
};