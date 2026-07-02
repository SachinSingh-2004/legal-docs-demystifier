const jwt = require('jsonwebtoken');
const authService = require('../modules/auth/auth.service');
const User = require('../models/User');

jest.mock('../models/User');
jest.mock('jsonwebtoken');

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully sign up a new user', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'mockUserId',
        name: 'John Doe',
        email: 'john@example.com',
        verified: false,
        verificationToken: 'mockToken'
      });

      const result = await authService.signup({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'mockUserId');
      expect(result.name).toBe('John Doe');
      expect(result.verified).toBe(false);
    });

    it('should throw an error if the email is already registered', async () => {
      User.findOne.mockResolvedValue({ email: 'john@example.com' });

      await expect(
        authService.signup({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        })
      ).rejects.toThrow('Email is already registered');
    });
  });

  describe('login', () => {
    it('should verify password and return user details and tokens', async () => {
      const mockUser = {
        _id: 'mockUserId',
        name: 'John Doe',
        email: 'john@example.com',
        verified: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');

      const result = await authService.login('john@example.com', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(mockUser.refreshToken).toBe('refresh_token');
    });

    it('should throw an error for invalid email', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        authService.login('wrong@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error for incorrect password', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.login('john@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyEmail', () => {
    it('should set verified to true and remove verification token', async () => {
      const mockUser = {
        email: 'john@example.com',
        verified: false,
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.verifyEmail('mockToken');

      expect(User.findOne).toHaveBeenCalledWith({ verificationToken: 'mockToken' });
      expect(mockUser.verified).toBe(true);
      expect(mockUser.verificationToken).toBeUndefined();
      expect(result.email).toBe('john@example.com');
    });
  });
});
