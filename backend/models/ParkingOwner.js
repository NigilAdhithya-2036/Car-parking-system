const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const ownerSchema = new mongoose.Schema({
  owner_id:    { type: String, required: true, unique: true },
  username:    { type: String, required: true, unique: true, trim: true },
  password:    { type: String, required: true },
  full_name:   { type: String, trim: true },
  email:       { type: String, lowercase: true, trim: true },
  lot_name:    { type: String, trim: true, default: 'Parking Lot' },
  location:    { type: String, trim: true, default: '' },
  total_slots: { type: Number, default: 50 },
  pricePerHour: { type: Number, default: 50 },
  slots: [
    {
      id: { type: String, required: true },
      status: { type: String, enum: ['available', 'occupied'], default: 'available' }
    }
  ],
  role:        { type: String, default: 'parking_owner' },
  status:      { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true });

// Mongoose 8 compatible – no `next` param on async pre hooks
ownerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

ownerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('ParkingOwner', ownerSchema);
