import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
    success: jest.fn(),
  }));
  const mockNavigate = jest.fn();
  jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: "test-product" }),
  }));
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

// Mock problematic DOM methods
const originalElementQuerySelector = Element.prototype.querySelector;
Element.prototype.querySelector = function(selector) {
  try {
    return originalElementQuerySelector.call(this, selector);
  } catch (e) {
    if (e.message.includes('is not a valid selector')) {
      return null;
    }
    throw e;
  }
};

describe("CreateProduct Component", () => {
    const mockCategories = [
      { _id: "1", name: "Electronics" },
      { _id: "2", name: "Clothing" },
      { _id: "3", name: "Books" },
    ];

    const createTestFile = (name = "test-image.jpg", type = "image/jpeg", size = 1024 * 1024) => {
        const file = new File(["dummy content"], name, { type });
        Object.defineProperty(file, "size", { value: size });
        return file;
      };
      
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock successful category fetch
        axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });
  
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "mocked-url");
    });
  
    afterEach(() => {
      delete global.URL.createObjectURL;
    })

    it("renders CreateProduct component correctly", async () => {
        render(
            <BrowserRouter>
              <CreateProduct />
            </BrowserRouter>
        )

        expect(screen.getByTestId("layout")).toBeInTheDocument();
        expect(screen.getByTestId("layout")).toHaveAttribute("data-title", "Dashboard - Create Product");
        expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
        expect(screen.getByText("Create Product")).toBeInTheDocument();

         // Verify form elements are present
        expect(screen.getByText("Select a category")).toBeInTheDocument();
        expect(screen.getByText("Upload Photo")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter a name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter a description")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter a price")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter a quantity")).toBeInTheDocument();
        expect(screen.getByTestId("shipping-select")).toBeInTheDocument();
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();

    // Verify categories are fetched
    await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    })

    it("handles category fetch error", async () => {
        axios.get.mockRejectedValueOnce(new Error("Network error"));
    
        render(
          <BrowserRouter>
            <CreateProduct />
          </BrowserRouter>
        );
    
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting catgeory");
        });
      });

      it("allows image upload and preview", async () => {
        render(
          <BrowserRouter>
            <CreateProduct />
          </BrowserRouter>
        );
    
        const file = createTestFile();
        const fileInput = screen.getByLabelText("Upload Photo", { selector: "input" });
        
        await userEvent.upload(fileInput, file);
    
        await waitFor(() => {
          expect(screen.getByAltText("product_photo")).toBeInTheDocument();
          expect(screen.getByAltText("product_photo")).toHaveAttribute("src", "mocked-url");
          expect(screen.getByText(file.name)).toBeInTheDocument();
        });
      });

      it("validates form fields before submission", async () => {
        render(
          <BrowserRouter>
            <CreateProduct />
          </BrowserRouter>
        );
    
        // Click create button without filling any fields
        await act(async () => fireEvent.click(screen.getByText("CREATE PRODUCT")));
    
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please input your details");
          });
    
        // Verify axios.post wasn't called because validation should prevent submission
        expect(axios.post).not.toHaveBeenCalled();
      })

      it("successfully creates a product with all fields filled", async () => {
        axios.post.mockResolvedValueOnce({
          data: { success: true, message: "Product created successfully" },
        });
      
        render(
          <BrowserRouter>
            <CreateProduct />
          </BrowserRouter>
        );
      
        const nameInput = screen.getByPlaceholderText("Enter a name");
        const descInput = screen.getByPlaceholderText("Enter a description");
        const priceInput = screen.getByPlaceholderText("Enter a price");
        const quantityInput = screen.getByPlaceholderText("Enter a quantity");
        const fileInput = screen.getByLabelText("Upload Photo", { selector: "input" });
      
        await act(async () => {
          await userEvent.type(nameInput, "Test Product");
          await userEvent.type(descInput, "This is a test product");
          await userEvent.type(priceInput, "99.99");
          await userEvent.type(quantityInput, "10");
          await userEvent.upload(fileInput, createTestFile());
        });
      
          // Select category
          await act(async () => {
            const categorySelect = screen.getByText("Select a category");
            fireEvent.mouseDown(categorySelect);
          });
          
          await waitFor(() => {
            const option = screen.getByText("Electronics");
            
            act(() => {
              fireEvent.click(option);
            });
          });

          // Select shipping
          await act(async () => {
            const selectContainer = screen.getByTestId("shipping-select");
            const searchInput = selectContainer.querySelector(".ant-select-selection-search-input");
          
            // Click directly on the input to open the dropdown
            fireEvent.mouseDown(searchInput);
          });
        await waitFor(() => {
        const optionYes = document.querySelector('.ant-select-item-option[title="Yes"]') || 
                        document.querySelector('.ant-select-item-option-content:contains("Yes")');
                        if (optionYes) {
                          act(() => {
                            fireEvent.click(optionYes);
                          });
                        }
                      });
                      
                      // Submit form
                      await act(async () => {
                        fireEvent.click(screen.getByText("CREATE PRODUCT"));
                      });
      
          await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
              "/api/v1/product/create-product",
              expect.any(FormData)
            );
            expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
          });
        });

        it("handles image size validation - too large", async () => {
            render(
              <BrowserRouter>
                <CreateProduct />
              </BrowserRouter>
            );
        
            // Create a file that's too large (5MB)
            const largeFile = createTestFile("large-image.jpg", "image/jpeg", 5 * 1024 * 1024);
            const fileInput = screen.getByLabelText("Upload Photo", { selector: "input" });
            
            await act(async () => {await userEvent.upload(fileInput, largeFile)});
    
            await waitFor(() => {
              expect(screen.queryByAltText("product_photo")).not.toBeInTheDocument();
              expect(toast.error).toHaveBeenCalledWith("Image size should be less than 1MB");
            });
          });

        it("handles image type validation - invalid type", async () => {
            render(
              <BrowserRouter>
                <CreateProduct />
              </BrowserRouter>
            );

            // Create a non-image file
            const textFile = createTestFile("test.txt", "text/plain", 1024);
            const fileInput = screen.getByLabelText("Upload Photo", { selector: "input" });

            await act(async () => await userEvent.upload(fileInput, textFile));

            await waitFor(() => {
            expect(screen.queryByAltText("product_photo")).not.toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith("Please upload an image file");
            });
        });

        // To reduce number of test cases, we omit entering the name to see what message we get. This can be generalized to all the other fields when creating a product.
        it("validates required fields - name missing", async () => {
            render(
              <BrowserRouter>
                <CreateProduct />
              </BrowserRouter>
            );
        
            // Fill all fields except name
            await act(async () => {
            const descInput = screen.getByPlaceholderText("Enter a description");
            const priceInput = screen.getByPlaceholderText("Enter a price");
            const quantityInput = screen.getByPlaceholderText("Enter a quantity");
            
            await userEvent.type(descInput, "This is a test product");
            await userEvent.type(priceInput, "99.99");
            await userEvent.type(quantityInput, "10");
        
            fireEvent.click(screen.getByText("CREATE PRODUCT"));
            })

            await waitFor(() => {
                expect(screen.getByText("Name is required")).toBeInTheDocument();
              });
          });

          it("validates price boundary value - zero price", async () => {
            jest.spyOn(toast, "error");
          
            render(
              <BrowserRouter>
                <CreateProduct />
              </BrowserRouter>
            );
          
            const nameInput = screen.getByPlaceholderText("Enter a name");
            const descriptionInput = screen.getByPlaceholderText("Enter a description");
            const priceInput = screen.getByPlaceholderText("Enter a price");
            const quantityInput = screen.getByPlaceholderText("Enter a quantity");
          
            // Select category
            const categorySelect = screen.getAllByRole("combobox")[0];
          
            await act(async () => {
              await userEvent.click(categorySelect);
              fireEvent.change(categorySelect, { target: { value: "mockedCategoryId" } });
          
              // Select shipping
              const selectContainer = screen.getByTestId("shipping-select");
              const searchInput = selectContainer.querySelector(".ant-select-selection-search-input");
          
              // Click directly on the input to open the dropdown
              fireEvent.mouseDown(searchInput);
            });
          
            await waitFor(() => {
              const optionYes =
                document.querySelector('.ant-select-item-option[title="Yes"]') ||
                document.querySelector('.ant-select-item-option-content:contains("Yes")');
              if (optionYes) {
                fireEvent.click(optionYes);
              }
            });
          
            await act(async () => {
              await userEvent.type(nameInput, "Test Product");
              await userEvent.type(descriptionInput, "Test Description");
              await userEvent.type(quantityInput, "5");
          
              // Set price to zero
              await userEvent.clear(priceInput);
              await userEvent.type(priceInput, "0");
          
              fireEvent.click(screen.getByRole("button", { name: /CREATE PRODUCT/i }));
            });
          
            await waitFor(() => {
              expect(screen.getByText("Price must be greater than zero")).toBeInTheDocument();
            });
          });
          
          it("validates price boundary value - decimal places", async () => {
            jest.spyOn(toast, "error");
          
            render(
              <BrowserRouter>
                <CreateProduct />
              </BrowserRouter>
            );
          
            const nameInput = screen.getByPlaceholderText("Enter a name");
            const descriptionInput = screen.getByPlaceholderText("Enter a description");
            const priceInput = screen.getByPlaceholderText("Enter a price");
            const quantityInput = screen.getByPlaceholderText("Enter a quantity");
          
            // Select category
            const categorySelect = screen.getAllByRole("combobox")[0];
          
            await act(async () => {
              await userEvent.click(categorySelect);
              fireEvent.change(categorySelect, { target: { value: "mockedCategoryId" } });
          
              // Select shipping
              const selectContainer = screen.getByTestId("shipping-select");
              const searchInput = selectContainer.querySelector(".ant-select-selection-search-input");
          
              // Click directly on the input to open the dropdown
              fireEvent.mouseDown(searchInput);
            });
          
            await waitFor(() => {
              const optionYes =
                document.querySelector('.ant-select-item-option[title="Yes"]') ||
                document.querySelector('.ant-select-item-option-content:contains("Yes")');
              if (optionYes) {
                fireEvent.click(optionYes);
              }
            });
          
            await act(async () => {
              await userEvent.type(nameInput, "Test Product");
              await userEvent.type(descriptionInput, "Test Description");
              await userEvent.type(quantityInput, "5");
          
              // Set price to an invalid decimal value
              await userEvent.clear(priceInput);
              await userEvent.type(priceInput, "2728.27728");
          
              fireEvent.click(screen.getByRole("button", { name: /CREATE PRODUCT/i }));
            });
          
            await waitFor(() => {
              expect(screen.getByText("Price can only be up to 2 decimal places")).toBeInTheDocument();
            });
          });          

          it("validates quantity boundary value - negative quantity", async () => {
            jest.spyOn(toast, "error");
          
            render(
              <BrowserRouter>
                <CreateProduct />
              </BrowserRouter>
            );
          
            const nameInput = screen.getByPlaceholderText("Enter a name");
            const descriptionInput = screen.getByPlaceholderText("Enter a description");
            const priceInput = screen.getByPlaceholderText("Enter a price");
            const quantityInput = screen.getByPlaceholderText("Enter a quantity");
          
            // Select category
            const categorySelect = screen.getAllByRole("combobox")[0];
          
            await act(async () => {
              await userEvent.click(categorySelect);
              fireEvent.change(categorySelect, { target: { value: "mockedCategoryId" } });
          
              // Select shipping
              const selectContainer = screen.getByTestId("shipping-select");
              const searchInput = selectContainer.querySelector(".ant-select-selection-search-input");
          
              fireEvent.mouseDown(searchInput);
            });
          
            await waitFor(() => {
              const optionYes =
                document.querySelector('.ant-select-item-option[title="Yes"]') ||
                document.querySelector('.ant-select-item-option-content:contains("Yes")');
              if (optionYes) {
                fireEvent.click(optionYes);
              }
            });
          
            await act(async () => {
              await userEvent.type(nameInput, "Test Product");
              await userEvent.type(descriptionInput, "Test Description");
              await userEvent.type(priceInput, "10");
          
              // Set quantity to negative
              await userEvent.clear(quantityInput);
              await userEvent.type(quantityInput, "-1");
          
              fireEvent.click(screen.getByRole("button", { name: /CREATE PRODUCT/i }));
            });
          
            await waitFor(() => {
              expect(screen.getByText("Quantity cannot be negative")).toBeInTheDocument();
            });
          });
          
          it("validates that shipping option is selected", async () => {
            render(
              <BrowserRouter>
                <CreateProduct />
              </BrowserRouter>
            );
          
            const nameInput = screen.getByPlaceholderText("Enter a name");
          
            await act(async () => {
              await userEvent.type(nameInput, "Test Product");
          
              const categorySelect = screen.getByText("Select a category");
              fireEvent.mouseDown(categorySelect);
            });
          
            await waitFor(() => {
              const option = screen.getByText("Electronics");
              fireEvent.click(option);
            });
          
            await act(async () => {
              fireEvent.click(screen.getByText("CREATE PRODUCT"));
            });
          
            await waitFor(() => {
              expect(screen.getByText("Please select a shipping option")).toBeInTheDocument();
            });
          });          
    })