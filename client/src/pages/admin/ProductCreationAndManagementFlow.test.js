import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import axios from 'axios';
import { act } from 'react-dom/test-utils';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CreateProduct from './CreateProduct';
import UpdateProduct from './UpdateProduct';
import Products from './Products';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn()
}));

// Mock components
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);

jest.mock("antd", () => {
    const antd = jest.requireActual("antd");
    const Select = (props) => {
      const { children, onChange, defaultValue, 'data-testid': dataTestId, ...restProps } = props;
      return (
        <select 
          data-testid={dataTestId || "antd-select"}
          defaultValue={defaultValue} 
          onChange={(e) => onChange && onChange(e.target.value)}
          {...restProps}
        >
          {children}
        </select>
      );
    };
    
    Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
    
    return {
      ...antd,
      Select
    };
  });

// Mock some categories
const mockCategories = {
    success: true,
    category: [
        { _id: "cat1", name: "Electronics" },
        { _id: "cat2", name: "Clothing" },
    ]
};

// Setup shared test state for products
const productsState = {
    products: [
        {
            _id: 'prod1',
            name: 'Test Product',
            description: 'Test Description',
            price: 99.99,
            quantity: 10,
            category: { _id: 'cat1', name: 'Electronics' },
            shipping: 1,
            slug: 'test-product'
        }
    ],
    updateProduct: function(productId, updatedData) {
        const productIndex = this.products.findIndex(p => p._id === productId);
        if (productIndex !== -1) {
            this.products[productIndex] = { ...this.products[productIndex], ...updatedData };
        }
    },
    addProduct: function(product) {
        this.products.push(product);
    },
    deleteProduct: function(productId) {
        const productIndex = this.products.findIndex(p => p._id === productId);
        if (productIndex !== -1) {
            this.products.splice(productIndex, 1);
        }
    }
};

// Mock auth context
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{ token: 'mock-token' }, jest.fn()]),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

// Helper function for routing
const renderWithRouter = (ui, initialRoute = '/') => {
    window.history.pushState({}, 'Test page', initialRoute);
    
    return render(
        <BrowserRouter>
            <Routes>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/dashboard/admin/create-product" element={<CreateProduct />} />
                <Route path="/dashboard/admin/products" element={<Products />} />
                <Route path="/dashboard/admin/product/:slug" element={<UpdateProduct />} />
                <Route path="*" element={ui} />
            </Routes>
        </BrowserRouter>
    );
};

describe('Admin Product Management Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cleanup();
        URL.createObjectURL = jest.fn(() => "mock-url");
        global.window.prompt = jest.fn(); // navigator mock
        
        // Set up axios mocks for each test
        axios.get.mockImplementation((url) => {
            if (url === '/api/v1/product/get-product') {
                return Promise.resolve({ data: { success: true, products: productsState.products } });
            } else if (url.startsWith('/api/v1/product/get-product/')) {
                const slug = url.split('/').pop();
                const product = productsState.products.find(p => p.slug === slug);
                return Promise.resolve({ data: { success: true, product } });
            } else if (url === '/api/v1/category/get-category') {
                return Promise.resolve({ data: mockCategories });
            }
            return Promise.reject(new Error('Not found'));
        });

        axios.post.mockImplementation((url, data) => {
            if (url === '/api/v1/product/create-product') {
                // Simulate creating a new product
                const newProduct = {
                    _id: 'new-prod-id',
                    name: data.get('name'),
                    description: data.get('description'),
                    price: parseFloat(data.get('price')),
                    quantity: parseInt(data.get('quantity')),
                    category: { _id: data.get('category'), name: 'Test Category' },
                    shipping: parseInt(data.get('shipping')),
                    slug: data.get('name').toLowerCase().replace(/\s+/g, '-')
                };
                productsState.addProduct(newProduct);
                return Promise.resolve({ data: { success: true, message: 'Product created successfully' } });
            }
            return Promise.reject(new Error('Not found'));
        });

        axios.put.mockImplementation((url, data) => {
            if (url.startsWith('/api/v1/product/update-product/')) {
                const productId = url.split('/').pop();
                // Simulate updating a product
                const updatedData = {
                    name: data.get('name'),
                    description: data.get('description'),
                    price: parseFloat(data.get('price')),
                    quantity: parseInt(data.get('quantity')),
                    category: { _id: data.get('category'), name: 'Test Category' },
                    shipping: parseInt(data.get('shipping'))
                };
                productsState.updateProduct(productId, updatedData);
                return Promise.resolve({ data: { success: true, message: 'Product updated successfully' } });
            }
            return Promise.reject(new Error('Not found'));
        });

        axios.delete.mockImplementation((url) => {
            if (url.startsWith('/api/v1/product/delete-product/')) {
                const productId = url.split('/').pop();
                productsState.deleteProduct(productId);
                return Promise.resolve({ data: { success: true, message: 'Product deleted successfully' } });
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    afterEach(() => {
        cleanup();
    });

    describe('End to End Product Management Flow', () => {
        it('complete flow: create, view, update and delete product', async () => {
            // STEP 1: Navigate to Create Product and create a product
            await act(async () => {
                renderWithRouter(<CreateProduct />, '/dashboard/admin/create-product');
            });
      
            // Fill in and submit product form
            await waitFor(() => {
                expect(screen.getByText('Create Product')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('Enter a name');
            fireEvent.change(nameInput, { target: { value: 'New Test Product' } });
            
            const descInput = screen.getByPlaceholderText('Enter a description');
            fireEvent.change(descInput, { target: { value: 'New test description' } });
            
            const priceInput = screen.getByPlaceholderText('Enter a price');
            fireEvent.change(priceInput, { target: { value: '199.99' } });
            
            const quantityInput = screen.getByPlaceholderText('Enter a quantity');
            fireEvent.change(quantityInput, { target: { value: '50' } });

            const selectElements = screen.getAllByRole('combobox');
            const categorySelect = selectElements[0];
            const shippingSelect = selectElements[1];

            fireEvent.change(categorySelect, { target: { value: 'cat1' } });
            fireEvent.change(shippingSelect, { target: { value: '1' } });
            
            // Submit the form
            const submitButton = screen.getByText('CREATE PRODUCT');
            await act(async () => {
                fireEvent.click(submitButton);
            });

            await waitFor(() => {
                expect(axios.post).toHaveBeenCalled();
                expect(window.location.pathname).toBe('/dashboard/admin/products');
            });

            // STEP 2: Verify product appears in products list
            jest.clearAllMocks();
            cleanup();
            
            await act(async () => {
                renderWithRouter(<Products />, '/dashboard/admin/products');
            });
        
            await waitFor(() => {
                const productElements = screen.queryAllByText('Test Product');
                expect(productElements.length).toBeGreaterThan(0);
            });

            // STEP 3: Update the product
            // Navigate to update page
            jest.clearAllMocks();
            cleanup();
            
            await act(async () => {
                renderWithRouter(<UpdateProduct />, '/dashboard/admin/product/test-product');
            });
            
            await waitFor(() => {
                expect(screen.getByText('Update Product')).toBeInTheDocument();
            });
            
            const updateNameInput = screen.getByDisplayValue('Test Product');
            fireEvent.change(updateNameInput, { target: { value: '' } });
            fireEvent.change(updateNameInput, { target: { value: 'Updated Product Name' } });
            
            const updateButton = screen.getByText('UPDATE PRODUCT');
            await act(async () => {
                fireEvent.click(updateButton);
            });
            
            await waitFor(() => {
                expect(axios.put).toHaveBeenCalled();
            });
        
            // STEP 4: Delete the product
            window.prompt.mockReturnValue('yes');
            
            const deleteButton = screen.getByText('DELETE PRODUCT');
            
            await act(async () => {
                fireEvent.click(deleteButton);
            });
            
            await waitFor(() => {
                expect(axios.delete).toHaveBeenCalled();
                expect(window.location.pathname).toBe('/dashboard/admin/products');
            });
        });
    });
});