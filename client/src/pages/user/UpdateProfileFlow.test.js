import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { useAuth, AuthProvider } from '../../context/auth';
import Profile from './Profile';
import Dashboard from './Dashboard';
import toast from 'react-hot-toast';
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('axios');
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

// Mock AuthContext
jest.mock('../../context/auth', () => {
  const originalModule = jest.requireActual('../../context/auth');
  const mockSetAuth = jest.fn();
  const mockAuth = {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      address: '123 Main St',
    },
    token: 'test-token',
  };

  return {
    ...originalModule,
    useAuth: jest.fn(() => [mockAuth, mockSetAuth]),
    AuthProvider: ({ children }) => children,
  };
});

describe('Profile and Dashboard Integration Tests', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main St',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockLocalStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify({ user: mockUser, token: "test-token" })),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  it('profile page loads with user details', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    });
  });

  it('user can update profile successfully', async () => {
    const updatedUser = {
      ...mockUser,
      name: 'Jane Doe',
      phone: '9876543210',
      address: '456 Oak St',
    };
    
    axios.put.mockResolvedValue({
      data: {
        updatedUser,
      },
    });

    const [mockAuth, mockSetAuth] = useAuth();

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter Your Name');
    const phoneInput = screen.getByPlaceholderText('Enter Your Phone');
    const addressInput = screen.getByPlaceholderText('Enter Your Address');

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.change(addressInput, { target: { value: '456 Oak St' } });

    const updateButton = screen.getByText('UPDATE');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
        name: 'Jane Doe',
        email: 'john@example.com',
        password: '',
        phone: '9876543210',
        address: '456 Oak St',
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
    });

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });
  });

  it('updated profile is reflected on Dashboard', async () => {
    useAuth.mockImplementation(() => [
      {
        user: {
          ...mockUser,
          name: 'Jane Doe',
          address: '456 Oak St',
        },
        token: 'test-token',
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('456 Oak St')).toBeInTheDocument();
    });
  });

  it('end-to-end flow: update profile and see changes in Dashboard', async () => {
    const updatedUser = {
      ...mockUser,
      name: 'Jane Doe',
      phone: '9876543210',
      address: '456 Oak St',
    };
    
    axios.put.mockResolvedValue({
      data: {
        updatedUser,
      },
    });

    // Step 1: render with original user data
    useAuth.mockImplementation(() => [
      {
        user: mockUser,
        token: 'test-token',
      },
      jest.fn((newAuth) => {

        // Mock implementation to update the auth state
        useAuth.mockImplementation(() => [
          {
            ...newAuth,
            user: updatedUser,
          },
          jest.fn(),
        ]);
      }),
    ]);

    const { unmount } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Verify details are seen
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    // Step 2: update the form fields
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '456 Oak St' } });

    fireEvent.click(screen.getByText('UPDATE'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
    });

    unmount();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('456 Oak St')).toBeInTheDocument();
    });
  });
});