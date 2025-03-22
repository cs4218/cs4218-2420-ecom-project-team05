import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import AdminDashboard from './AdminDashboard';
import CreateProduct from './CreateProduct';
import UpdateProduct from './UpdateProduct';
import Products from './Products';
import '@testing-library/jest-dom';
import Product from '../../../../models/productModel';
import Category from '../../../../models/categoryModel';

// Mock non-DB dependencies
jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn()
}));

// Mock components
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);

// Mock ANTD
jest.mock("antd", () => {
    const antd = jest.requireActual("antd");
    const Select = (props) => {
      const { children, onChange, defaultValue, 'data-testid': dataTestId, variant, showSearch, ...restProps } = props;
      const variantStr = typeof variant === 'boolean' ? variant.toString() : variant;
      
      return (
        <select 
          data-testid={dataTestId || "antd-select"}
          defaultValue={defaultValue} 
          onChange={(e) => onChange && onChange(e.target.value)}
          {...restProps}
          variant={variantStr}
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

// Mock auth context
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{ token: 'mock-token' }, jest.fn()]),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

// Helper function for routing
const renderWithRouter = (ui, initialRoute = '/') => {
    if (!window.history) {
        window.history = {
            pushState: jest.fn(),
        };
    }
    
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

let mockProductData = {
  items: [],
  getAll: async () => {
    const products = await Product.find({})
      .populate('category')
      .select('-photo')
      .limit(12)
      .sort({ createdAt: -1 });
    mockProductData.items = products;
    return products;
  },
  getBySlug: async (slug) => {
    const product = await Product.findOne({ slug })
      .populate('category')
      .select('-photo');
    return product;
  },
  create: async (formData) => {
    const product = new Product({
      name: formData.get('name'),
      slug: formData.get('name').toLowerCase().replace(/\s+/g, '-'),
      description: formData.get('description'),
      price: formData.get('price'),
      category: formData.get('category'),
      quantity: formData.get('quantity'),
      shipping: formData.get('shipping') === '1',
    });
    await product.save();
    await mockProductData.getAll();
    return product;
  },
  update: async (id, formData) => {
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name: formData.get('name'),
        slug: formData.get('name').toLowerCase().replace(/\s+/g, '-'),
        description: formData.get('description'),
        price: formData.get('price'),
        category: formData.get('category'),
        quantity: formData.get('quantity'),
        shipping: formData.get('shipping') === '1',
      },
      { new: true }
    );
    await mockProductData.getAll();
    return updated;
  },
  delete: async (id) => {
    await Product.findByIdAndDelete(id);
    await mockProductData.getAll();
  }
};

let mockCategoryData = {
  items: [],
  getAll: async () => {
    const categories = await Category.find({});
    mockCategoryData.items = categories;
    return categories;
  }
};

jest.mock('axios', () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
});

describe('Admin Product Management Flow', () => {
    let mongoServer;
    let axiosMock;
    
    // Set up the MongoDB Memory Server
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        
        // Connect to the in-memory database
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        await Category.deleteMany({});
        await Category.insertMany([
            { name: 'Electronics', slug: 'electronics' },
            { name: 'Clothing', slug: 'clothing' }
        ]);

        await mockCategoryData.getAll();
        axiosMock = require('axios');
        
        axiosMock.get.mockImplementation((url) => {
            if (url === '/api/v1/product/get-product') {
                return Product.find({})
                    .populate('category')
                    .select('-photo')
                    .limit(12)
                    .sort({ createdAt: -1 })
                    .then(products => {
                        // Update cached items
                        mockProductData.items = products;
                        return { 
                            data: { 
                                success: true, 
                                products: products 
                            } 
                        };
                    });
            } 
            else if (url.startsWith('/api/v1/product/get-product/')) {
                const slug = url.split('/').pop();
                return mockProductData.getBySlug(slug).then(product => ({
                    data: { success: true, product }
                }));
            } 
            else if (url === '/api/v1/category/get-category') {
                return Promise.resolve({ 
                    data: { 
                        success: true, 
                        category: mockCategoryData.items 
                    } 
                });
            }
            
            return Promise.reject(new Error(`Unhandled GET request: ${url}`));
        });
        
        axiosMock.post.mockImplementation((url, data) => {
            if (url === '/api/v1/product/create-product') {
                return mockProductData.create(data).then(() => ({
                    data: { success: true, message: 'Product created successfully' }
                }));
            }
            
            return Promise.reject(new Error(`Unhandled POST request: ${url}`));
        });
        
        axiosMock.put.mockImplementation((url, data) => {
            if (url.startsWith('/api/v1/product/update-product/')) {
                const productId = url.split('/').pop();
                
                return mockProductData.update(productId, data).then(() => ({
                    data: { success: true, message: 'Product updated successfully' }
                }));
            }
            
            return Promise.reject(new Error(`Unhandled PUT request: ${url}`));
        });
        
        axiosMock.delete.mockImplementation((url) => {
            if (url.startsWith('/api/v1/product/delete-product/')) {
                const productId = url.split('/').pop();
                
                return mockProductData.delete(productId).then(() => ({
                    data: { success: true, message: 'Product deleted successfully' }
                }));
            }
            
            return Promise.reject(new Error(`Unhandled DELETE request: ${url}`));
        });
    });
    
    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });
    
    afterEach(async () => {
        await Product.deleteMany({});
        await mockProductData.getAll();
        cleanup();
    });
    
    beforeEach(() => {
        URL.createObjectURL = jest.fn(() => "mock-url");
        
        if (!global.window) {
            global.window = {};
        }
        global.window.prompt = jest.fn();
        
        jest.clearAllMocks();
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

            // Get first category ID from the database
            const categories = await Category.find({});
            const categoryId = categories[0]._id;

            fireEvent.change(categorySelect, { target: { value: categoryId.toString() } });
            fireEvent.change(shippingSelect, { target: { value: '1' } });
            
            // Submit form
            const submitButton = screen.getByText('CREATE PRODUCT');
            await act(async () => {
                fireEvent.click(submitButton);
            });

            // Verify product was created in the database
            await waitFor(async () => {
                const products = await Product.find({});
                console.log('Products after creation:', products);
                expect(products.length).toBe(1);
                expect(products[0].name).toBe('New Test Product');
            });

            // STEP 2: Verify product appears in products list
            cleanup();
            
            // Force refresh of mock data
            await mockProductData.getAll();
            jest.clearAllMocks();
            
            await act(async () => {
                renderWithRouter(<Products />, '/dashboard/admin/products');
            });
        
            await screen.findByText('New Test Product', {}, { timeout: 3000 });

            // STEP 3: Update the product
            // Get the product slug for the update URL
            const product = await Product.findOne({ name: 'New Test Product' });
            const slug = product.slug;
            
            cleanup();
            
            await act(async () => {
                renderWithRouter(<UpdateProduct />, `/dashboard/admin/product/${slug}`);
            });
            
            await waitFor(() => {
                expect(screen.getByText('Update Product')).toBeInTheDocument();
            });
            
            const updateNameInput = await screen.findByDisplayValue('New Test Product', {}, { timeout: 2000 });
            fireEvent.change(updateNameInput, { target: { value: '' } });
            fireEvent.change(updateNameInput, { target: { value: 'Updated Product Name' } });
            
            const updateButton = screen.getByText('UPDATE PRODUCT');
            await act(async () => {
                fireEvent.click(updateButton);
            });
            
            // Verify the product was updated in the database
            await waitFor(async () => {
                const updatedProduct = await Product.findById(product._id);
                expect(updatedProduct.name).toBe('Updated Product Name');
            });
            
            // STEP 4: Delete the product
            window.prompt.mockReturnValue('yes');
            
            const deleteButton = screen.getByText('DELETE PRODUCT');
            
            await act(async () => {
                fireEvent.click(deleteButton);
            });
            
            // Verify the product was deleted from the database
            await waitFor(async () => {
                const products = await Product.find({});
                expect(products.length).toBe(0);
            });
        });
    });
});