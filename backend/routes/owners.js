const express      = require('express');
const jwt          = require('jsonwebtoken');
const router       = express.Router();
const ParkingOwner = require('../models/ParkingOwner');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
}

// GET all owners (admin only)
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const owners = await ParkingOwner.find({}, '-password');
    res.json({ success: true, owners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add owner (admin only)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { owner_id, username, password, full_name, email, lot_name, location, total_slots } = req.body;
    if (!owner_id || !username || !password) return res.status(400).json({ success: false, message: 'owner_id, username, and password are required.' });
    const existing = await ParkingOwner.findOne({ $or: [{ owner_id }, { username }] });
    if (existing) return res.status(409).json({ success: false, message: 'Owner ID or username already exists.' });
    const owner = new ParkingOwner({ owner_id, username, password, full_name, email, lot_name, location, total_slots });
    await owner.save();
    res.status(201).json({ success: true, message: 'Parking owner added.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE owner (admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await ParkingOwner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Owner deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET owner's own slots
router.get('/my-slots', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'parking_owner') return res.status(403).json({ message: 'Owner access required.' });
    const owner = await ParkingOwner.findById(req.user.id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });
    res.json({ success: true, slots: owner.slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET specific parking lot by ID
router.get('/lot/:id', async (req, res) => {
  try {
    const owner = await ParkingOwner.findById(req.params.id, '-password');
    if (!owner) return res.status(404).json({ success: false, message: 'Parking lot not found' });
    res.json({ success: true, lot: owner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update slot status
router.put('/update-slot', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'parking_owner') return res.status(403).json({ message: 'Owner access required.' });
    const { slot_id, status } = req.body;
    if (!slot_id || !status) return res.status(400).json({ message: 'slot_id and status are required' });
    
    const owner = await ParkingOwner.findById(req.user.id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });
    
    const slot = owner.slots.find(s => s.id === slot_id);
    if (slot) {
      slot.status = status;
    } else {
      owner.slots.push({ id: slot_id, status });
    }
    
    await owner.save();
    res.json({ success: true, message: 'Slot updated', slots: owner.slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
