const db = require('../config/database-sqlite');

// Obține activity log-urile pentru admin
async function getActivityLogs(req, res) {
  try {
    const { 
      userId, 
      actionType, 
      startDate, 
      endDate, 
      limit = 50, 
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        al.*,
        u.username,
        u.email,
        u.full_name,
        u.role
      FROM user_activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];

    // Filtrare după user
    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }

    // Filtrare după tip de acțiune
    if (actionType) {
      query += ' AND al.action_type = ?';
      params.push(actionType);
    }

    // Filtrare după dată
    if (startDate) {
      query += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Obține total count pentru paginare
    let countQuery = `
      SELECT COUNT(*) as total
      FROM user_activity_log al
      WHERE 1=1
    `;
    
    const countParams = [];
    let paramIndex = 0;

    if (userId) {
      countQuery += ' AND al.user_id = ?';
      countParams.push(params[paramIndex++]);
    }

    if (actionType) {
      countQuery += ' AND al.action_type = ?';
      countParams.push(params[paramIndex++]);
    }

    if (startDate) {
      countQuery += ' AND al.created_at >= ?';
      countParams.push(params[paramIndex++]);
    }

    if (endDate) {
      countQuery += ' AND al.created_at <= ?';
      countParams.push(params[paramIndex++]);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = countResult.rows[0]?.total || 0;

    // Formatează rezultatele
    const logs = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      actionType: row.action_type,
      endpoint: row.endpoint,
      method: row.method,
      requestData: row.request_data ? JSON.parse(row.request_data) : null,
      responseStatus: row.response_status,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      durationMs: row.duration_ms,
      createdAt: row.created_at
    }));

    res.json({
      logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Nu pot încărca activity log-urile' });
  }
}

// Obține statistici de activitate
async function getActivityStats(req, res) {
  try {
    const { userId, days = 7 } = req.query;
    
    // Statistici generale
    let statsQuery = `
      SELECT 
        action_type,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration
      FROM user_activity_log 
      WHERE created_at >= datetime('now', '-${parseInt(days)} days')
    `;
    
    const params = [];
    
    if (userId) {
      statsQuery += ' AND user_id = ?';
      params.push(userId);
    }
    
    statsQuery += ' GROUP BY action_type ORDER BY count DESC';
    
    const statsResult = await db.query(statsQuery, params);

    // Activitate pe ore (ultimele 24h)
    let hourlyQuery = `
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as count
      FROM user_activity_log 
      WHERE created_at >= datetime('now', '-1 day')
    `;
    
    const hourlyParams = [];
    
    if (userId) {
      hourlyQuery += ' AND user_id = ?';
      hourlyParams.push(userId);
    }
    
    hourlyQuery += ' GROUP BY hour ORDER BY hour';
    
    const hourlyResult = await db.query(hourlyQuery, hourlyParams);

    // Top utilizatori activi
    let topUsersQuery = `
      SELECT 
        u.username,
        u.full_name,
        u.role,
        COUNT(*) as activity_count,
        MAX(al.created_at) as last_activity
      FROM user_activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= datetime('now', '-${parseInt(days)} days')
      GROUP BY al.user_id
      ORDER BY activity_count DESC
      LIMIT 10
    `;
    
    const topUsersResult = await db.query(topUsersQuery);

    res.json({
      actionStats: statsResult.rows.map(row => ({
        actionType: row.action_type,
        count: row.count,
        avgDuration: Math.round(row.avg_duration || 0)
      })),
      hourlyActivity: hourlyResult.rows.map(row => ({
        hour: parseInt(row.hour),
        count: row.count
      })),
      topUsers: topUsersResult.rows.map(row => ({
        username: row.username,
        fullName: row.full_name,
        role: row.role,
        activityCount: row.activity_count,
        lastActivity: row.last_activity
      }))
    });

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Nu pot încărca statisticile' });
  }
}

// Obține tipurile de acțiuni disponibile
async function getActionTypes(req, res) {
  try {
    const result = await db.query(`
      SELECT DISTINCT action_type 
      FROM user_activity_log 
      ORDER BY action_type
    `);

    res.json({
      actionTypes: result.rows.map(row => row.action_type)
    });

  } catch (error) {
    console.error('Error fetching action types:', error);
    res.status(500).json({ error: 'Nu pot încărca tipurile de acțiuni' });
  }
}

module.exports = {
  getActivityLogs,
  getActivityStats,
  getActionTypes
};