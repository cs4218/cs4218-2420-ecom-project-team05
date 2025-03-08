import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Users from '../../pages/admin/Users';
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));
jest.mock('../../components/AdminMenu', () => () => <div data-testid="admin-menu" />);
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn()
}));

describe("Users Component", () => {
  const mockAuth = [{
    token: 'test-token'
  }, jest.fn()
]

  const mockUsers = [
    {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
        role: 1,
        createdAt: '2024-03-08T00:00:00.000Z'
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0987654321',
        role: 0,
        createdAt: '2025-03-08T00:00:00.000Z'
      }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        require('../../context/auth').useAuth.mockReturnValue(mockAuth);
      });

    it("renders spinner initially", () => {
        axios.get.mockImplementation(() => new Promise((resolve => setTimeout(resolve, 100))))

        render(<Users />)

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    })

    it("renders users table when data is fetched correctly", async () => {
        axios.get.mockResolvedValue({ data: {
            success: true,
            users: mockUsers }
        })

        render(<Users />)

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        })

        // Check if the table headers are rendered
        expect(screen.getByText('S.No.')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('Registered On')).toBeInTheDocument();
        
        // Check if user data is rendered
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        
        // Check if roles are rendered correctly
        const adminBadge = screen.getByText('Admin');
        const userBadge = screen.getByText('User');
        expect(adminBadge).toBeInTheDocument();
        expect(userBadge).toBeInTheDocument();
        expect(adminBadge.closest('.badge')).toHaveClass('bg-success');
        expect(userBadge.closest('.badge')).toHaveClass('bg-primary');
        
        // Check dates are formatted correctly
        expect(screen.getByText('08/03/2024')).toBeInTheDocument();
        expect(screen.getByText('08/03/2025')).toBeInTheDocument();
    });

    it("shows message when no users are found", async () => {    
        axios.get.mockResolvedValue({
        data: {
            success: true,
            users: [] }
        })

        render(<Users />)

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        })

        expect(screen.getByText('No users found')).toBeInTheDocument();
    })

    it("shows error toast when API request fails", async () => {
        const errorMessage = "Failed to fetch users"
        axios.get.mockRejectedValue({
            response: {
                data: {
                  message: errorMessage
                }
            }
        })

        render(<Users />)

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(`Error fetching users: ${errorMessage}`);
          });
        })

    it("makes API request with correct auth token", async () => {
        axios.get.mockResolvedValue({ data: {
            success: true,
            users: mockUsers }
        })

        render(<Users />)

        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-users', {
            headers: {
              Authorization: 'test-token'
            }
          });

    })

    it("handles missing fields gracefully", async () => {
        const incompleteUser = {
            _id: '3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            role: 0,
            createdAt: '2023-03-01T00:00:00.000Z'
        }

        axios.get.mockResolvedValue({ data: {
            success: true,
            users: [incompleteUser] }
        })

        render(<Users />)

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
          })

          const rows = screen.getAllByRole('row');
          expect(rows[1]).toHaveTextContent('N/A');
          expect(rows[1]).toHaveTextContent('N/A');
    })

})
