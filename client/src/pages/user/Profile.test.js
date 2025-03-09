import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Profile from '../user/Profile';
import { useAuth } from '../../context/auth';
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../components/UserMenu', () => () => <div data-testid="user-menu">User Menu</div>);
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));

describe("Profile Component", () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    address: '123 Test Street',
  }

  const mockAuth = [
    { user: mockUser, token: 'test-token' },
    jest.fn(),
  ]

  const mockLocalStorage = (function() {
    let store = {};
    return {
      getItem: jest.fn(key => {
        return store[key] || null;
      }),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: function() {
        store = {};
      }
    };
  })();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue(mockAuth);

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        user: mockUser,
        token: 'test-token'
      }));
  });

  it("renders profile form with user data", () => {
    render(<Profile />);
    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toBeInTheDocument();
    expect(layoutElement).toHaveAttribute('data-title', 'Your Profile');

    expect(screen.getByTestId('user-menu')).toBeInTheDocument(); //Check if user menu is rendered

    // Check if form is populated with user data
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument();

    //Email field should be disabled
    const emailField = screen.getByPlaceholderText('Enter Your Email');
    expect(emailField).toBeDisabled();

    //Password field should be empty
    const passwordField = screen.getByPlaceholderText('Enter Your Password');
    expect(passwordField).toHaveValue('');
  })

  it("handles form input changes", async() => {
    render(<Profile />)

    // Update name
    const nameField = screen.getByPlaceholderText('Enter Your Name');
    fireEvent.change(nameField, { target: { value: 'Updated Name' } });
    expect(nameField).toHaveValue('Updated Name');

    // Update password
    const passwordField = screen.getByPlaceholderText('Enter Your Password');
    fireEvent.change(passwordField, { target: { value: 'newPassword123' } });
    expect(passwordField.value).toBe('newPassword123');

    // Update address
    const addressField = screen.getByPlaceholderText('Enter Your Address');
    fireEvent.change(addressField, { target: { value: 'Updated Address' } });
    expect(addressField).toHaveValue('Updated Address');

    // Update phone
    const phoneField = screen.getByPlaceholderText('Enter Your Phone');
    fireEvent.change(phoneField, { target: { value: '9827292729' } });
    expect(phoneField).toHaveValue('9827292729');
  })

    it("successfully updates user profile", async () => {
        const updatedUser = {
            ...mockUser,
            name: 'Updated Name',
            phone: '9827292729',
            address: 'Updated Address',
          };
          
          axios.put.mockResolvedValueOnce({
            data: {
              success: true,
              updatedUser: updatedUser,
            },
          });
          
          render(<Profile />);

        // Update the form fields
        const nameInput = screen.getByPlaceholderText('Enter Your Name');
        const passwordInput = screen.getByPlaceholderText('Enter Your Password');
        const phoneInput = screen.getByPlaceholderText('Enter Your Phone');
        const addressInput = screen.getByPlaceholderText('Enter Your Address');
        
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
        fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
        fireEvent.change(phoneInput, { target: { value: '9827292729' } });
        fireEvent.change(addressInput, { target: { value: 'Updated Address' } });

         // Submit the form
        const submitButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(submitButton);
        
        await waitFor(() => {
        // Check if API was called with correct data
        expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
            name: 'Updated Name',
            email: 'test@example.com',
            password: 'newpassword123',
            phone: '9827292729',
            address: 'Updated Address',
        });
        
        // Check if auth context was updated
        expect(mockAuth[1]).toHaveBeenCalledWith({
            user: updatedUser,
            token: 'test-token',
        });
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'auth',
            expect.any(String)
        );
        
        // Parse the JSON string passed to localStorage.setItem
        const setItemCallArg = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(setItemCallArg.user).toEqual(updatedUser);
        
        expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
        });
    });

    it("handles API error response", async () => {
        axios.put.mockResolvedValueOnce({
            data: {
              error: 'Update failed',
            },
          });

        render(<Profile />);

        // Submit the form without changing anything
        const submitButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(submitButton);
        
        await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
        })
    })

    it("handles API exception", async () => {
        axios.put.mockRejectedValueOnce(new Error('Network error'));

        render(<Profile />);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(submitButton);
        
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Something went wrong');
        });
    })

    it("loads user data from auth context", () => {
        useAuth.mockReset();
        
        const customUser = {
          name: 'Custom User',
          email: 'custom@example.com',
          phone: '5555555555',
          address: 'Custom Address',
        };
        
        useAuth.mockReturnValue([
          { user: customUser, token: 'test-token' },
          jest.fn(),
        ]);
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
          user: customUser,
          token: 'test-token'
        }));
        
        render(<Profile />);
        
        // Verify the form is populated with the custom user data
        expect(screen.getByDisplayValue('Custom User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('custom@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5555555555')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Custom Address')).toBeInTheDocument();
      });

    describe('Field Validation Tests', () => {
        it('validates name field correctly', async () => {
          render(<Profile />);
          
          const nameInput = screen.getByPlaceholderText('Enter Your Name');
          const submitButton = screen.getByRole('button', { name: /update/i });
          
          // 1. Test with too short name
          fireEvent.change(nameInput, { target: { value: 'Ab' } });
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Name should be at least 3 characters long');
          });
          
          // 2. Test with numeric name
          fireEvent.change(nameInput, { target: { value: '12345' } });
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Name should contain letters, not just numbers or symbols');
          });
          
          // 3. Test with valid name
          fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
          
          // Clear previous calls
          toast.error.mockClear(); 
          
          // Mock successful API call
          axios.put.mockResolvedValueOnce({
            data: {
              success: true,
              updatedUser: { ...mockUser, name: 'Valid Name' },
            },
          });
          
          // Complete the form with other valid inputs
          fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'Pass123' } });
          
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            // Should not show name validation error
            expect(toast.error).not.toHaveBeenCalledWith('Name should be at least 3 characters long');
            expect(toast.error).not.toHaveBeenCalledWith('Name should contain letters, not just numbers or symbols');
          });
        });
        
        it('validates password field correctly', async () => {
          render(<Profile />);
          
          const passwordInput = screen.getByPlaceholderText('Enter Your Password');
          const submitButton = screen.getByRole('button', { name: /update/i });
          
          // Empty password should be valid as user may not update password
          fireEvent.change(passwordInput, { target: { value: '' } });
          
          // Test with too short password
          fireEvent.change(passwordInput, { target: { value: 'abc12' } });
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters long');
          });
          
          // Test with password missing numbers
          fireEvent.change(passwordInput, { target: { value: 'abcdefg' } });
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Password must contain at least one letter and one number');
          });
          
          // Test with password missing letters
          fireEvent.change(passwordInput, { target: { value: '1234567' } });
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Password must contain at least one letter and one number');
          });
          
          // Test with valid password
          fireEvent.change(passwordInput, { target: { value: 'Valid123' } });
          
          // Clear previous calls
          toast.error.mockClear();
          
          // Mock successful API call
          axios.put.mockResolvedValueOnce({
            data: {
              success: true,
              updatedUser: mockUser,
            },
          });
          
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            // Should not show password validation errors
            expect(toast.error).not.toHaveBeenCalledWith('Password must be at least 6 characters long');
            expect(toast.error).not.toHaveBeenCalledWith('Password must contain at least one letter and one number');
          });
        });
        
        it('validates phone field correctly', async () => {
          render(<Profile />);
          
          const phoneInput = screen.getByPlaceholderText('Enter Your Phone');
          const submitButton = screen.getByRole('button', { name: /update/i });
          
          // Test with invalid format containing letters
          fireEvent.change(phoneInput, { target: { value: '123abc4567' } });
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Phone number should not contain letters');
          });
          
          // Test with too short phone number
          fireEvent.change(phoneInput, { target: { value: '123' } });
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Phone number should be between 10-15 digits');
          });
          
          // Test with formatted phone number
          fireEvent.change(phoneInput, { target: { value: '+1-234-567-8901' } });
          
          toast.error.mockClear();
          
          axios.put.mockResolvedValueOnce({
            data: {
              success: true,
              updatedUser: { ...mockUser, phone: '+1-234-567-8901' },
            },
          });
          
          // Complete the form with other valid inputs
          fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'Pass123' } });
          
          fireEvent.click(submitButton);
          
          await waitFor(() => {
            // Should not show phone validation errors
            expect(toast.error).not.toHaveBeenCalledWith('Phone number should not contain letters');
            expect(toast.error).not.toHaveBeenCalledWith('Phone number should be between 10-15 digits');
          });
        });
        
        it('ensures all validations must pass before API call', async () => {
          render(<Profile />);
          
          // Set invalid values for multiple fields
          fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'A' } });
          fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: '123' } });
          fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: 'invalid' } });
          
          fireEvent.click(screen.getByRole('button', { name: /update/i }));
          
          await waitFor(() => {
            expect(axios.put).not.toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalled();
          })
        })
      })
    })
