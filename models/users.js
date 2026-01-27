const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    nationalId: { type: String, required: true, unique: true },
    isPhoneVerified: { type: Boolean, default: false },
    isNationalIdVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    loginOtp: String,
    otpExpires: Date
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);