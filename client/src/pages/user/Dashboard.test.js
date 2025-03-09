import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../user/Dashboard';
import { useAuth } from '../../context/auth';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

jest.mock('../../components/UserMenu', () => () => (
  <div data-testid="user-menu">UserMenu</div>
));

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn()
}));

describe('Dashboard Component', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    address: '123 Test St'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct layout title', () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    
    render(<Dashboard />);
    
    const layout = screen.getByTestId('layout');
    expect(layout).toHaveAttribute('data-title', 'Dashboard - Ecommerce App');
  });

  it('renders UserMenu component', () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    
    render(<Dashboard />);
    
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('displays user information when user is logged in', () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    
    render(<Dashboard />);
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.address)).toBeInTheDocument();
  });

  it('handles null/undefined user data gracefully', () => {
    useAuth.mockReturnValue([{ user: null }]);
    
    render(<Dashboard />);
    
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('handles partial user data gracefully', () => {
    const partialUser = {
      name: 'Partial User',
      // Missing email and address
    };
    useAuth.mockReturnValue([{ user: partialUser }]);
    
    render(<Dashboard />);
    
    expect(screen.getByText(partialUser.name)).toBeInTheDocument();
    // Should not crash due to missing properties
  });
});