import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";
import '@testing-library/jest-dom';

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

const originalElementQuerySelectorAll = Element.prototype.querySelectorAll;
Element.prototype.querySelectorAll = function(selector) {
  try {
    return originalElementQuerySelectorAll.call(this, selector);
  } catch (e) {
    if (e.message.includes('is not a valid selector')) {
      return [];
    }
    throw e;
  }
};

describe("UpdateProduct Component", () => {
    const mockCategories = [
      { _id: "1", name: "Electronics" },
      { _id: "2", name: "Clothing" },
      { _id: "3", name: "Books" },
    ];

    const mockProduct = {
      _id: "product123",
      name: "Test Product",
      description: "Test Description",
      price: 99.99,
      quantity: 10,
      shipping: 1,
      category: { _id: "1", name: "Electronics" },
      slug: "test-product"
    };

    const createTestFile = (name = "test-image.jpg", type = "image/jpeg", size = 1024 * 1024) => {
        const file = new File(["dummy content"], name, { type });
        Object.defineProperty(file, "size", { value: size });
        return file;
      };

      beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        // Mock successful category fetch
        axios.get.mockImplementation((url) => {
          if (url === "/api/v1/category/get-category") {
            return Promise.resolve({
              data: { success: true, category: mockCategories },
            });
          } else if (url.includes("/api/v1/product/get-product/")) {
            return Promise.resolve({
              data: { success: true, product: mockProduct },
            });
          }
          return Promise.reject(new Error("Unexpected URL"));
        });

        // Mock URL.createObjectURL
        global.URL.createObjectURL = jest.fn(() => "mocked-url");
      });

      afterEach(() => {
        delete global.URL.createObjectURL;
        console.log.mockRestore();
      });

      it("renders UpdateProduct component correctly", async () => {
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        // Assertions for layout
          await waitFor(() => {
            expect(screen.getByTestId("layout")).toBeInTheDocument();
            expect(screen.getByTestId("layout")).toHaveAttribute("data-title", "Dashboard - Create Product");
            expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
            expect(screen.getByText("Update Product")).toBeInTheDocument();
        });
      
        // Assertions for form data
          await waitFor(() => {
            expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
            expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
            expect(screen.getByDisplayValue("99.99")).toBeInTheDocument();
            expect(screen.getByDisplayValue("10")).toBeInTheDocument();
        });
      
        // Assertions for API calls
          await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-product");
          });
      });

      it("handles category fetch error", async () => {
        axios.get.mockImplementation((url) => {
          if (url === "/api/v1/category/get-category") {
            return Promise.reject(new Error("Network error"));
          } else if (url.includes("/api/v1/product/get-product/")) {
            return Promise.resolve({
              data: { success: true, product: mockProduct },
            });
          }
          return Promise.reject(new Error("Unexpected URL"));
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await act(async () => {
          await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
          });
        });
      });
      
      it("handles product fetch error", async () => {
        const consoleLogSpy = jest.spyOn(console, 'log');
      
        axios.get.mockImplementation((url) => {
          if (url === "/api/v1/category/get-category") {
            return Promise.resolve({
              data: { success: true, category: mockCategories },
            });
          } else if (url.includes("/api/v1/product/get-product/")) {
            return Promise.reject(new Error("Network error"));
          }
          return Promise.reject(new Error("Unexpected URL"));
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await act(async () => {
          await waitFor(() => {
            expect(consoleLogSpy).toHaveBeenCalled();
          });
        });
      });
      
      it("allows image upload and preview", async () => {
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        const file = createTestFile();
        
        // Using act for file input interaction
        let fileInput;
        await act(async () => {
          fileInput = await waitFor(() => screen.getByLabelText("Upload Photo", { selector: "input" }));
        });
      
        // Using act for user event
        await act(async () => {
          await userEvent.upload(fileInput, file);
        });
      
        // Using act for assertions
        await act(async () => {
          await waitFor(() => {
            const previewImage = screen.getAllByAltText("product_photo")[0];
            expect(previewImage).toBeInTheDocument();
            expect(previewImage).toHaveAttribute("src", "mocked-url");
            expect(screen.getByText(file.name)).toBeInTheDocument();
          });
        });
      });

      it("successfully updates a product's name", async () => {
        axios.put.mockResolvedValueOnce({
          data: { success: true, message: "Product updated successfully" },
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });
      
        const nameInput = screen.getByDisplayValue("Test Product");
    
        await act(async () => {
          await userEvent.clear(nameInput);
          await userEvent.type(nameInput, "Updated Product Name");
        })
      
        const updateButton = screen.getByText("UPDATE PRODUCT");
      
        await act(async () => {
          fireEvent.click(updateButton);
        });

        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
      });
      
      
      it("successfully updates a product's description", async () => {
        // Mock axios response
        axios.put.mockResolvedValueOnce({
          data: { success: true, message: "Product updated successfully" },
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        const descriptionInput = screen.getByDisplayValue("Test Description");
      
        await act(async () => {
          await userEvent.clear(descriptionInput);
          await userEvent.type(descriptionInput, "Updated Product Description");
        })
      
        const updateButton = screen.getByText("UPDATE PRODUCT");
        
        await act(async () => {
          fireEvent.click(updateButton);
        });

        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
      });
      
      
      it("successfully updates a product's price", async () => {
        axios.put.mockResolvedValueOnce({
          data: { success: true, message: "Product updated successfully" },
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("99.99")).toBeInTheDocument();
        });
      
        const priceInput = screen.getByDisplayValue("99.99");
        await act(async () => {
          await userEvent.clear(priceInput);
          await userEvent.type(priceInput, "Updated Product Price");
        })
       
        // Submit form
        const updateButton = screen.getByText("UPDATE PRODUCT");
        await act(async () => fireEvent.click(updateButton));
      
        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
      });
      
      it("successfully updates a product's quantity", async () => {
        axios.put.mockResolvedValueOnce({
          data: { success: true, message: "Product updated successfully" },
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("10")).toBeInTheDocument();
        });
      
        const quantityInput = screen.getByDisplayValue("10");
        await act(async () => {
          await userEvent.clear(quantityInput);
          await userEvent.type(quantityInput, "Updated Product Quantity");
        });
      
        // Submit form
        const updateButton = screen.getByText("UPDATE PRODUCT");
        await act(async () => {
          fireEvent.click(updateButton);
        });
      
        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
      });
      
      it("successfully updates a product's description", async () => {
        axios.put.mockResolvedValueOnce({
          data: { success: true, message: "Product updated successfully" },
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
        });
      
        const descriptionInput = screen.getByDisplayValue("Test Description");
        await act(async () => {
          await userEvent.clear(descriptionInput);
          await userEvent.type(descriptionInput, "Updated Product Description");
        });
      
        // Submit form
        const updateButton = screen.getByText("UPDATE PRODUCT");
        await act(async () => {
          fireEvent.click(updateButton);
        });
      
        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
      });
      
      it("successfully updates the category", async () => {
        axios.put.mockResolvedValueOnce({
          data: { success: true, message: "Product updated successfully" },
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });
      
        const categorySelect = screen.getByText("Electronics");
      
        await act(async () => {
          fireEvent.mouseDown(categorySelect);
        });
      
        await waitFor(() => {
          const option = screen.getByText("Books");
          fireEvent.click(option);
        });
      
        const updateButton = screen.getByText("UPDATE PRODUCT");
        await act(async () => {
          fireEvent.click(updateButton);
        });
      
        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
      });      

      it("successfully updates the shipping option", async () => {
        axios.put.mockResolvedValueOnce({
          data: { success: true, message: "Product updated successfully" },
        });
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });
      
        const shippingSelect = screen.getByText(shipping => shipping === "Yes" || shipping === "No");
      
        await act(async () => {
          fireEvent.mouseDown(shippingSelect);
        });
      
        const currentValue = mockProduct.shipping;
        const optionToSelect = currentValue === 1 ? "No" : "Yes";
      
        await waitFor(() => {
          const option = screen.getByText(optionToSelect);
          fireEvent.click(option);
        });
      
        // Submit form
        const updateButton = screen.getByText("UPDATE PRODUCT");
        await act(async () => {
          fireEvent.click(updateButton);
        });
      
        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
      });
      
      it("shows error toast when update returns success: false", async () => {
        // Mock response with success: false and an error message
        const errorMessage = "Invalid product data";
        axios.put.mockResolvedValueOnce({
          data: { success: false, message: errorMessage },
        });
      
        await act(async () => {
          render(<UpdateProduct />);
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });
      
        // Make a change to the product name
        const nameInput = screen.getByDisplayValue("Test Product");
        fireEvent.change(nameInput, { target: { value: "Updated Product Name" } });
      
        // Submit form
        const updateButton = screen.getByText("UPDATE PRODUCT");
        await act(async () => {
          fireEvent.click(updateButton);
        });
      
        await waitFor(() => {
          expect(axios.put).toHaveBeenCalledWith(
            "/api/v1/product/update-product/product123",
            expect.any(FormData)
          );
          expect(toast.error).toHaveBeenCalledWith(errorMessage);
          expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
        });
      });
      
      it("handles update error", async () => {
        // Mock the axios.put call to reject with an error
        axios.put.mockRejectedValueOnce(new Error("Update failed"));
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });
      
        // Submit form without changes
        const updateButton = screen.getByText("UPDATE PRODUCT");
        await act(async () => {
          fireEvent.click(updateButton);
        });
      
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
      });
      
      it("successfully deletes a product", async () => {
        axios.delete.mockResolvedValueOnce({
          data: { success: true, message: "Product deleted successfully" },
        });
      
        // Mock window.prompt
        global.window.prompt = jest.fn(() => "yes");
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
        });
      
        // Click delete button
        const deleteButton = screen.getByText("DELETE PRODUCT");
        await act(async () => {
          fireEvent.click(deleteButton);
        });
      
        expect(window.prompt).toHaveBeenCalledWith(
          "Are you sure you want to delete this product?"
        );
      
        await waitFor(() => {
          expect(axios.delete).toHaveBeenCalledWith(
            "/api/v1/product/delete-product/product123"
          );
        });
      
        expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
      });
      
      it("cancels product deletion when prompt is dismissed", async () => {
        // Mock window.prompt to return null (Cancel)
        global.window.prompt = jest.fn(() => null);
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
        });
      
        // Click delete button
        const deleteButton = screen.getByText("DELETE PRODUCT");
        await act(async () => {
          fireEvent.click(deleteButton);
        });
      
        await waitFor(() => {
          expect(window.prompt).toHaveBeenCalledWith(
            "Are you sure you want to delete this product?"
          );
          expect(axios.delete).not.toHaveBeenCalled();
        });
      });
      
      it("handles deletion error", async () => {
        axios.delete.mockRejectedValueOnce(new Error("Deletion failed"));
        global.window.prompt = jest.fn(() => "yes");
      
        await act(async () => {
          render(
            <BrowserRouter>
              <UpdateProduct />
            </BrowserRouter>
          );
        });
      
        await waitFor(() => {
          expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
        });
      
        // Click delete button
        const deleteButton = screen.getByText("DELETE PRODUCT");
        await act(async () => {
          fireEvent.click(deleteButton);
        });
      
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
      });      
    });