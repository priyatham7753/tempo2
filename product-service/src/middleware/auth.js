const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/validate`,
      { token },
      { timeout: 5000 }
    );

    if (!response.data.valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = response.data.user;
    next();
  } catch (err) {
    if (err.response && err.response.status === 401) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error(`[PRODUCT] Auth service error: ${err.message}`);
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }
};

module.exports = authMiddleware;
