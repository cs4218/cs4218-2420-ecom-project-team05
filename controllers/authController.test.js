import { jest } from "@jest/globals";
import { registerController, loginController, forgotPasswordController, updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from "./authController";
import { hashPassword } from '../helpers/authHelper';
import { comparePassword } from '../helpers/authHelper';

import userModel from "../models/userModel";
import orderModel from '../models/orderModel';
import validator from 'validator';
import JWT from 'jsonwebtoken';

jest.mock("../models/userModel.js");
jest.mock('../models/orderModel');
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
      error: 'Passsword is required and 6 characters long'
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
      message: 'Profile Updated Successfully',
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
      message: 'Error While Updating profile',
      error: expect.any(Error)
    });
  });
});

describe('getOrdersController unit tests', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      user: { _id: '123' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should successfully retrieve user orders', async () => {
    const mockOrders = [
      {
        _id: '1',
        products: [
          { name: 'Product 1', price: 100 },
          { name: 'Product 2', price: 200 }
        ],
        buyer: {
          name: 'John Doe'
        }
      }
    ];

    // Mock the chain of mongoose methods
    orderModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrders)
      })
    });

    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({ buyer: '123' });
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it('should handle errors when retrieving orders', async () => {
    const mockError = new Error('Database error');
    
    // Mock the chain of mongoose methods with error
    orderModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(mockError)
      })
    });

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error While Getting Orders',
      error: mockError
    });
  });

  it('should populate correct fields excluding photo', async () => {
    // Create mock functions for chained populate calls
    const secondPopulateMock = jest.fn().mockResolvedValue([]);
    const firstPopulateMock = jest.fn().mockReturnValue({
      populate: secondPopulateMock
    });
    
    // Setup the initial find chain
    orderModel.find.mockReturnValue({
      populate: firstPopulateMock
    });

    await getOrdersController(req, res);

    // Verify the chain of populate calls
    expect(firstPopulateMock).toHaveBeenCalledWith('products', '-photo');
    expect(secondPopulateMock).toHaveBeenCalledWith('buyer', 'name');
  });
});

describe('getAllOrdersController unit tests', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should successfully retrieve all orders', async () => {
    const mockOrders = [
      {
        _id: '1',
        products: [
          { name: 'Product 1', price: 100 },
          { name: 'Product 2', price: 200 }
        ],
        buyer: {
          name: 'John Doe'
        },
        createdAt: new Date('2024-02-16')
      },
      {
        _id: '2',
        products: [
          { name: 'Product 3', price: 300 }
        ],
        buyer: {
          name: 'Jane Doe'
        },
        createdAt: new Date('2024-02-15')
      }
    ];

    const sortMock = jest.fn().mockResolvedValue(mockOrders);
    const secondPopulateMock = jest.fn().mockReturnValue({ sort: sortMock });
    const firstPopulateMock = jest.fn().mockReturnValue({
      populate: secondPopulateMock
    });

    orderModel.find.mockReturnValue({
      populate: firstPopulateMock
    });

    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(firstPopulateMock).toHaveBeenCalledWith('products', '-photo');
    expect(secondPopulateMock).toHaveBeenCalledWith('buyer', 'name');
    expect(sortMock).toHaveBeenCalledWith({ createdAt: '-1' });
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it('should sort orders by creation date in descending order', async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    const secondPopulateMock = jest.fn().mockReturnValue({ sort: sortMock });
    const firstPopulateMock = jest.fn().mockReturnValue({
      populate: secondPopulateMock
    });

    orderModel.find.mockReturnValue({
      populate: firstPopulateMock
    });

    await getAllOrdersController(req, res);

    expect(sortMock).toHaveBeenCalledWith({ createdAt: '-1' });
  });

  it('should handle database errors', async () => {
    const mockError = new Error('Database error');
    
    // Create mock functions for the failed chain
    const sortMock = jest.fn().mockRejectedValue(mockError);
    const secondPopulateMock = jest.fn().mockReturnValue({ sort: sortMock });
    const firstPopulateMock = jest.fn().mockReturnValue({
      populate: secondPopulateMock
    });

    // Setup the chain that will throw error
    orderModel.find.mockReturnValue({
      populate: firstPopulateMock
    });

    await getAllOrdersController(req, res);

    // Verify error handling
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error While Getting Orders',
      error: expect.any(Error)
    });
  });
});

describe('orderStatusController unit tests', () => {
  let req;
  let res;
  let consoleLogSpy;
  
  beforeEach(() => {
    req = {
      params: { orderId: '123' },
      body: { status: 'Processing' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    consoleLogSpy = jest.spyOn(console, 'log');
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should successfully update order status', async () => {
    const mockUpdatedOrder = {
      _id: '123',
      status: 'Processing',
      products: [
        { name: 'Product 1', price: 100 }
      ]
    };

    orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '123',
      { status: 'Processing' },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });

  it('should handle non-existent order', async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue(null);

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '123',
      { status: 'Processing' },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(null);
  });

  it('should handle database errors', async () => {
    const mockError = new Error('Database error');
    orderModel.findByIdAndUpdate.mockRejectedValue(mockError);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error While Updating Order',
      error: expect.any(Error)
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });

  it('should handle missing orderId parameter', async () => {
    req.params = {};
    const mockError = new Error('Cannot read properties of undefined');
    
    orderModel.findByIdAndUpdate.mockRejectedValue(mockError);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error While Updating Order',
      error: expect.any(Error)
    });
  });
});
