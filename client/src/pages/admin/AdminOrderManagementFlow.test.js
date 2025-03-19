import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { act } from 'react-dom/test-utils';
import AdminOrders from '../admin/AdminOrders';
import Orders from '../user/Orders';
import '@testing-library/jest-dom'
import moment from 'moment';

// Mock dependencies
jest.mock('axios');
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
      onChange={(e) => onChange && onChange(e.target.value)}
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

// Setup shared test state
const ordersState = {
  orders: [
    {
      _id: 'order1',
      products: [
        {
          _id: 'product1',
          name: 'Test Product',
          description: 'This is a test product description that will be truncated in the UI',
          price: 29.99,
        }
      ],
      buyer: {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      status: 'Not Processed',
      payment: { success: true },
      createdAt: '2023-06-15T10:00:00.000Z',
    }
  ],
  updateOrder: function(orderId, status) {
    const orderIndex = this.orders.findIndex(o => o._id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex].status = status;
    }
  },
  addOrder: function(order) {
    this.orders.push(order);
  }
};

// Mock auth context
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ token: 'mock-token' }, jest.fn()]),
}));

describe('Order System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    
    // Set up axios mocks for each test
    axios.get.mockImplementation((url) => {
      if (url === '/api/v1/auth/orders') {
        return Promise.resolve({ 
          data: ordersState.orders.filter(order => order.buyer._id === 'user1') 
        });
      } else if (url === '/api/v1/auth/all-orders') {
        return Promise.resolve({ data: ordersState.orders });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.put.mockImplementation((url, data) => {
      const orderId = url.split('/').pop();
      ordersState.updateOrder(orderId, data.status);
      return Promise.resolve({ data: { success: true } });
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('new order placed by user should appear in admin orders list', async () => {
    // Setup: Simulate user placing a new order
    const newOrder = {
      _id: 'order2',
      products: [
        {
          _id: 'product2',
          name: 'New Product',
          description: 'A newly ordered product',
          price: 49.99,
        }
      ],
      buyer: {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      status: 'Not Processed',
      payment: { success: true },
      createdAt: '2023-06-16T11:00:00.000Z',
    };

    ordersState.addOrder(newOrder);

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.getByText('New Product')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();

    cleanup();

    await act(async () => {
      render(<AdminOrders />);
    });

    expect(screen.getByText('New Product')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('status update by admin should be reflected in user orders view', async () => {
    await act(async () => {
      render(<AdminOrders />);
    });

    const selectElements = screen.getAllByTestId('antd-select');
    const firstSelectElement = selectElements[0]; // Get the first select element
    
    await act(async () => {
      userEvent.selectOptions(firstSelectElement, 'Shipped');
    });

    await waitFor(() => {
      expect(ordersState.orders[0].status).toBe('Shipped');
    });

    cleanup();

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('cancelled order by admin should show as cancelled for user', async () => {
    await act(async () => {
      render(<AdminOrders />);
    });

    const selectElements = screen.getAllByTestId('antd-select');
    const firstSelectElement = selectElements[0];
    
    await act(async () => {
      userEvent.selectOptions(firstSelectElement, 'Cancelled');
    });

    await waitFor(() => {
      expect(ordersState.orders[0].status).toBe('Cancelled');
    });

    cleanup();

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('multiple order status updates should persist across views', async () => {
    // Add another order to test multiple updates
    ordersState.addOrder({
      _id: 'order3',
      products: [
        {
          _id: 'product3',
          name: 'Another Product',
          description: 'Yet another product description',
          price: 19.99,
        }
      ],
      buyer: {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      status: 'Not Processed',
      payment: { success: true },
      createdAt: '2023-06-17T12:00:00.000Z',
    });
  
    await act(async () => {
      render(<AdminOrders />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Another Product')).toBeInTheDocument();
    });
  
    const selectElements = screen.getAllByTestId('antd-select');
    
    // Update order1 (index 0) status to 'Processing'
    await act(async () => {
      axios.put.mockClear();
      userEvent.selectOptions(selectElements[0], 'Processing');
    });
    
    // Wait for the first update to complete
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/order-status/order1',
        expect.objectContaining({ status: 'Processing' })
      );
    });
  
    // Update order3 (index 1) status to 'Delivered'
    await act(async () => {
      axios.put.mockClear(); // Clear previous calls
      userEvent.selectOptions(selectElements[2], 'Delivered');
    });
    
    // Wait for the second update to complete
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/order-status/order3',
        expect.objectContaining({ status: 'Delivered' })
      );
    });
  
    // Verify status updates in test database
    expect(ordersState.orders.find(o => o._id === 'order1').status).toBe('Processing');
    expect(ordersState.orders.find(o => o._id === 'order3').status).toBe('Delivered');
  
    cleanup();
  
    await act(async () => {
      render(<Orders />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Another Product')).toBeInTheDocument();
    });
  
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });
});