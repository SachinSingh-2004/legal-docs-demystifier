const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models/User');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_jwt_secret',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'fallback_jwt_refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const signup = async (userData) => {
  const { name, email, password } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  // Create verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  const user = await User.create({
    name,
    email,
    password,
    verificationToken
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    verificationToken // returned in dev so UI can automatically complete flow
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user model
  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified
    },
    accessToken,
    refreshToken
  };
};

const logout = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }
  return true;
};

const refreshAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_jwt_refresh_secret');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new Error('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken(user._id);
    return { accessToken: newAccessToken };
  } catch (err) {
    throw new Error('Refresh token verification failed');
  }
};

const verifyEmail = async (token) => {
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  return { success: true, email: user.email };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found with this email');
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  return { resetToken }; // returned for dev usage
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new Error('Password reset token is invalid or has expired');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { success: true };
};

const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (updateData.name) {
    user.name = updateData.name;
  }

  if (updateData.password) {
    user.password = updateData.password;
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified
  };
};

module.exports = {
  signup,
  login,
  logout,
  refreshAccessToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile
};
