const express  = require('express');
const jwt       = require('jsonwebtoken');
const router    = express.Router();

const User         = require('../models/User');
const Admin        = require('../models/Admin');
const ParkingOwner = require('../models/ParkingOwner');

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ──────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Login ID and password are required.' });
    }

    // 1. Check Admin
    const admin = await Admin.findOne({ 
      $or: [{ admin_id: loginId }, { username: loginId }, { email: loginId }]
    });
    if (admin) {
      const match = await admin.comparePassword(password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid Login ID or Password.' });
      const token = signToken({ id: admin._id, role: 'admin', loginId });
      return res.json({
        success: true, role: 'admin', token,
        user: { full_name: admin.full_name, email: admin.email, admin_id: admin.admin_id }
      });
    }

    // 2. Check Parking Owner
    const owner = await ParkingOwner.findOne({ 
      $or: [{ owner_id: loginId }, { username: loginId }, { email: loginId }]
    });
    if (owner) {
      if (owner.status === 'inactive') return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
      const match = await owner.comparePassword(password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid Login ID or Password.' });
      const token = signToken({ id: owner._id, role: 'parking_owner', loginId });
      return res.json({
        success: true, role: 'parking_owner', token,
        user: { full_name: owner.full_name, email: owner.email, owner_id: owner.owner_id, lot_name: owner.lot_name }
      });
    }

    // 3. Check User by username or email
    const user = await User.findOne({ 
      $or: [{ username: loginId }, { email: loginId }]
    });
    if (user) {
      if (user.status === 'inactive') return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });
      const match = await user.comparePassword(password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid Login ID or Password.' });
      const token = signToken({ id: user._id, role: 'user', loginId });
      return res.json({
        success: true, role: 'user', token,
        user: { full_name: user.full_name, email: user.email, username: user.username, vehicle_number: user.vehicle_number }
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid Login ID or Password.' });

  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ──────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, first_name, last_name, email, phone, vehicle_number, vehicle_type } = req.body;

    let finalUsername = username || ('USER' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000));

    // Validations
    if (!password || !first_name || !last_name || !email || !vehicle_number) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }
    if (/\s/.test(finalUsername)) return res.status(400).json({ success: false, message: 'Username cannot contain spaces.' });
    if (password.length < 6)  return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const existingUser  = await User.findOne({ username: finalUsername });
    if (existingUser) return res.status(409).json({ success: false, message: 'Username already taken.' });

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const newUser = new User({
      username: finalUsername, password,
      first_name, last_name,
      full_name: `${first_name} ${last_name}`,
      email, phone: phone || '',
      vehicle_number,
      vehicle_type: vehicle_type || 'car',
      role: 'user', status: 'active'
    });

    await newUser.save();
    res.status(201).json({ success: true, message: 'Account created successfully!' });

  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} already in use.` });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ──────────────────────────────────────────
// POST /api/auth/register-owner
// ──────────────────────────────────────────
router.post('/register-owner', async (req, res) => {
  try {
    const { owner_id, username, password, full_name, email, lot_name, location, total_slots } = req.body;

    let finalOwnerId = owner_id || ('OWNER' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000));
    let finalUsernameOwner = username || finalOwnerId;

    // Validations
    if (!password || !full_name || !email || !lot_name || !location || !total_slots) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }
    if (/\s/.test(finalUsernameOwner)) return res.status(400).json({ success: false, message: 'Username cannot contain spaces.' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const existingOwner = await ParkingOwner.findOne({ $or: [{ owner_id: finalOwnerId }, { username: finalUsernameOwner }] });
    if (existingOwner) return res.status(409).json({ success: false, message: 'Owner ID or Username already taken.' });

    const existingEmail = await ParkingOwner.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const newOwner = new ParkingOwner({
      owner_id: finalOwnerId, username: finalUsernameOwner, password,
      full_name, email, lot_name, location,
      total_slots: parseInt(total_slots) || 0,
      role: 'parking_owner', status: 'active'
    });

    await newOwner.save();
    res.status(201).json({ success: true, message: 'Parking Owner account created successfully!' });

  } catch (err) {
    console.error('[REGISTER OWNER ERROR]', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} already in use.` });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
