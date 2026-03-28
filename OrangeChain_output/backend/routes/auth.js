import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// ─── Auth Middleware ───────────────────────────────────────────────────────
export const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

function generateToken(user) {
  const payload = { user: { id: user.id || user._id, role: user.role } };
  return jwt.sign(payload, process.env.JWT_SECRET || 'secretKey', { expiresIn: '7d' });
}

// ─── Register ──────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please provide name, email and password.' });
    }

    const validRoles = ['farmer', 'buyer', 'admin'];
    const userRole = validRoles.includes(role?.toLowerCase()) ? role.toLowerCase() : 'farmer';

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password, role: userRole });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const token = generateToken(user);
    return res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, email: user.email }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password.' });
    }

    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = generateToken(user);
    return res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, email: user.email }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
});

// ─── Get Current User ──────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    return res.status(500).json({ msg: 'Server error.' });
  }
});

export default router;
