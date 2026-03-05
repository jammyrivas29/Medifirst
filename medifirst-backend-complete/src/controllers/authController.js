const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// ─────────────────────────────────────────────────────────────────────────────
// Creates email transporter
// Development → uses Ethereal (free fake inbox, no setup needed)
// Production  → uses your real Gmail
// ─────────────────────────────────────────────────────────────────────────────
const createTransporter = async () => {
  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      }),
      isTest: true,
    };
  }

  return {
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    }),
    isTest: false,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { firstName, lastName, email, password, phoneNumber } = req.body;

    // ── 1. Check duplicate email ─────────────────────────────────────────────
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail)
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use a different email.',
      });

    // ── 2. Check duplicate full name (case-insensitive) ──────────────────────
    //    We use a regex so "juan dela cruz" == "Juan Dela Cruz" == "JUAN DELA CRUZ"
    const existingName = await User.findOne({
      firstName: { $regex: new RegExp(`^${firstName.trim()}$`, 'i') },
      lastName:  { $regex: new RegExp(`^${lastName.trim()}$`,  'i') },
    });
    if (existingName)
      return res.status(400).json({
        success: false,
        message: `The name "${firstName} ${lastName}" is already registered. Each full name must be unique.`,
      });

    // ── 3. Create user ───────────────────────────────────────────────────────
    const user  = await User.create({ firstName, lastName, email: email.toLowerCase(), password, phoneNumber });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id:          user._id,
        firstName:   user.firstName,
        lastName:    user.lastName,
        email:       user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id:             user._id,
        firstName:      user.firstName,
        lastName:       user.lastName,
        email:          user.email,
        phoneNumber:    user.phoneNumber,
        medicalProfile: user.medicalProfile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user: {
        id:                user._id,
        firstName:         user.firstName,
        lastName:          user.lastName,
        email:             user.email,
        phoneNumber:       user.phoneNumber,
        profileImage:      user.profileImage,
        medicalProfile:    user.medicalProfile,
        emergencyContacts: user.emergencyContacts,
        createdAt:         user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.BACKEND_URL}/api/auth/reset-password/${resetToken}`;

    const { transporter, isTest } = await createTransporter();

    const info = await transporter.sendMail({
      from:    `"MediFirst" <${isTest ? 'noreply@medifirst.com' : process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: '🔑 MediFirst — Reset Your Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:#e74c3c;padding:28px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">🏥 MediFirst</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">First Aid & Emergency Assistance</p>
          </div>
          <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #f0f0f0;">
            <h2 style="color:#1a1a2e;margin-top:0;">Reset Your Password</h2>
            <p style="color:#666;line-height:1.6;">
              Hi <strong>${user.firstName}</strong>,<br><br>
              We received a request to reset the password for your MediFirst account.
              Click the button below to set a new password.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}"
                style="background:#e74c3c;color:#fff;text-decoration:none;
                       padding:14px 32px;border-radius:10px;font-size:15px;
                       font-weight:bold;display:inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color:#999;font-size:12px;line-height:1.6;">
              ⏰ This link expires in <strong>1 hour</strong>.<br>
              🔒 If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0;">
            <p style="color:#bbb;font-size:11px;text-align:center;">MediFirst · First Aid & Emergency App</p>
          </div>
        </div>
      `,
    });

    if (isTest) {
      console.log('');
      console.log('📧 ═══════════════════════════════════════════════');
      console.log('📧  TEST EMAIL SENT (Ethereal — not real Gmail)');
      console.log('📧  Open this URL in your browser to see the email:');
      console.log('📧 ', nodemailer.getTestMessageUrl(info));
      console.log('📧 ═══════════════════════════════════════════════');
      console.log('');
    }

    res.status(200).json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
exports.showResetPasswordPage = async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken:   hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.send(`
      <!DOCTYPE html><html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MediFirst — Link Expired</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:Arial,sans-serif; background:#f5f6f8; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
          .card { background:#fff; border-radius:20px; padding:40px 32px; max-width:400px; width:100%; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.1); }
          .icon { font-size:60px; margin-bottom:20px; }
          h2 { color:#1a1a2e; font-size:22px; margin-bottom:12px; }
          p { color:#888; line-height:1.7; font-size:14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⏰</div>
          <h2>Link Expired</h2>
          <p>This password reset link has expired or already been used.<br><br>Open the <strong>MediFirst app</strong> and tap <em>Forgot Password</em> to request a new link.</p>
        </div>
      </body></html>
    `);
  }

  res.send(`
    <!DOCTYPE html><html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MediFirst — Reset Password</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; background:#f5f6f8; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
        .wrapper { width:100%; max-width:420px; }
        .header { background:#e74c3c; padding:26px 28px; border-radius:16px 16px 0 0; text-align:center; }
        .header h1 { color:#fff; font-size:22px; margin-bottom:4px; }
        .header p { color:rgba(255,255,255,0.8); font-size:12px; }
        .card { background:#fff; padding:32px; border-radius:0 0 16px 16px; box-shadow:0 10px 40px rgba(0,0,0,0.1); }
        .card h2 { color:#1a1a2e; font-size:20px; margin-bottom:6px; }
        .card .sub { color:#aaa; font-size:13px; margin-bottom:24px; line-height:1.5; }
        label { display:block; font-size:12px; font-weight:700; color:#555; margin-bottom:7px; }
        .input-wrap { position:relative; margin-bottom:14px; }
        input { width:100%; padding:14px; border:1.5px solid #ececec; border-radius:10px; font-size:15px; color:#1a1a2e; background:#f8f9fa; outline:none; transition:border 0.2s; }
        input:focus { border-color:#e74c3c; background:#fff; }
        .strength { display:flex; align-items:center; gap:10px; margin:-6px 0 16px; }
        .bar { flex:1; height:4px; border-radius:2px; background:#eee; transition:background 0.3s; }
        .bar-label { font-size:11px; color:#888; font-weight:600; min-width:65px; }
        button { width:100%; padding:15px; background:#e74c3c; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:800; cursor:pointer; box-shadow:0 4px 15px rgba(231,76,60,0.3); transition:opacity 0.2s; margin-top:6px; }
        button:hover { opacity:0.88; }
        button:disabled { opacity:0.5; cursor:not-allowed; }
        .error { background:#fdecea; color:#c0392b; padding:12px 14px; border-radius:10px; font-size:13px; margin-bottom:16px; border-left:4px solid #e74c3c; display:none; }
        .success { display:none; text-align:center; padding:10px 0; }
        .success .s-icon { font-size:60px; margin-bottom:16px; }
        .success h2 { color:#27ae60; margin-bottom:10px; }
        .success p { color:#666; font-size:14px; line-height:1.7; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🏥 MediFirst</h1>
          <p>First Aid & Emergency Assistance</p>
        </div>
        <div class="card">
          <div class="success" id="successState">
            <div class="s-icon">✅</div>
            <h2>Password Updated!</h2>
            <p>Your password has been reset successfully.<br><br>Go back to the <strong>MediFirst app</strong> and sign in with your new password.</p>
          </div>
          <div id="formState">
            <h2>Set New Password</h2>
            <p class="sub">Hi <strong>${user.firstName}</strong>, enter and confirm your new password below.</p>
            <div class="error" id="errorBox"></div>
            <label>New Password</label>
            <div class="input-wrap">
              <input type="password" id="password" placeholder="At least 6 characters" oninput="checkStrength()" />
            </div>
            <div class="strength">
              <div class="bar" id="bar"></div>
              <span class="bar-label" id="barLabel"></span>
            </div>
            <label>Confirm Password</label>
            <div class="input-wrap">
              <input type="password" id="confirmPassword" placeholder="Re-enter new password" />
            </div>
            <button id="btn" onclick="submitReset()">Reset Password</button>
          </div>
        </div>
      </div>
      <script>
        function checkStrength() {
          const pw = document.getElementById('password').value;
          const bar = document.getElementById('bar');
          const label = document.getElementById('barLabel');
          if (!pw) { bar.style.background='#eee'; label.textContent=''; return; }
          if (pw.length >= 8) { bar.style.background='#27ae60'; label.textContent='✓ Strong'; }
          else if (pw.length >= 6) { bar.style.background='#f39c12'; label.textContent='~ Fair'; }
          else { bar.style.background='#e74c3c'; label.textContent='✗ Too short'; }
        }
        async function submitReset() {
          const password = document.getElementById('password').value;
          const confirm  = document.getElementById('confirmPassword').value;
          const errorBox = document.getElementById('errorBox');
          const btn      = document.getElementById('btn');
          errorBox.style.display = 'none';
          if (!password || password.length < 6) {
            errorBox.textContent = 'Password must be at least 6 characters.';
            errorBox.style.display = 'block'; return;
          }
          if (password !== confirm) {
            errorBox.textContent = 'Passwords do not match.';
            errorBox.style.display = 'block'; return;
          }
          btn.disabled = true;
          btn.textContent = 'Updating...';
          try {
            const res = await fetch('/api/auth/reset-password/${token}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (data.success) {
              document.getElementById('formState').style.display = 'none';
              document.getElementById('successState').style.display = 'block';
            } else {
              errorBox.textContent = data.message || 'Something went wrong.';
              errorBox.style.display = 'block';
              btn.disabled = false;
              btn.textContent = 'Reset Password';
            }
          } catch (e) {
            errorBox.textContent = 'Network error. Please try again.';
            errorBox.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Reset Password';
          }
        }
      </script>
    </body></html>
  `);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired. Please request a new one.' });

    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now sign in.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};