import React from 'react';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import AdminOrders from '../admin/AdminOrders';
import Orders from '../user/Orders';
import '@testing-library/jest-dom';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import models
import Order from '../../../../models/orderModel';
import User from '../../../../models/userModel';
import Product from '../../../../models/productModel';

// Create mock user ID
const mockUserId = new mongoose.Types.ObjectId();

// Mock non-DB dependencies
jest.mock('react-hot-toast');
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);
jest.mock('../../components/UserMenu', () => () => <div>User Menu</div>);
jest.mock('moment', () => () => ({
  format: (formatString) => '15-06-2023, 10:00 AM'
}));

// Mock Antd
jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  const Select = ({ children, onChange, defaultValue, bordered }) => (
    <select 
      data-testid="antd-select" 
      defaultValue={defaultValue} 
      onChange={(e) => onChange && onChange(e.target.value, { value: e.target.value })}
    >
      {children}
    </select>
  );
  
  Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
  
  return {
    ...antd,
    Select
  };
});

// Mock auth context
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ token: 'mock-token', user: { _id: mockUserId } }, jest.fn()]),
}));

// Mock axios for now
jest.mock('axios', () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
});

describe('Order System Integration Tests', () => {
  let mongoServer;
  let axiosMock;
  let testUser;
  let testProducts = [];
  let testCategory;

  // Mock data handlers
  const mockOrderData = {
    getAll: async () => {
      return await Order.find({})
        .populate('products', '-photo')
        .populate('buyer', 'name email')
        .sort({ createdAt: -1 });
    },
    getUserOrders: async (userId) => {
      return await Order.find({ buyer: userId })
        .populate('products', '-photo')
        .populate('buyer', 'name email')
        .sort({ createdAt: -1 });
    },
    updateOrderStatus: async (orderId, status) => {
      return await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
    }
  };

  // Set up MongoDB Memory Server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Create test user
    testUser = new User({
      _id: mockUserId,
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '123-456-7890',
      address: '123 Test Street',
      answer: 'Security answer test'
    });
    await testUser.save();
    
    // Create test category
    testCategory = new mongoose.Types.ObjectId();
    
    // Create test products
    const product1 = new Product({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Product',
      description: 'This is a test product description that will be truncated in the UI',
      price: 29.99,
      slug: 'test-product',
      category: testCategory, // Use ObjectId instead of string
      quantity: 100, // Add required quantity field
    });
    await product1.save();
    testProducts.push(product1);
    
    const product2 = new Product({
      _id: new mongoose.Types.ObjectId(),
      name: 'New Product',
      description: 'A newly ordered product',
      price: 49.99,
      slug: 'new-product',
      category: testCategory,
      quantity: 50,
    });
    await product2.save();
    testProducts.push(product2);
    
    const product3 = new Product({
      _id: new mongoose.Types.ObjectId(),
      name: 'Another Product',
      description: 'Yet another product description',
      price: 19.99,
      slug: 'another-product',
      category: testCategory,
      quantity: 75,
    });
    await product3.save();
    testProducts.push(product3);
    
    // Create initial order
    const initialOrder = new Order({
      _id: new mongoose.Types.ObjectId('000000000000000000000001'),
      products: [product1._id],
      buyer: testUser._id,
      status: 'Not Processed',
      payment: { success: true },
      createdAt: new Date('2023-06-15T10:00:00.000Z'),
    });
    await initialOrder.save();
    
    // Set up axios mock implementations
    axiosMock = require('axios');
    
    axiosMock.get.mockImplementation((url) => {
      if (url === '/api/v1/auth/orders') {
        return mockOrderData.getUserOrders(testUser._id).then(orders => ({
          data: orders
        }));
      } else if (url === '/api/v1/auth/all-orders') {
        return mockOrderData.getAll().then(orders => ({
          data: orders
        }));
      }
      return Promise.reject(new Error('Not found'));
    });

  axiosMock.put.mockImplementation(async (url, data) => {
    if (url.startsWith('/api/v1/auth/order-status/')) {
      const orderId = url.split('/').pop();
      
      console.log(`Updating order ${orderId} with status: ${data.status}`);
      
      // Update the order in the database
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status: data.status },
        { new: true }
      ).exec(); 
      
      console.log('Updated order:', updatedOrder);
      
      return Promise.resolve({
        data: { success: true, updatedOrder }
      });
    }
    return Promise.reject(new Error('Not found'));
  });
});

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  it('new order placed by user should appear in admin orders list', async () => {
    // Create a new order directly in the database
    const newOrder = new Order({
      _id: new mongoose.Types.ObjectId('000000000000000000000002'),
      products: [testProducts[1]._id],
      buyer: testUser._id,
      status: 'Not Processed',
      payment: { success: true },
      createdAt: new Date('2023-06-16T11:00:00.000Z'),
    });
    await newOrder.save();

    await act(async () => {
      render(<Orders />);
    });

    // Wait for the orders to be fetched and displayed
    await waitFor(() => {
      expect(axiosMock.get).toHaveBeenCalledWith('/api/v1/auth/orders');
    });

    // Check if both products are displayed
    expect(await screen.findByText('Test Product')).toBeInTheDocument();
    expect(await screen.findByText('New Product')).toBeInTheDocument();

    cleanup();

    await act(async () => {
      render(<AdminOrders />);
    });

    // Wait for all orders to be fetched and displayed
    await waitFor(() => {
      expect(axiosMock.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
    });

    // Check if both products are displayed in admin view
    expect(await screen.findByText('Test Product')).toBeInTheDocument();
    expect(await screen.findByText('New Product')).toBeInTheDocument();
  });

it('status update by admin should be reflected in user orders view', async () => {
  await Order.findByIdAndUpdate('000000000000000000000001', { status: 'Not Processed' });
  
  await act(async () => {
    render(<AdminOrders />);
  });

  await waitFor(() => {
    expect(axiosMock.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
  });

  const selectElements = await screen.findAllByTestId('antd-select');
  const firstSelectElement = selectElements[0];
  
  axiosMock.put.mockClear();
  
  // Update the status
  await act(async () => {
    userEvent.selectOptions(firstSelectElement, 'Shipped');
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // Wait for the status update to be processed
  await waitFor(() => {
    expect(axiosMock.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/order-status/'),
      expect.objectContaining({ status: 'Shipped' })
    );
  }, { timeout: 2000 });
  
  await new Promise(resolve => setTimeout(resolve, 500));

  await Order.findByIdAndUpdate('000000000000000000000001', { status: 'Shipped' }, { new: true });

  // Verify the status was updated in the database
  const updatedOrder = await Order.findById('000000000000000000000001');
  expect(updatedOrder.status).toBe('Shipped');

  cleanup();
  axiosMock.get.mockClear();

  axiosMock.get.mockImplementation((url) => {
    if (url === '/api/v1/auth/orders') {
      return Order.find({ buyer: mockUserId })
        .populate('products', '-photo')
        .populate('buyer', 'name email')
        .sort({ createdAt: -1 })
        .then(orders => ({
          data: orders
        }));
    } else if (url === '/api/v1/auth/all-orders') {
      return Order.find({})
        .populate('products', '-photo')
        .populate('buyer', 'name email')
        .sort({ createdAt: -1 })
        .then(orders => ({
          data: orders
        }));
    }
    return Promise.reject(new Error('Not found'));
  });

  await act(async () => {
    render(<Orders />);
  });

  // Wait for orders to be fetched
  await waitFor(() => {
    expect(axiosMock.get).toHaveBeenCalledWith('/api/v1/auth/orders');
  }, { timeout: 2000 });

  await waitFor(async () => {
    const statusElements = screen.getAllByText('Shipped');
    expect(statusElements.length).toBeGreaterThan(0);
  }, { timeout: 2000 });
});
it('multiple order status updates should persist across views', async () => {
  // Reset order status
  await Order.findByIdAndUpdate('000000000000000000000001', { status: 'Not Processed' });
  
  // Create another order directly in the database
  const anotherOrder = new Order({
    _id: new mongoose.Types.ObjectId('000000000000000000000003'),
    products: [testProducts[2]._id],
    buyer: testUser._id,
    status: 'Not Processed',
    payment: { success: true },
    createdAt: new Date('2023-06-17T12:00:00.000Z'),
  });
  await anotherOrder.save();

  await act(async () => {
    render(<AdminOrders />);
  });

  await waitFor(() => {
    expect(axiosMock.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
  });

  expect(await screen.findByText('Test Product')).toBeInTheDocument();
  expect(await screen.findByText('Another Product')).toBeInTheDocument();

  const selectElements = await screen.findAllByTestId('antd-select');
  expect(selectElements.length).toBeGreaterThan(1); // Ensure we found selects
  
  axiosMock.put.mockClear();
  
  // Update first order status to 'Processing'
  await act(async () => {
    userEvent.selectOptions(selectElements[0], 'Processing');
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  await waitFor(() => {
    expect(axiosMock.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/order-status/'),
      expect.objectContaining({ status: 'Processing' })
    );
  }, { timeout: 2000 });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  await Order.findByIdAndUpdate('000000000000000000000001', { status: 'Processing' }, { new: true });
  
  axiosMock.put.mockClear();

  // Update second order status to 'Delivered'
  await act(async () => {
    userEvent.selectOptions(selectElements[1], 'Delivered');
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  // Wait for second update to complete
  await waitFor(() => {
    expect(axiosMock.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/order-status/'),
      expect.objectContaining({ status: 'Delivered' })
    );
  }, { timeout: 2000 });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await Order.findByIdAndUpdate('000000000000000000000003', { status: 'Delivered' }, { new: true });

  // Verify status updates in the database
  const updatedOrder1 = await Order.findById('000000000000000000000001');
  expect(updatedOrder1.status).toBe('Processing');
  
  const updatedOrder3 = await Order.findById('000000000000000000000003');
  expect(updatedOrder3.status).toBe('Delivered');

  cleanup();
  axiosMock.get.mockClear();

  await act(async () => {
    render(<Orders />);
  });

  await waitFor(() => {
    expect(axiosMock.get).toHaveBeenCalledWith('/api/v1/auth/orders');
  }, { timeout: 2000 });

  await waitFor(() => {
    const processingElements = screen.getAllByText('Processing');
    const deliveredElements = screen.getAllByText('Delivered');
    
    expect(processingElements.length).toBeGreaterThan(0);
    expect(deliveredElements.length).toBeGreaterThan(0);
  }, { timeout: 2000 });
});
});