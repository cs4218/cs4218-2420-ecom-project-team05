import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Profile from './Profile';
import Dashboard from './Dashboard';
import '@testing-library/jest-dom';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../../../../models/userModel';

// Mock non-DB dependencies
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock layout
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout">
    <h1>{title}</h1>
    {children}
  </div>
));

// Mock UserMenu
jest.mock('../../components/UserMenu', () => () => (
  <div data-testid="user-menu">User Menu</div>
));

// Create test user ID
const testUserId = new mongoose.Types.ObjectId();

const mockSetAuth = jest.fn();
let mockAuth = {
  user: {
    _id: testUserId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main St',
  },
  token: 'test-token',
};

// Mock auth
jest.mock('../../context/auth', () => {
  const originalModule = jest.requireActual('../../context/auth');
  return {
    ...originalModule,
    useAuth: () => [mockAuth, mockSetAuth],
    AuthProvider: ({ children }) => children,
  };
});

jest.mock('axios');

describe('Profile and Dashboard Integration Tests', () => {
  let mongoServer;
  let testUser;
  
  // Set up MongoDB Memory Server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Create test user in database
    testUser = new User({
      _id: testUserId,
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      phone: '1234567890',
      address: '123 Main St',
      answer: 'test answer'
    });
    await testUser.save();
    
    // Set up axios implementations to use the real database
    axios.put.mockImplementation(async (url, data) => {
      if (url === '/api/v1/auth/profile') {
        const { name, email, phone, address } = data;
        
        const updatedUser = await User.findByIdAndUpdate(
          testUserId,
          { name, email, phone, address, answer: 'test answer' },
          { new: true }
        );
        
        return {
          data: {
            success: true,
            updatedUser
          }
        };
      }
      return Promise.reject(new Error('Not found'));
    });
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mockAuth to initial state before each test
    mockAuth = {
      user: {
        _id: testUserId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
      },
      token: 'test-token',
    };
    
    // Set up localStorage mock
    const mockLocalStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(mockAuth)),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  it('profile page loads with user details', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    });
  });

  it('user can update profile successfully', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter Your Name');
    const phoneInput = screen.getByPlaceholderText('Enter Your Phone');
    const addressInput = screen.getByPlaceholderText('Enter Your Address');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });
      fireEvent.change(addressInput, { target: { value: '456 Oak St' } });
    });

    const updateButton = screen.getByText('UPDATE');
    
    await act(async () => {
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
        name: 'Jane Doe',
        email: 'john@example.com',
        password: '',
        phone: '9876543210',
        address: '456 Oak St',
      });
    });

    // Verify the database was updated
    const updatedUser = await User.findById(testUserId);
    expect(updatedUser.name).toBe('Jane Doe');
    expect(updatedUser.phone).toBe('9876543210');
    expect(updatedUser.address).toBe('456 Oak St');
  });

  it('end-to-end flow: update profile and see changes in Dashboard', async () => {
    // Update the mock auth object directly
    mockAuth = {
      user: {
        _id: testUserId,
        name: 'Jane Doe',
        email: 'john@example.com',
        phone: '9876543210',
        address: '456 Oak St',
      },
      token: 'test-token',
    };
    
    // Update localStorage to match updated user data
    const mockLocalStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(mockAuth)),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    await act(async () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
    });
  
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('456 Oak St')).toBeInTheDocument();
    });
  });
});