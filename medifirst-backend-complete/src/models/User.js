const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First name is required'], trim: true },
  lastName: { type: String, required: [true, 'Last name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, trim: true, lowercase: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  phoneNumber: { type: String, trim: true },
  profileImage: { type: String, default: null },
  medicalProfile: {
    bloodType: { type: String, enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-','Unknown'], default: 'Unknown' },
    allergies: [String],
    medicalConditions: [String],
    medications: [String],
    weight: Number,
    height: Number
  },
  emergencyContacts: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: String
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },

  // ── Forgot password ──
  resetPasswordToken:   { type: String,  default: undefined },
  resetPasswordExpires: { type: Date,    default: undefined },

}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);