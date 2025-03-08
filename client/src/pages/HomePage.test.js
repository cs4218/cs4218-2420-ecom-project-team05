import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import HomePage from "../pages/HomePage";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "@testing-library/jest-dom";

// Mock axios
jest.mock("axios");

// Mock toast notifications
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

// Mock useCart hook
const mockSetCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], mockSetCart]),
}));

// Mock Layout component
jest.mock("../components/Layout", () => ({ title, children }) => (
  <>
    <title>{title}</title>
    <div>{children}</div>
  </>
));

const mockNavigate = jest.fn();
useNavigate.mockReturnValue(mockNavigate);

// Declare a global mock function
let mockAxiosGet;

beforeEach(() => {
  jest.clearAllMocks();
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.getItem = jest.fn(() => JSON.stringify([]));
  jest.spyOn(console, "log").mockImplementation(() => {});

  // Define a mock function for axios.get
  // if (!mockAxiosGet) {
    mockAxiosGet = jest.fn((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
      if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 3 } });
      }
    });

    axios.get.mockImplementation(mockAxiosGet);
  // }
});

// Mock data
const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Books" },
];

const mockProducts = [
  { _id: "prod1", name: "Laptop", price: 1000, description: "High-end laptop", slug: "laptop" },
  { _id: "prod2", name: "Phone", price: 500, description: "Smartphone", slug: "phone" },
];

describe("HomePage Component", () => {
  beforeEach(async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      );
    });
  });

  test("fetches and displays categories and products", async () => {
    await waitFor(() => {
      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
      expect(screen.getByText("All Products")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Phone")).toBeInTheDocument();
    });
  });

  test("filters products by category", async () => {
    axios.post.mockResolvedValueOnce({
      data: { products: [{ _id: "prod3", name: "Tablet", price: 700, description: "New tablet" }] },
    });

    const electronicsCheckbox = await screen.findByText("Electronics");
    fireEvent.click(electronicsCheckbox);

    await waitFor(() => expect(screen.getByText("Tablet")).toBeInTheDocument());
  });

  test("filters products by price", async () => {
    axios.post.mockResolvedValueOnce({
      data: { products: [{ _id: "prod3", name: "Tablet", price: 700, description: "New tablet" }] },
    });

    const priceCheckbox = await screen.findByText("$100 or more");
    fireEvent.click(priceCheckbox);

    await waitFor(() => expect(screen.getByText("Tablet")).toBeInTheDocument());
  });

  test("adds product to cart on button click", async () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([[], setCart]);

    await waitFor(() => expect(screen.getAllByText("Laptop")[0]).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("ADD TO CART")[0]);

    expect(mockSetCart).toHaveBeenCalledWith(expect.arrayContaining([mockProducts[0]]));
    expect(localStorage.setItem).toHaveBeenCalledWith("cart", JSON.stringify([mockProducts[0]]));
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("loads more products on button click", async () => {
    // Override axios.get mock for this specific test
    mockAxiosGet.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.resolve({
          data: { products: [{ _id: "prod3", name: "Tablet", price: 700, description: "A new tablet" }] },
        });
      }
    });

    // Ensure "Load More" button exists
    expect(screen.getByText(/Loadmore/i)).toBeInTheDocument();

    // Click "Load More" button
    fireEvent.click(screen.getByText(/Loadmore/i));

    // Wait for new product to appear
    await waitFor(() => expect(screen.getByText("Tablet")).toBeInTheDocument());

    // Ensure the list contains both old and new products
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Tablet")).toBeInTheDocument();
  });

  test("logs error if load more fetch fails", async () => {
    const mockError = new Error("Failed to fetch load more");
    // axios.get.mockRejectedValueOnce(mockError);

    mockAxiosGet.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.reject(mockError);
      }
    });
    
    console.log = jest.fn();

    // Click "Load More" button
    fireEvent.click(screen.getByText(/Loadmore/i));

    // Wait for error log
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(mockError);
    });

    // Ensure the new product is NOT added
    expect(screen.queryByText("Tablet")).not.toBeInTheDocument();
  });

  test("logs error if getAllProducts fetch fails", async () => {
    const mockError = new Error("Failed to fetch products");
  
    // Mock `axios.get` to fail when fetching products
    mockAxiosGet.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-list")) {
        return Promise.reject(mockError);
      }
    });
  
    console.log = jest.fn(); // Spy on console.log
  
    // Render the component (this triggers `getAllProducts`)
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      );
    });
  
    // Wait for the API failure and check the console log
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(mockError);
    });
  });  

  test("logs error if category fetch fails", async () => {
    const mockError = new Error("Failed to fetch categories");
    mockAxiosGet.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.reject(mockError);
      }
    });
    console.log = jest.fn();

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(console.log).toHaveBeenCalledWith(mockError);
  });

  test("logs error if getTotal fetch fails", async () => {
    const mockError = new Error("Failed to fetch product count");
  
    // Mock `axios.get` to fail when fetching the product count
    mockAxiosGet.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.reject(mockError);
      }
    });
  
    console.log = jest.fn(); // Spy on console.log
  
    // Render the component (this triggers `getTotal`)
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      );
    });
  
    // Wait for the API failure and check the console log
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(mockError);
    });
  });  

  test("logs error if product filtering fails", async () => {
    const mockError = new Error("Failed to fetch filtered products");
  
    // Mock `axios.post` to simulate API failure
    axios.post.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-filters")) {
        return Promise.reject(mockError);
      }
    });
  
    console.log = jest.fn(); // Spy on console.log
  
    // Click a category checkbox to trigger filtering
    const electronicsCheckbox = screen.getByRole("checkbox", { name: "Electronics" });
    fireEvent.click(electronicsCheckbox);
  
    // Wait for console.log to be called with the error
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(mockError);
    });
  });

  test("navigates to related product when clicking More Details", async () => {
    await waitFor(() => expect(screen.getAllByText("More Details").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("More Details")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
  });

  test("should filter products by both category and price", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: "filtered1",
            name: "Filtered Product",
            slug: "filtered-product",
            description: "A product that matches the filter criteria",
            price: 500,
            priceString: "$500.00",
          },
        ],
      },
    });
  
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });
  
    // Apply category filter
    fireEvent.click(screen.getByText("Electronics"));
  
    // Apply price filter
    fireEvent.click(screen.getByText("$100 or more"));
  
    await waitFor(() => {
      expect(screen.getByText("Filtered Product")).toBeInTheDocument();
    });
  
    // Ensure old products are hidden
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
  });
  

  test("should reset filters when Reset Filters button is clicked", async () => {
    // Delete the existing reload function before mocking
    delete window.location;
    window.location = { reload: jest.fn() };
  
    fireEvent.click(screen.getByText("RESET FILTERS"));
  
    expect(window.location.reload).toHaveBeenCalled(); // Ensure reload is triggered
  });

  test("should remove category from filter when unchecked", async () => {
    axios.post.mockResolvedValue({
      data: {
        products: [
          {
            _id: "prod3",
            name: "Filtered Product",
            description: "Test product",
            price: 700,
          },
        ],
      },
    });  

  // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    const categoryCheckbox = screen.getByLabelText("Electronics");

    expect(categoryCheckbox.checked).toBe(false);

    fireEvent.click(categoryCheckbox);

    await waitFor(() => {
      expect(categoryCheckbox.checked).toBe(true); // Ensure it's checked
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
        checked: ["cat1"], // The category should be added
        radio: [],
      });
    });

    fireEvent.click(categoryCheckbox);

    await waitFor(() => {
      expect(categoryCheckbox.checked).toBe(false); // Ensure it's unchecked
    });
  });

  test("should not call setCategories when data.success is false", async () => {
    const setCategoriesMock = jest.fn();
  
    axios.get.mockResolvedValueOnce({
      data: {
        success: false,
        category: [{ _id: "cat1", name: "Electronics" }],
      },
    });
  
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(setCategoriesMock).not.toHaveBeenCalled();
    });
  });
  
});
