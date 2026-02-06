const express = require('express');
const router = express.Router();
const User = require('../models/users');
const CivilRegistry = require('../models/CivilRegistry');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = (req, res, next) => {
const token = req.headers['authorization']?.split(' ')[1];

if (!token) return res.status(401).json({ message: 'Access denied' });

jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
});
};
// REGISTER
router.post('/register', async (req, res) => {
    const { fullName, password, confirmPassword, nationalId, phoneNumber } = req.body;
    
    // Validation
    if (!fullName || !password || !confirmPassword || !nationalId || !phoneNumber) {
        return res.status(400).json({ 
            message: "جميع الحقول مطلوبة" 
        });
    }

    if (password !== confirmPassword) return res.status(400).json({ message: "كلمات المرور غير متطابقة" });

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ nationalId }] });
    if (existingUser) return res.status(400).json({ message: "الرقم القومي مسجل بالفعل" });
    
    // Check if the ID exists in the Civil Registry
    const idExists = await CivilRegistry.findOne({ nationalId: nationalId });
    if (!idExists) {
        return res.status(404).json({ 
            error: "فشل التسجيل. الرقم القومي غير صحيح." 
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
    res.status(201).json({ message: "تم إنشاء الحساب بنجاح" });
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

    console.log(`🔐 Login OTP for ${user.phoneNumber}: ${otp}`);

    // ✅ RETURN THE OTP TO FRONTEND
    res.json({
        message: "OTP sent (Check server console)",
        userId: user._id,
        otp: otp, 
        phoneNumber: user.phoneNumber
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

    const token = jwt.sign({ 
        id: user._id,
        phoneNumber: user.phoneNumber,
        nationalId: user.nationalId
    }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });

    res.json({
        token,
        user: {
            id: user._id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            nationalId: user.nationalId
        },
        message: "Login successful"
    });
});
// FORGOT PASSWORD - SEND OTP
router.post('/forgot-password', async (req, res) => {
    const { phoneNumber, nationalId } = req.body;

    // Validation
    if (!phoneNumber || !nationalId) {
        return res.status(400).json({ 
            message: "الرقم القومي ورقم الهاتف مطلوبان" 
        });
    }

    // Find user by phone number AND national ID
    const user = await User.findOne({ 
        phoneNumber, 
        nationalId 
    });
    
    if (!user) {
        return res.status(404).json({ 
            success: false,
            message: "لم يتم العثور على حساب مرتبط بهذه البيانات" 
        });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user with userId in session/context
    user.forgotPasswordOtp = otp;
    user.forgotPasswordOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Console log for testing
    console.log(`🔐 Forgot Password OTP for ${user.phoneNumber}: ${otp}`);

    res.json({
        success: true,
        message: "تم إرسال رمز التحقق لإعادة تعيين كلمة المرور",
        userId: user._id,
        phoneNumber: user.phoneNumber,
        otp: otp, 
    });
});

// VERIFY FORGOT PASSWORD OTP
router.post('/verify-forgot-password-otp', async (req, res) => {
    const { userId, otp } = req.body;

    // Validation
    if (!userId || !otp) {
        return res.status(400).json({ 
            success: false,
            message: "معرف المستخدم ورمز التحقق مطلوبان" 
        });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ 
            success: false,
            message: "المستخدم غير موجود" 
        });
    }

    console.log("📦 Saved Forgot Password OTP:", user.forgotPasswordOtp);
    console.log("📩 Received OTP:", otp);

    // Convert both to string & trim spaces
    const savedOtp = user.forgotPasswordOtp?.toString().trim();
    const receivedOtp = otp?.toString().trim();

    if (!savedOtp || savedOtp !== receivedOtp) {
        return res.status(400).json({ 
            success: false,
            message: "رمز التحقق غير صحيح" 
        });
    }

    if (user.forgotPasswordOtpExpires < Date.now()) {
        return res.status(400).json({ 
            success: false,
            message: "انتهت صلاحية رمز التحقق" 
        });
    }

    // Create a password reset token (valid for 10 minutes)
    const resetToken = jwt.sign(
        { 
            userId: user._id,
            purpose: 'password_reset',
            verified: true // Mark as OTP verified
        }, 
        process.env.JWT_SECRET + user.password, // User-specific secret
        { expiresIn: '10m' }
    );


    res.json({
        success: true,
        message: "تم التحقق من رمز التحقق بنجاح",
        resetToken, // Send token to frontend
        userId: user._id
    });
});

// RESET PASSWORD (after OTP verification)
router.post('/reset-password/:userId', async (req, res) => {
    const { userId } = req.params;  // <-- get userId from URL
    const { newPassword, confirmPassword } = req.body;

    // Validation
    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ 
            success: false,
            message: "جميع الحقول مطلوبة" 
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
            success: false,
            message: "كلمات المرور غير متطابقة" 
        });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ 
            success: false,
            message: "المستخدم غير موجود" 
        });
    }

    // Clear verification flags and OTP
    user.forgotPasswordOtp = null;
    user.forgotPasswordOtpExpires = null;
    user.isOtpVerified = false;
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await user.save();

    res.json({
        success: true,
        message: "تم إعادة تعيين كلمة المرور بنجاح"
    });
});

router.get('/get-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('loginOtp phoneNumber');
        
        if (!user) {
        return res.status(404).json({ message: "User not found" });
        }
        
        res.json({
        user: {
            loginOtp: user.loginOtp,
            phoneNumber: user.phoneNumber
        }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


// GET /users/profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -loginOtp');
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// PUT /users/update-profile
router.put('/update-profile', authenticateToken, async (req, res) => {
    try {
        const { fullName } = req.body;
        const user = await User.findById(req.user.id);
        
        if (fullName) user.fullName = fullName;
        await user.save();
        
        res.json({ message: 'تم تحديث البيانات بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
