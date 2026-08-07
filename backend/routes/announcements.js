const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST a new announcement
router.post('/', async (req, res) => {
  try {
    const { title, type, body, lot, expiry } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const newAnnouncement = await Announcement.create({
      title,
      type,
      body,
      lot,
      expiry
    });

    res.status(201).json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE an announcement
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
