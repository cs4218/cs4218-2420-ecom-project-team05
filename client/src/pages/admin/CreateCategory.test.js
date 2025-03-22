import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

// Mock dependencies
jest.mock("axios")

jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
    error: jest.fn(),
  }));

jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));

jest.mock("./../../components/AdminMenu", () => () => (
    <div data-testid="admin-menu">Admin Menu</div>
  ));

jest.mock("../../components/Form/CategoryForm", () => {
  return jest.fn(({ handleSubmit, value, setValue }) => (
    <form onSubmit={handleSubmit} data-testid="category-form">
    {/* <form onSubmit={handleSubmit}> */}
      <input
        type="text"
        data-testid="category-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  ));
});

jest.mock('antd', () => {
    const actual = jest.requireActual('antd');
    return {
      ...actual,
      Modal: ({ children, open, onCancel, footer }) => {
        if (!open) return null;
        return (
          <div className="mock-modal">
            <button data-testid="modal-close-btn" onClick={onCancel}>Close</button>
            {children}
          </div>
        );
      },
    };
  });

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful category fetch on component mount
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });
  });

  it("renders the component correctly", async () => {
    render(<CreateCategory />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("layout-title").textContent).toBe("Dashboard - Create Category");
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    expect(screen.getByText("Manage Category")).toBeInTheDocument();
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
  });

  it("loads and displays categories", async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
  });

  it("handles category creation successfully", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
      },
    });

    render(<CreateCategory />);
    
    const inputElement = screen.getByTestId("category-input");
    const formElement = screen.getByTestId("category-form");

    // Type a valid category name
    fireEvent.change(inputElement, { target: { value: "Furniture" } });
    fireEvent.submit(formElement);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
        name: "Furniture",
      });
      expect(toast.success).toHaveBeenCalledWith("Furniture is created");
      // Verify that getAllCategory is called again to refresh the list
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("handles category creation failure", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: "Category already exists",
      },
    });

    render(<CreateCategory />);
    
    const inputElement = screen.getByTestId("category-input");
    const formElement = screen.getByTestId("category-form");

    fireEvent.change(inputElement, { target: { value: "Electronics" } });
    fireEvent.submit(formElement);

    await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
          name: "Electronics",
        });
        expect(toast.error).toHaveBeenCalledWith("Category already exists");
      });
    });

    it("handles update category modal opening", async () => {
        render(<CreateCategory />);
        
        await waitFor(() => {
          expect(screen.getByText("Electronics")).toBeInTheDocument();
        });
    
        const editButtons = screen.getAllByText("Edit");
        fireEvent.click(editButtons[0]);
    
        expect(screen.getByTestId("modal")).toBeInTheDocument();
      });

  it("handles category update successfully", async () => {
    // Mock the initial category fetch
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });
    
    // Mock the update API call
    axios.put.mockResolvedValue({
      data: {
        success: true,
      },
    });

    render(<CreateCategory />);
    
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    
    const modal = screen.getByTestId("modal"); // Get the modal first
    const modalInput = within(modal).getByTestId("category-input"); // Get input within modal
    fireEvent.change(modalInput, { target: { value: "Updated Electronics" } });
    
    const modalForm = within(modal).getByTestId("category-form");
    fireEvent.submit(modalForm);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Updated Electronics" }
      );
      
      expect(toast.success).toHaveBeenCalledWith("Updated Electronics is updated");
      expect(axios.get).toHaveBeenCalledTimes(2);
      
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });
  });

  it("handles category update error from API", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });
    
    axios.put.mockResolvedValue({
      data: {
        success: false,
        message: "Category name already exists",
      },
    });

    render(<CreateCategory />);
    
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);
    
    const modal = screen.getByTestId("modal");
    const modalInput = within(modal).getByTestId("category-input");
    fireEvent.change(modalInput, { target: { value: "Books" } });
    
    const modalForm = within(modal).getByTestId("category-form");
    fireEvent.submit(modalForm);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Books" }
      );
      expect(toast.error).toHaveBeenCalledWith("Category name already exists");
      
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });
  });

  it("handles category update network error", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });
    
    // Mock the update API call with a network error
    axios.put.mockRejectedValue(new Error("Network error"));

    render(<CreateCategory />);
    
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);
    
    const modal = screen.getByTestId("modal");
    const modalForm = within(modal).getByTestId("category-form");
    fireEvent.submit(modalForm);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("handles category deletion successfully", async () => {
    // Mock the initial category fetch
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });
    
    // Mock the delete API call
    axios.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    render(<CreateCategory />);
    
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
      
      expect(toast.success).toHaveBeenCalledWith("Category Deleted Successfully");
      
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("handles category deletion API error", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });
    
    axios.delete.mockResolvedValue({
      data: {
        success: false,
        message: "Cannot delete category with associated products",
      },
    });

    render(<CreateCategory />);
    
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
      expect(toast.error).toHaveBeenCalledWith("Cannot delete category with associated products");
    });
  });

  it("handles category deletion network error", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics" },
          { _id: "2", name: "Books" },
        ],
      },
    });
    
    // Mock the delete API call with a network error
    axios.delete.mockRejectedValue(new Error("Network error"));

    render(<CreateCategory />);
    
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

      // Validation checks for category names
    
      it("should not allow category name with only numbers", async () => {
        render(<CreateCategory />);
        
        const inputElement = screen.getByTestId("category-input");
        const formElement = screen.getByTestId("category-form");
    
        fireEvent.change(inputElement, { target: { value: "12345" } });
        fireEvent.submit(formElement);
    
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Category name cannot contain only numbers");
        });
      });
    
      it("should not allow category name with only symbols", async () => {
        render(<CreateCategory />);
        
        const inputElement = screen.getByTestId("category-input");
        const formElement = screen.getByTestId("category-form");
    
        fireEvent.change(inputElement, { target: { value: "@#$%" } });
        fireEvent.submit(formElement);
    
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Category name cannot contain only symbols");
        });
      });
    
      it("should not allow empty category name", async () => {
        render(<CreateCategory />);
        
        const inputElement = screen.getByTestId("category-input");
        const formElement = screen.getByTestId("category-form");
    
        fireEvent.change(inputElement, { target: { value: "" } });
        fireEvent.submit(formElement);
    
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Category name is required");
        });
      });
    
      it("should handle network errors when fetching categories", async () => {
        axios.get.mockRejectedValueOnce(new Error("Network error"));
        
        render(<CreateCategory />);
    
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
        });
      });
    
      it("should handle API errors when creating category", async () => {
        axios.post.mockRejectedValueOnce(new Error("API error"));
    
        render(<CreateCategory />);
        
        const inputElement = screen.getByTestId("category-input");
        const formElement = screen.getByTestId("category-form");
    
        fireEvent.change(inputElement, { target: { value: "Furniture" } });
        fireEvent.submit(formElement);
    
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Something went wrong in the input form");
        });
      });
    
      it("should handle closing the update modal", async () => {
        // Mock the initial category fetch
        axios.get.mockResolvedValue({
          data: {
            success: true,
            category: [
              { _id: "1", name: "Electronics" },
              { _id: "2", name: "Books" },
            ],
          },
        });
        
        render(<CreateCategory />);
        
        await waitFor(() => {
          expect(screen.getByText("Electronics")).toBeInTheDocument();
        });
      
        const editButtons = screen.getAllByText("Edit");
        fireEvent.click(editButtons[0]);
      
        expect(screen.getByTestId("modal")).toBeInTheDocument();
        
        const closeButton = screen.getByTestId("modal-close-btn");
        fireEvent.click(closeButton);
        
        await waitFor(() => {
          expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
        });
      });
    });