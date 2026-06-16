const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Allow bypassing auth in development for faster iteration
  if (
    process.env.DISABLE_AUTH === 'true' ||
    process.env.NODE_ENV === 'development'
  ) {
    console.warn(
      'Auth middleware: authorization disabled (DISABLE_AUTH=true or NODE_ENV=development)',
    );
    try {
      // Attempt to find a dev user; if none exists and DB is connected, create one
      let devEmail = process.env.DEV_USER_EMAIL || 'dev@local';
      let devUser = await User.findOne({ email: devEmail });
      if (!devUser && require('mongoose').connection.readyState === 1) {
        devUser = await User.create({
          username: 'dev',
          email: devEmail,
          password: process.env.DEV_USER_PASSWORD || 'devpass',
        });
        console.log('Created development user for auth bypass:', devEmail);
      }
      if (devUser) {
        req.user = devUser;
      } else {
        // If DB isn't available, set a lightweight stub to avoid crashing handlers that read `req.user.id`.
        req.user = { id: null };
      }
      return next();
    } catch (err) {
      console.error('Auth bypass failed:', err.message);
      // fall through to normal token checks below
    }
  }

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretnutriplantoken2026key',
      );

      // Get user from the token, excluding password
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
      return;
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
