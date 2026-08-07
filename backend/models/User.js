const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true },
  password:       { type: String, required: true, minlength: 6 },
  first_name:     { type: String, required: true, trim: true },
  last_name:      { type: String, required: true, trim: true },
  full_name:      { type: String, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:          { type: String, trim: true, default: '' },
  vehicle_number: { type: String, required: true, trim: true, uppercase: true },
  vehicle_type:   { type: String, enum: ['car','bike','ev'], default: 'car' },
  role:           { type: String, default: 'user' },
  status:         { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true });

// Mongoose 8 compatible – no `next` param on async pre hooks
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
