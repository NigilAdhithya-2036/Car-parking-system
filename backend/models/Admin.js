const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  admin_id:  { type: String, required: true, unique: true },
  username:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  full_name: { type: String, default: 'System Administrator' },
  email:     { type: String, default: 'admin@carparking.com' },
  role:      { type: String, default: 'admin' },
}, { timestamps: true });

// Mongoose 8 compatible – no `next` param on async pre hooks
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
