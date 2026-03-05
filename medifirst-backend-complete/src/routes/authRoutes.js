const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  showResetPasswordPage,
  resetPassword,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        authMiddleware, getMe);
router.post('/logout',   authMiddleware, logout);

// Forgot password — user submits email from the app
router.post('/forgot-password', forgotPassword);

// Reset password — email link opens this page in browser
router.get('/reset-password/:token',  showResetPasswordPage);

// Reset password — page form submits new password here
router.post('/reset-password/:token', resetPassword);

module.exports = router;