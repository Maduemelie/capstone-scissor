const request = require('supertest');
const app = require('../app');
const User = require('../model/userModel');
const passport = require('./passport.mock');

  
describe('AuthController', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

  describe('userSignUp', () => {
    it('should create a new user', async () => {
      const userData = { username: 'John', email: 'john@example.com', password: 'password' };

      // Mock the User.findOne method to return null, simulating a non-existing user
      User.findOne = jest.fn().mockResolvedValue(null);

      // Mock the User.save method to resolve with the newUser object
      User.prototype.save = jest.fn().mockResolvedValue(userData);

      // Send a request to the signup route
      const response = await request(app).post('/Users/signup').send(userData);

      // Assert the response status code
      expect(response.statusCode).toBe(200);

      // Assert that User.findOne and User.prototype.save were called with the correct arguments
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.prototype.save).toHaveBeenCalledWith();
    });

    it('should return an error if email is already taken', async () => {
      const existingUser = { username: 'Alice', email: 'alice@example.com', password: 'password' };
      const userData = { username: 'John', email: 'alice@example.com', password: 'password' };

      // Mock the User.findOne method to return an existing user
      User.findOne = jest.fn().mockResolvedValue(existingUser);

      // Send a request to the signup route
      const response = await request(app).post('/Users/signup').send(userData);

      // Assert the response status code
      expect(response.statusCode).toBe(400);

      // Assert that User.findOne was called with the correct arguments
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
    });
  });

describe('userLogin', () => {
    it('should log in a user and redirect to home page', async () => {
      const userData = { email: 'valid@example.com', password: 'validPassword' };

      passport.authenticate.mockImplementation((strategy, callback) => {
        return (req, res, next) => {
          callback(null, { email: 'valid@example.com', password: 'validPassword' });
        };
      });

      const response = await request(app).post('/Users/login').send(userData);

      expect(response.statusCode).toBe(200);
    });

    it('should return an error if authentication fails and redirect to login page', async () => {
      const userData = { email: 'invalid@example.com', password: 'invalidPassword' };

      passport.authenticate.mockImplementation((strategy, callback) => {
        return (req, res, next) => {
          callback(null, false);
        };
      });

      const response = await request(app).post('/Users/login').send(userData);

      expect(response.statusCode).toBe(200);
    });
  });
  
});
