import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from '../../context/auth'
import * as AuthModule from '../../context/auth';
// console.log('AuthProvider:', AuthProvider);
// console.log('Auth:', AuthModule);
import AdminDashboard from './AdminDashboard';
import CreateProduct from './CreateProduct';
import UpdateProduct from './UpdateProduct';
import Products from './Products';


// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn()
}))

// jest.spyOn(AuthModule, 'useAuth').mockImplementation(() => {
//     return [{ user: { name: 'Test User' }, token: 'test-token' }, jest.fn()];
//   });

// Mock some categories
const mockCategories = {
    success: true,
    category: [
        { _id: "cat1", name: "Electronics" },
        { _id: "cat2", name: "Clothing" },
    ]
}

// Mock some products (products in array)
const mockProducts = {
    success: true,
    products: [
        {
            __id: 'prod1',
            name: 'Test Product',
            description: 'Test Description',
            price: 99.99,
            quantity: 10,
            category: { _id: 'cat1', name: 'Electronics' },
            shipping: 1,
            slug: 'test-product'
        },
        {
            __id: 'prod2',
            name: 'Test Product 2',
            description: 'Test Description 2',
            price: 99.99,
            quantity: 10,
            category: { _id: 'cat2', name: 'Clothing' },
            shipping: 1,
            slug: 'test-product-2'
        }
    ]
}

// Mock a single product
const mockSingleProduct = {
    success: true,
    product: {
        __id: 'prod1',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        quantity: 10,
        category: { _id: 'cat1', name: 'Electronics' },
        shipping: 1,
        slug: 'test-product'
    }
}

// URL objects for image uploads
const createMockFile = () => {
    const mockFile = new File(['mockData'], 'mockFile.jpg', { type: 'image/jpeg' });
    return mockFile;
}

// Helper function for routing

const renderWithRouter = (ui, initialRoute = '/') => {
    window.history.pushState({}, 'Test page', initialRoute);
    
    // Import AuthContext directly
    const { AuthContext } = require('../../context/auth');
    
    const Wrapper = ({ children }) => {
      // Create a mock auth context value
      const authContextValue = [
        { user: { name: 'Test User' }, token: 'test-token' },
        jest.fn()
      ];
      
      return (
        <AuthModule.AuthProvider value={authContextValue}>
          <BrowserRouter>
            <Routes>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/admin/create-product" element={<CreateProduct />} />
              <Route path="/dashboard/admin/products" element={<Products />} />
              <Route path="/dashboard/admin/product/:slug" element={<UpdateProduct />} />
              <Route path="*" element={ui} />
            </Routes>
          </BrowserRouter>
        </AuthModule.AuthProvider>
      );
    };
    
    // Simply render your wrapper component directly
    return render(<Wrapper>{ui}</Wrapper>);
  };

// const renderWithRouter = (ui, initialRoute = '/') => {
//     window.history.pushState({}, 'Test page', initialRoute);
//     // console.log(AuthProvider)
//     const MockAuthProvider = ({ children }) => children;
  
//   return render(
//     <BrowserRouter>
//       <MockAuthProvider>
//         <Routes>
//           <Route path="/dashboard/admin" element={<AdminDashboard />} />
//           <Route path="/dashboard/admin/create-product" element={<CreateProduct />} />
//           <Route path="/dashboard/admin/products" element={<Products />} />
//           <Route path="/dashboard/admin/product/:slug" element={<UpdateProduct />} />
//           <Route path="*" element={ui} />
//         </Routes>
//       </MockAuthProvider>
//     </BrowserRouter>
//   );
// };
//     return render(
        
//       <BrowserRouter>
//         <AuthProvider>
//           <Routes>
//             <Route path="/dashboard/admin" element={<AdminDashboard />} />
//             <Route path="/dashboard/admin/create-product" element={<CreateProduct />} />
//             <Route path="/dashboard/admin/products" element={<Products />} />
//             <Route path="/dashboard/admin/product/:slug" element={<UpdateProduct />} />
//             <Route path="*" element={ui} /> { /*Parameters come in here */}
//           </Routes>
//         </AuthProvider>
//       </BrowserRouter>
//     );
//   };

  

describe('Admin Product Management Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        URL.createObjectURL = jest.fn(() => "mock-url");
        global.window.prompt = jest.fn() // navigator mock
    })

    describe('Create Product Flow', () => {
        it('admin can navigate from Dashboard to Create Product page', async () => {
            axios.get.mockResolvedValueOnce({ data: mockCategories });
            renderWithRouter(<AdminDashboard />, '/dashboard/admin');

            // Click on "Create Product" button
            const createProductButton = await screen.getByText(/create product/i);
            userEvent.click(createProductButton);

            await waitFor(() => {
                expect(window.location.pathname).toBe('/dashboard/admin/create-product');
                })
            })

        it('admin can create a product', async () => {
            axios.get.mockResolvedValueOnce({ data: mockCategories });
            axios.post.mockResolvedValueOnce({ 
                data: { success: true, message: 'Product created successfully' }
            });
            renderWithRouter(<CreateProduct />, '/dashboard/admin/create-product');

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category')
            })

            // Fill in the form
            const categorySelect = screen.getByPlaceholderText('Select a category');
            fireEvent.change(categorySelect, { target: { value: 'cat1' } });
            fireEvent.click(categorySelect);
            const categoryOption = await screen.findByText('Electronics');
            fireEvent.click(categoryOption);

            // Upload photo
            const fileInput = screen.getByLabelText(/upload photo/i);
            const mockFile = createMockFile();
            userEvent.upload(fileInput, mockFile);
            
            // Fill in other fields
            userEvent.type(screen.getByPlaceholderText('Enter a name'), 'New Test Product');
            userEvent.type(screen.getByPlaceholderText('Enter a description'), 'This is a test product description');
            userEvent.type(screen.getByPlaceholderText('Enter a price'), '199.99');
            userEvent.type(screen.getByPlaceholderText('Enter a quantity'), '25');

            // Select shipping option
            const shippingSelect = screen.getByTestId('shipping-select');
            fireEvent.change(shippingSelect, { target: { value: '1' } });
            fireEvent.click(shippingSelect);
            const shippingOption = await screen.findByText('Yes');
            fireEvent.click(shippingOption);

            // Submit Form
            userEvent.click(screen.getByText('CREATE PRODUCT'))

            await waitFor(() => {
                expect(axios.post.toHaveBeenCalledWith(
                    '/api/v1/product/create-product',
                    expect.any(FormData)
                    ))
                })       
            })
        })

    describe('Products List and Update Flow', () => {
        it('products are displayed in the Products component', async () => {
            axios.get.mockResolvedValueOnce({ data: mockProducts })
            renderWithRouter(<Products />, '/dashboard/admin/products');

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
                expect(screen.getByText('Test Product')).toBeInTheDocument();
                expect(screen.getByText('Test Description')).toBeInTheDocument();
            })
        })
        
        it('admin can navigate to UpdateProduct page from Products list', async () => {
            axios.get.mockResolvedValueOnce({ data: mockProducts });
            renderWithRouter(<Products />, '/dashboard/admin/products');
            
            // Find and click on a product
            await waitFor(() => {
                expect(screen.getByText('Test Product')).toBeInTheDocument();
            });
            
            const productLink = screen.getByText('Test Product').closest('a');
            userEvent.click(productLink);
            
            // Check navigation to update page
            await waitFor(() => {
                expect(window.location.pathname).toMatch(/\/dashboard\/admin\/product\/.+/);
            });
        })

        it('admin can update product details', async () => {
            axios.get.mockResolvedValueOnce({ data: mockSingleProduct })
            axios.get.mockResolvedValueOnce({ data: mockCategories })
            axios.put.mockResolvedValueOnce({ 
                data: { success: true,
                    message: 'Product updated successfully'
                }
            })

            renderWithRouter(<UpdateProduct />, '/dashboard/admin/product/test-product');

            // Wait for product data to load
            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/test-product');
                expect(screen.getByText('Update Product')).toBeInTheDocument();
            });

            // Update product name
            const nameInput = screen.getByDisplayValue('Test Product')
            userEvent.clear(nameInput)
            userEvent.type(nameInput, 'Updated Product name')

            // Update product price
            const priceInput = screen.getByDisplayValue('99.99');
            userEvent.clear(priceInput);
            userEvent.type(priceInput, '149.99');

            userEvent.click(screen.getByText('UPDATE PRODUCT'))

            await waitFor(() => {
                expect(axios.put).toHaveBeenCalledWith(
                  '/api/v1/product/update-product/prod1',
                  expect.any(FormData)
                );
              });
        })
    })

    describe('Delete Product Flow', () => {
        it('admin can delete a product with confirmation', async () => {
            axios.get.mockResolvedValueOnce({ data: mockSingleProduct }); // get-product/:slug
            axios.get.mockResolvedValueOnce({ data: mockCategories }); // get-category
            axios.delete.mockResolvedValueOnce({ 
              data: { success: true, message: 'Product deleted successfully' }
            });

            // Mock window.prompt to return "yes"
            window.prompt.mockReturnValue('yes');

            renderWithRouter(<UpdateProduct />, '/dashboard/admin/product/test-product')

            await waitFor(() => {
                expect(screen.getByText('Update Product')).toBeInTheDocument()
            })

            // Click delete button
            const deleteButton = screen.getByText('DELETE PRODUCT');
            userEvent.click(deleteButton);
      
            // Verify prompt and API call
            await waitFor(() => {
                expect(window.prompt).toHaveBeenCalledWith('Are you sure you want to delete this product?');
                expect(axios.delete).toHaveBeenCalledWith('/api/v1/product/delete-product/prod1');
            });
            
            // Verify navigation back to products page
            await waitFor(() => {
                expect(window.location.pathname).toBe('/dashboard/admin/products');
            });

        it('admin cancels product deletion when prompt is dismissed', async () => {
             // Mock API calls
            axios.get.mockResolvedValueOnce({ data: mockSingleProduct }); // get-product/:slug
            axios.get.mockResolvedValueOnce({ data: mockCategories }); // get-category
            
            window.prompt.mockReturnValue(null);

            renderWithRouter(<UpdateProduct />, '/dashboard/admin/product/test-product');
            
            await waitFor(() => {
                expect(screen.getByText('Update Product')).toBeInTheDocument();
            });
            
            const deleteButton = screen.getByText('DELETE PRODUCT');
            userEvent.click(deleteButton);
            
            // Verify prompt was shown but API call was not made
            await waitFor(() => {
                expect(window.prompt).toHaveBeenCalledWith('Are you sure you want to delete this product?');
                expect(axios.delete).not.toHaveBeenCalled();
                });
            }) 
        })
    })

    describe('End to End Product Management Flow', () => {
        it('complete flow: create, view, update and delete product', async () => {
            // STEP 1: Navigate to Create Product and create a product
            axios.get.mockResolvedValueOnce({ data: mockCategories });
            axios.post.mockResolvedValueOnce({ 
                data: { success: true, message: 'Product created successfully' }
            });

            renderWithRouter(<CreateProduct />, '/dashboard/admin/create-product');
      
            // Fill in and submit product form
            await waitFor(() => {
              expect(screen.getByText('Create Product')).toBeInTheDocument();
            });
            
            const nameInput = screen.getByPlaceholderText('Enter a name');
            userEvent.type(nameInput, 'New Test Product');
            
            const descInput = screen.getByPlaceholderText('Enter a description');
            userEvent.type(descInput, 'New test description');
            
            const priceInput = screen.getByPlaceholderText('Enter a price');
            userEvent.type(priceInput, '199.99');
            
            const quantityInput = screen.getByPlaceholderText('Enter a quantity');
            userEvent.type(quantityInput, '50');
            
            // Submit and verify redirect to products page
            const createButton = screen.getByText('CREATE PRODUCT');
            userEvent.click(createButton);

            await waitFor(() => {
                expect(axios.post).toHaveBeenCalled()
                expect(window.location.pathname).toBe('/dashboard/admin/products');
            })

            // STEP 2: Verify product appears in products list
            // Clear mocks and set up for Products component
            jest.clearAllMocks();
            axios.get.mockResolvedValueOnce({ data: mockProducts });
            
            renderWithRouter(<Products />, '/dashboard/admin/products');
            
            await waitFor(() => {
                expect(screen.getByText('Test Product')).toBeInTheDocument();
            });

            // STEP 3: Update the product
            // Set up mocks for update flow
            jest.clearAllMocks();
            axios.get.mockResolvedValueOnce({ data: mockSingleProduct });
            axios.get.mockResolvedValueOnce({ data: mockCategories });
            axios.put.mockResolvedValueOnce({ 
                data: { success: true, message: 'Product updated successfully' }
            });
            
            // Navigate to update page
            renderWithRouter(<UpdateProduct />, '/dashboard/admin/product/test-product');
            
            // Update product details
            await waitFor(() => {
                expect(screen.getByText('Update Product')).toBeInTheDocument();
            });
            
            const updateNameInput = screen.getByDisplayValue('Test Product');
            userEvent.clear(updateNameInput);
            userEvent.type(updateNameInput, 'Updated Product Name');
            
            const updateButton = screen.getByText('UPDATE PRODUCT');
            userEvent.click(updateButton);
            
            await waitFor(() => {
                expect(axios.put).toHaveBeenCalled();
            });
        
            // STEP 4: Delete the product
            // Set up mocks for delete flow
            jest.clearAllMocks();
            window.prompt.mockReturnValue('yes');
            axios.delete.mockResolvedValueOnce({ 
                data: { success: true, message: 'Product deleted successfully' }
            });
            
            // Click delete button
            const deleteButton = screen.getByText('DELETE PRODUCT');
            userEvent.click(deleteButton);
            
            // Verify deletion and redirect
            await waitFor(() => {
                expect(axios.delete).toHaveBeenCalled();
                expect(window.location.pathname).toBe('/dashboard/admin/products');
            });
        });
    })
})
