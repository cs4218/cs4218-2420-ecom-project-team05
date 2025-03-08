import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import Orders from '../user/Orders';
import moment from 'moment';
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('axios');
jest.mock('../../components/UserMenu', () => () => <div data-testid="user-menu">User Menu</div>);
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('moment', () => ({
  __esModule: true,
  default: jest.fn(date => ({
    fromNow: () => 'a few seconds ago'
  }))
}));

describe("Orders Component", () => {
    const mockAuthWithToken = [{token: 'test-token'}, jest.fn()]
    const mockAuthWithoutToken = [{token: null}, jest.fn()]
    const mockOrders = [
        {
            _id: 'order1',
            status: 'Processing',
            buyer: { name: 'John Doe' },
            createAt: '2023-01-01T00:00:00.000Z',
            payment: { success: true },
            products: [
              {
                _id: 'product1',
                name: 'Test Product',
                description: 'This is a test product description with manyyyyyy charactersssssssssssssssss',
                price: 99.99
              }
            ]
          },
          {
            _id: 'order2',
            status: 'Shipped',
            buyer: { name: 'Jane Smith' },
            createAt: '2023-01-02T00:00:00.000Z',
            payment: { success: false },
            products: [
              {
                _id: 'product2',
                name: 'Another Product',
                description: 'Short description',
                price: 49.99
              },
              {
                _id: 'product3',
                name: 'Third Product',
                description: 'Another short description',
                price: 29.99
              }
            ]
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks();
      });

    it("renders correctly with layout and title", () => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithoutToken);
        render(<Orders />)
        const layoutElement = screen.getByTestId('layout');
        expect(layoutElement).toBeInTheDocument();
        expect(layoutElement).toHaveAttribute('data-title', 'Your Orders');
    })

    it("renders user menu", () => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithoutToken);
        render(<Orders />)
        const userMenuElement = screen.getByTestId('user-menu');
        expect(userMenuElement).toBeInTheDocument();
    })

    it("fetches orders when auth token is present", async () => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithToken);
        axios.get.mockResolvedValue({ data: mockOrders });
        render(<Orders />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
        });
    });

    it("does not fetch orders when auth token is not present", async () => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithoutToken);
        axios.get.mockResolvedValue({ data: mockOrders });
        render(<Orders />);

        await waitFor(() => {
            expect(axios.get).not.toHaveBeenCalled();
        })
    });

    it("displays orders correctly", async () => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithToken);
        axios.get.mockResolvedValue({ data: mockOrders });        
        render(<Orders />);

        await waitFor(() => {
            expect(screen.getByText('Processing')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Shipped')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            
            // Check for product details
            expect(screen.getByText('Test Product')).toBeInTheDocument();
            expect(screen.getByText('Another Product')).toBeInTheDocument();
            expect(screen.getByText('Third Product')).toBeInTheDocument();
            
            // Check truncated description
            expect(screen.getByText('This is a test product descrip')).toBeInTheDocument();
            
            // Check payment status
            expect(screen.getByText('Success')).toBeInTheDocument();
            expect(screen.getByText('Failed')).toBeInTheDocument();
            
            // Check quantities
            expect(screen.getAllByText('1').length).toBeGreaterThan(0);
            expect(screen.getAllByText('2').length).toBeGreaterThan(0);
        })
    })

    it("handles API error gracefully", async () => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithToken);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const error = new Error('API Error');
        axios.get.mockRejectedValueOnce(error);
    
    render(<Orders />);

    await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(error);
    });
    
    consoleSpy.mockRestore();
    })

    it("displays empty state when no orders are returned", async() => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithToken);
        axios.get.mockResolvedValueOnce({ data: [] });
        
        render(<Orders />);

        await waitFor(() => {
            expect(screen.queryByText('Processing')).not.toBeInTheDocument();
            expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
            // Only the header "All Orders" should be visible
            expect(screen.getByText('All Orders')).toBeInTheDocument();
          });
    })

    it("renders moment dates correectly", async() => {
        require('../../context/auth').useAuth.mockReturnValue(mockAuthWithToken);
        axios.get.mockResolvedValueOnce({ data: mockOrders });
        
        render(<Orders />); 

        await waitFor(() => {
            const fromNowDates = screen.getAllByText('a few seconds ago');
            expect(fromNowDates).toHaveLength(2); // Two orders
            expect(moment).toHaveBeenCalledWith(mockOrders[0].createAt);
            expect(moment).toHaveBeenCalledWith(mockOrders[1].createAt);  
        })
    })
})