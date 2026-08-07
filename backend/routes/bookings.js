const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Booking = require('../models/Booking');
const ParkingOwner = require('../models/ParkingOwner');
const User = require('../models/User');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
}

// POST book a slot (for users)
router.post('/book', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'user' && req.user.role !== 'admin') return res.status(403).json({ message: 'User access required.' });
    
    const { slot_id, owner_id } = req.body;
    if (!slot_id || !owner_id) return res.status(400).json({ message: 'slot_id and owner_id are required' });

    // Find the owner and the specific slot
    const owner = await ParkingOwner.findById(owner_id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });
    
    const slot = owner.slots.find(s => s.id === slot_id);
    if (!slot || slot.status !== 'available') return res.status(400).json({ message: 'Slot is not available' });

    // Mark slot as occupied
    slot.status = 'occupied';
    await owner.save();

    // Create booking record
    const booking = new Booking({
      user_id: req.user.id,
      owner_id: owner_id,
      slot_id: slot_id
    });
    await booking.save();

    res.status(201).json({ success: true, message: 'Slot booked successfully', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all bookings for a specific owner
router.get('/owner', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'parking_owner') return res.status(403).json({ message: 'Owner access required.' });
    
    const bookings = await Booking.find({ owner_id: req.user.id })
      .populate('user_id', 'full_name vehicle_number email phone')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// GET all bookings for a specific user
router.get('/user', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'user' && req.user.role !== 'admin') return res.status(403).json({ message: 'User access required.' });
    
    const bookings = await Booking.find({ user_id: req.user.id })
      .populate('owner_id', 'lot_name location')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
