const db = require('../config/database-sqlite');

// Middleware pentru logarea automată a tuturor activităților utilizatorilor
function activityLogger(req, res, next) {
  const startTime = Date.now();
  
  // Salvează metoda originală res.json pentru a intercepta răspunsul
  const originalJson = res.json;
  let responseStatus = 200;
  
  res.json = function(data) {
    responseStatus = res.statusCode || 200;
    return originalJson.call(this, data);
  };

  // Salvează metoda originală res.status pentru a intercepta status-ul
  const originalStatus = res.status;
  res.status = function(code) {
    responseStatus = code;
    return originalStatus.call(this, code);
  };

  // Hook pe finalul response-ului
  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;
      const userId = req.user?.id || null;
      
      // Doar logăm request-urile autentificate și cele relevante
      if (userId && shouldLogRequest(req)) {
        await logUserActivity({
          userId,
          actionType: getActionType(req),
          endpoint: req.originalUrl || req.url,
          method: req.method,
          requestData: getRequestData(req),
          responseStatus,
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          durationMs: duration
        });
      }
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  });

  next();
}

// Determină dacă request-ul trebuie logat
function shouldLogRequest(req) {
  const ignoredPaths = [
    '/api/health',
    '/api/auth/me',
    '/favicon.ico'
  ];
  
  const ignoredMethods = ['OPTIONS'];
  
  return !ignoredPaths.some(path => req.originalUrl?.includes(path)) &&
         !ignoredMethods.includes(req.method);
}

// Determină tipul de acțiune bazat pe request
function getActionType(req) {
  const path = req.originalUrl || req.url;
  const method = req.method;

  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/ai/chat') && method === 'POST') return 'AI_CHAT';
  if (path.includes('/ai/quiz') && method === 'GET') return 'QUIZ_GENERATE';
  if (path.includes('/ai/quiz/evaluate') && method === 'POST') return 'QUIZ_SUBMIT';
  if (path.includes('/ai/progress')) return 'PROGRESS_VIEW';
  if (path.includes('/ai/chat/history')) return 'CHAT_HISTORY_VIEW';
  if (path.includes('/ai/level') && method === 'PUT') return 'LEVEL_UPDATE';
  if (path.includes('/users') && method === 'GET') return 'USERS_VIEW';
  if (path.includes('/users') && method === 'POST') return 'USER_CREATE';
  if (path.includes('/users') && method === 'PUT') return 'USER_UPDATE';
  if (path.includes('/users') && method === 'DELETE') return 'USER_DELETE';
  
  return `${method}_${path.split('/').pop()?.toUpperCase() || 'UNKNOWN'}`;
}

// Extrage datele relevante din request (fără sensitive data)
function getRequestData(req) {
  const data = {};
  
  // Adaugă query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    data.query = req.query;
  }
  
  // Adaugă body data (fără passwords și tokens)
  if (req.body && Object.keys(req.body).length > 0) {
    data.body = sanitizeRequestBody(req.body);
  }
  
  // Adaugă params
  if (req.params && Object.keys(req.params).length > 0) {
    data.params = req.params;
  }
  
  return Object.keys(data).length > 0 ? JSON.stringify(data) : null;
}

// Sanitizează body-ul request-ului pentru a elimina informațiile sensibile
function sanitizeRequestBody(body) {
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[HIDDEN]';
    }
  });
  
  return sanitized;
}

// Salvează activitatea în baza de date
async function logUserActivity(activityData) {
  try {
    await db.query(`
      INSERT INTO user_activity_log 
      (user_id, action_type, endpoint, method, request_data, response_status, ip_address, user_agent, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      activityData.userId,
      activityData.actionType,
      activityData.endpoint,
      activityData.method,
      activityData.requestData,
      activityData.responseStatus,
      activityData.ipAddress,
      activityData.userAgent,
      activityData.durationMs
    ]);
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}

// Funcție pentru logarea manuală a unor evenimente specifice
async function logCustomActivity(userId, actionType, details = null) {
  try {
    await db.query(`
      INSERT INTO user_activity_log 
      (user_id, action_type, endpoint, method, request_data, response_status, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      actionType,
      null,
      'CUSTOM',
      details ? JSON.stringify(details) : null,
      200,
      0
    ]);
  } catch (error) {
    console.error('Failed to log custom activity:', error);
  }
}

module.exports = { activityLogger, logCustomActivity };