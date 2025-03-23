import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from "../app";
import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js';
import orderModel from '../models/orderModel.js';
import categoryModel from '../models/categoryModel.js';

describe('User Flow Integration Tests', () => {
  let mongoServer;
  let userToken;
  let userId;
  let productId;
  let categoryId;

  beforeAll(async () => {
    // Create new MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Create a test category first since it's needed for products
    const category = await new categoryModel({
      name: 'Test Category',
      slug: 'test-category'
    }).save();
    categoryId = category._id;
  });

  afterAll(async () => {
    // Cleanup and close connection
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await userModel.deleteMany({});
    await productModel.deleteMany({});
    await orderModel.deleteMany({});
  });

  describe('Password Reset Flow', () => {
    const testUser = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'oldpassword123',
      phone: '1234567890',
      address: '123 Test St',
      answer: 'my secret answer'
    };

    it('should complete the full password reset flow', async () => {
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.email).toBe(testUser.email);

      // Step 2: Reset password
      const resetResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: testUser.email,
          answer: testUser.answer,
          newPassword: 'newpassword123'
        });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.success).toBe(true);
      expect(resetResponse.body.message).toBe('Password Reset Successfully');

      // Step 3: Verify new password works
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body).toHaveProperty('token');
    });
  });

  describe('Profile Update Flow', () => {
    const testUser = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
      address: '123 Test St',
      answer: 'my secret answer'
    };

    const updatedInfo = {
      name: 'John Updated',
      password: 'newpassword123',
      phone: '9876543210',
      address: '456 New St'
    };

    it('should successfully update user profile', async () => {
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);

      // Step 2: Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      // Step 3: Update profile
      const updateResponse = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', token)
        .send(updatedInfo);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.message).toBe('Profile Updated Successfully');
      expect(updateResponse.body.updatedUser).toMatchObject({
        name: updatedInfo.name,
        phone: updatedInfo.phone,
        address: updatedInfo.address
      });

      // Step 4: Verify login with new password works
      const newLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: updatedInfo.password
        });

      expect(newLoginResponse.status).toBe(200);
      expect(newLoginResponse.body.success).toBe(true);
      expect(newLoginResponse.body.user).toMatchObject({
        name: updatedInfo.name,
        phone: updatedInfo.phone,
        address: updatedInfo.address
      });
    });

    it('should not update profile with invalid password length', async () => {
      // Register and login first
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const token = loginResponse.body.token;

      // Attempt to update with short password
      const updateResponse = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', token)
        .send({
          ...updatedInfo,
          password: '12345' // Less than 6 characters
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.error).toBe('Passsword is required and 6 characters long');
    });
  });

});
