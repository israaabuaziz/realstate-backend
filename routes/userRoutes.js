const express = require('express');
const router = express.Router();
const User = require('../models/users');
const CivilRegistry = require('../models/CivilRegistry');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


    router.post('/register', async (req, res) => {
    const { fullName, password, confirmPassword, nationalId, phoneNumber } = req.body;

    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [ { nationalId }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    // 1. Check if the ID exists in the Civil Registry
    const idExists = await CivilRegistry.findOne({ nationalId: nationalId });

        if (!idExists) {
            return res.status(404).json({ 
            error: "Registration failed. National ID isn't correct." 
            });
        }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
        fullName,
        password: hashedPassword,
        phoneNumber,
        nationalId,
        verificationCode
    });

    await user.save();


    res.status(201).json({ message: "User registered" });
    });


// LOGIN → SEND OTP
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ $or: [{ phoneNumber }] });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user
    user.loginOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    await user.save();

    // FREE OTP (console log)
    console.log(`🔐 Login OTP for ${user.phoneNumber}: ${otp}`);

    res.json({
        message: "OTP sent (Check server console)",
        userId: user._id
    });
});


// VERIFY LOGIN OTP → ISSUE TOKEN
router.post('/verify-login-otp', async (req, res) => {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    console.log("📦 Saved OTP:", user.loginOtp);
    console.log("📩 Received OTP:", otp);

    // Convert both to string & trim spaces
    const savedOtp = user.loginOtp?.toString().trim();
    const receivedOtp = otp?.toString().trim();

    if (!savedOtp || savedOtp !== receivedOtp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
        return res.status(400).json({ message: "OTP expired" });
    }

    // Clear OTP
    user.loginOtp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });

    res.json({
        token,
        message: "Login successful"
    });
});


module.exports = router;