import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPassword from './ForgotPassword';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('./../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout">
    <h1>{title}</h1>
    {children}
  </div>
));

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with form elements', () => {
    render(<ForgotPassword />);
    
    expect(screen.getAllByText("RESET PASSWORD").length).toBe(2);
    expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What is Your Favorite Sport?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RESET PASSWORD' })).toBeInTheDocument();
  });

  it('validates email input correctly', async () => {
    render(<ForgotPassword />);
    
    const emailInput = screen.getByPlaceholderText('Enter Your Email');

    // Test empty validation
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.blur(emailInput);
    expect(await screen.findByText('Email is required')).toBeInTheDocument();

    // Test invalid email format
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.blur(emailInput);
    expect(await screen.findByText('Email is invalid')).toBeInTheDocument();

    // Test valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Email is invalid')).not.toBeInTheDocument();
  });

  it('validates password input correctly', async () => {
    render(<ForgotPassword />);
    
    const passwordInput = screen.getByPlaceholderText('Enter Your New Password');

    // Test empty validation
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.blur(passwordInput);
    expect(await screen.findByText('Password is required')).toBeInTheDocument();

    // Test too short password
    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    fireEvent.blur(passwordInput);
    expect(await screen.findByText('Password must be at least 6 characters long')).toBeInTheDocument();

    // Test password without number
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.blur(passwordInput);
    expect(await screen.findByText('Password must contain at least one letter and one number')).toBeInTheDocument();

    // Test valid password
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.blur(passwordInput);
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Password must be at least 6 characters long')).not.toBeInTheDocument();
    expect(screen.queryByText('Password must contain at least one letter and one number')).not.toBeInTheDocument();
  });

  it('validates security answer correctly', async () => {
    render(<ForgotPassword />);
    
    const answerInput = screen.getByPlaceholderText('What is Your Favorite Sport?');

    // Test empty validation
    fireEvent.change(answerInput, { target: { value: '' } });
    fireEvent.blur(answerInput);
    expect(await screen.findByText('Answer is required')).toBeInTheDocument();

    // Test too short answer
    fireEvent.change(answerInput, { target: { value: 'abc' } });
    fireEvent.blur(answerInput);
    expect(await screen.findByText('Answer is too short')).toBeInTheDocument();

    // Test valid answer
    fireEvent.change(answerInput, { target: { value: 'Football' } });
    fireEvent.blur(answerInput);
    expect(screen.queryByText('Answer is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer is too short')).not.toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: 'Password reset successful'
      }
    });

    render(<ForgotPassword />);
    
    // Fill out the form with valid data
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite Sport?'), { 
      target: { value: 'Football' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { 
      target: { value: 'newpassword123' } 
    });

    fireEvent.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
        email: 'test@example.com',
        newPassword: 'newpassword123',
        answer: 'Football'
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Password reset successful');
  });

  it('handles API error during submission', async () => {
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValue({
      response: {
        data: {
          message: errorMessage
        }
      }
    });

    render(<ForgotPassword />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite Sport?'), { 
      target: { value: 'Football' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { 
      target: { value: 'newpassword123' } 
    });

    fireEvent.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });
});