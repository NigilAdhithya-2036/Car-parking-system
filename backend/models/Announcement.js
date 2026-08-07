const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['promo', 'info', 'warning', 'alert', 'general', 'slot'],
    default: 'info'
  },
  body: {
    type: String,
    required: true,
  },
  lot: {
    type: String,
    default: ''
  },
  expiry: {
    type: String,
    default: 'Indefinite'
  }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
