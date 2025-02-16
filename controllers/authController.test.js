import { jest } from "@jest/globals";
import { registerController, loginController, forgotPasswordController, updateProfileController } from "./authController";
import { hashPassword } from '../helpers/authHelper';
import { comparePassword } from '../helpers/authHelper';

import userModel from "../models/userModel";
import validator from 'validator';
import JWT from 'jsonwebtoken';

jest.mock("../models/userModel.js");
jest.mock('../helpers/authHelper');
jest.mock('jsonwebtoken');
jest.mock('validator', () => ({
  isEmail: jest.fn(),
}));

describe("registerController test", () => {
  let req, res;

  var validEmail = "test@example.com";
  var validName = "John Doe";
  var validSecret = "secret123";
  var validPhone = "12345678";

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('should return error if name is missing', async () => {
    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
  });

  test('should return message if email is missing', async () => {
    req.body.name = validName;
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: 'Email is Required' });
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test('should return 400 if email is invalid', async () => {
    req.body.name = validName;
    req.body.email = 'invalid-email';
    validator.isEmail.mockReturnValueOnce(false);

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Invalid email format');
  });

  test('should return error if password is missing', async () => {
    req.body.name = validName;
    req.body.email = validEmail;
    validator.isEmail.mockReturnValueOnce(true);

    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: 'Password is Required' });
  });

  test('should return error if phone is missing', async () => {
    req.body = {
      name: validName,
      email: validEmail,
      password: validSecret,
    };
    validator.isEmail.mockReturnValueOnce(true);

    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: 'Phone number is Required' });
  });

  test('should return error if address is missing', async () => {
    req.body = {
      name: validName,
      email: validEmail,
      password: validSecret,
      phone: validPhone,
    };
    validator.isEmail.mockReturnValueOnce(true);

    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: 'Address is Required' });
  });

  test('should return error if answer is missing', async () => {
    req.body = {
      name: validName,
      email: validEmail,
      password: validSecret,
      phone: validPhone,
      address: 'Main Street',
    };
    validator.isEmail.mockReturnValueOnce(true);

    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: 'Answer is Required' });
  });

  test('should handle existing user', async () => {
    req.body = {
      name: validName,
      email: validEmail,
      password: validSecret,
      phone: validPhone,
      address: 'Main Street',
      answer: 'some answer',
    };
    validator.isEmail.mockReturnValueOnce(true);
    userModel.findOne.mockResolvedValueOnce({ email: validEmail });

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Already Register please login',
    });
  });

  test('should register a new user successfully', async () => {
    req.body = {
      name: validName,
      email: validEmail,
      password: validSecret,
      phone: validPhone,
      address: 'Main Street',
      answer: 'some answer',
    };
    validator.isEmail.mockReturnValueOnce(true);
    userModel.findOne.mockResolvedValueOnce(null); // no existing user
    hashPassword.mockResolvedValueOnce('hashedpass');

    userModel.mockImplementationOnce(() => ({
      save: jest.fn().mockResolvedValue({
        name: validName,
        email: validEmail,
      }),
    }));

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'User Register Successfully',
      user: expect.objectContaining({
        name: validName,
        email: validEmail,
      }),
    });
  });

  test('should handle an unexpected error', async () => {
    req.body = {
      name: validName,
      email: validEmail,
      password: validSecret,
      phone: validPhone,
      address: 'Main Street',
      answer: 'some answer',
    };
    validator.isEmail.mockReturnValueOnce(true);
    userModel.findOne.mockRejectedValueOnce(new Error('DB Error'));

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error in Registration',
      error: expect.any(Error),
    });
  });
});

describe('loginController test', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should return error if email or password is missing', async () => {
    await loginController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid email or password'
    });
  });

  it('should return error if user is not found', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'password123'
    };
    userModel.findOne.mockResolvedValueOnce(null);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Email is not registerd'
    });
  });

  it('should return error if password does not match', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };
    const mockUser = {
      _id: '123',
      password: 'hashedpassword'
    };
    userModel.findOne.mockResolvedValueOnce(mockUser);
    comparePassword.mockResolvedValueOnce(false);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid Password'
    });
  });

  it('should login successfully with correct credentials', async () => {
    const mockUser = {
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address',
      role: 0,
      password: 'hashedpassword'
    };
    req.body = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    userModel.findOne.mockResolvedValueOnce(mockUser);
    comparePassword.mockResolvedValueOnce(true);
    JWT.sign.mockResolvedValueOnce('mocktoken');

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'login successfully',
      user: {
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        address: mockUser.address,
        role: mockUser.role
      },
      token: 'mocktoken'
    });
  });

  it('should handle unexpected errors', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'password123'
    };
    userModel.findOne.mockRejectedValueOnce(new Error('Database error'));

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error in login',
      error: expect.any(Error)
    });
  });
});

describe('forgotPasswordController tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should return error if email is missing', async () => {
    await forgotPasswordController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Email is required'
    });
  });

  it('should return error if answer is missing', async () => {
    req.body.email = 'test@example.com';
    
    await forgotPasswordController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'answer is required'
    });
  });

  it('should return error if new password is missing', async () => {
    req.body = {
      email: 'test@example.com',
      answer: 'test answer'
    };
    
    await forgotPasswordController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'New Password is required'
    });
  });

  it('should return error if user is not found', async () => {
    req.body = {
      email: 'test@example.com',
      answer: 'wrong answer',
      newPassword: 'newpass123'
    };
    userModel.findOne.mockResolvedValueOnce(null);

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Wrong Email Or Answer'
    });
  });

  it('should successfully reset password', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      answer: 'correct answer'
    };
    req.body = {
      email: 'test@example.com',
      answer: 'correct answer',
      newPassword: 'newpass123'
    };

    userModel.findOne.mockResolvedValueOnce(mockUser);
    hashPassword.mockResolvedValueOnce('hashedNewPassword');
    userModel.findByIdAndUpdate.mockResolvedValueOnce({});

    await forgotPasswordController(req, res);

    expect(hashPassword).toHaveBeenCalledWith('newpass123');
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockUser._id,
      { password: 'hashedNewPassword' }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Password Reset Successfully'
    });
  });

  it('should handle unexpected errors', async () => {
    req.body = {
      email: 'test@example.com',
      answer: 'test answer',
      newPassword: 'newpass123'
    };
    userModel.findOne.mockRejectedValueOnce(new Error('Database error'));

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong',
      error: expect.any(Error)
    });
  });
});

describe('updateProfileController unit tests', () => {
  let req;
  let res;
  const mockUser = {
    _id: '123',
    name: 'Original Name',
    email: 'test@example.com',
    phone: '1234567890',
    address: 'Original Address',
    password: 'originalHashedPassword'
  };

  beforeEach(() => {
    req = {
      user: { _id: '123' },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should return error if password is less than 6 characters', async () => {
    req.body = {
      password: '12345'
    };
    
    await updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: 'Passsword is required and 6 character long'
    });
  });

  it('should update profile with new password', async () => {
    req.body = {
      name: 'New Name',
      password: 'newpassword123',
      phone: '9876543210',
      address: 'New Address'
    };

    userModel.findById.mockResolvedValueOnce(mockUser);
    hashPassword.mockResolvedValueOnce('newHashedPassword');
    userModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockUser,
      ...req.body,
      password: 'newHashedPassword'
    });

    await updateProfileController(req, res);

    expect(hashPassword).toHaveBeenCalledWith('newpassword123');
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '123',
      {
        name: 'New Name',
        password: 'newHashedPassword',
        phone: '9876543210',
        address: 'New Address'
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Profile Updated SUccessfully',
      updatedUser: expect.any(Object)
    });
  });

  it('should update profile without password change', async () => {
    req.body = {
      name: 'New Name',
      phone: '9876543210',
      address: 'New Address'
    };

    userModel.findById.mockResolvedValueOnce(mockUser);
    userModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockUser,
      ...req.body
    });

    await updateProfileController(req, res);

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '123',
      {
        name: 'New Name',
        password: mockUser.password,
        phone: '9876543210',
        address: 'New Address'
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should maintain existing values if not provided in update', async () => {
    req.body = {
      name: 'New Name'
    };

    userModel.findById.mockResolvedValueOnce(mockUser);
    userModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockUser,
      name: 'New Name'
    });

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '123',
      {
        name: 'New Name',
        password: mockUser.password,
        phone: mockUser.phone,
        address: mockUser.address
      },
      { new: true }
    );
  });

  it('should handle errors during update', async () => {
    req.body = {
      name: 'New Name'
    };
    userModel.findById.mockRejectedValueOnce(new Error('Database error'));

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error WHile Update profile',
      error: expect.any(Error)
    });
  });
});
