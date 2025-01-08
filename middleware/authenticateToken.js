require ('dotenv').config();
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, process.env.jwt_secret1, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // Attach decoded token payload to request
    next();
  });
}

module.exports = authenticateToken;
