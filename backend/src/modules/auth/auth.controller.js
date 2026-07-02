const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const result = await authService.signup({ name, email, password });
    res.status(201).json({ success: true, user: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    const result = await authService.refreshAccessToken(refreshToken);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    const result = await authService.verifyEmail(token);
    res.json({ success: true, message: 'Email verified successfully', data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.forgotPassword(email);
    res.json({ success: true, message: 'Password reset code generated', token: result.resetToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    const result = await authService.resetPassword(token, password);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const result = await authService.updateProfile(req.user.id, { name, password });
    res.json({ success: true, user: result, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
};
