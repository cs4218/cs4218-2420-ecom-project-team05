import React from "react";
import { fireEvent, waitFor, render, screen } from "@testing-library/react";
import { test, jest } from "@jest/globals";
import axios from "axios";
import {
  MemoryRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import CategoryProduct from "./CategoryProduct";

jest.mock("axios");

// Mock useParams to return a slug
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);

describe("CategoryProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders category name and products correctly", async () => {
    useParams.mockReturnValue({ slug: "electronics" });

    const mockResponse = {
      data: {
        category: { name: "Electronics" },
        products: [
          {
            _id: "1",
            name: "Laptop",
            price: 999,
            slug: "laptop",
            description: "Powerful gaming laptop",
          },
        ],
      },
    };

    axios.get.mockResolvedValue(mockResponse);

    render(
      <MemoryRouter initialEntries={["/category/electronics"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.getByText("Category - Electronics")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("$999.00")).toBeInTheDocument();
      expect(screen.getByText("Powerful gaming laptop...")).toBeInTheDocument();
    });
  });

  test("renders '0 result found' when no products are returned", async () => {
    useParams.mockReturnValue({ slug: "books" });

    const mockResponse = {
      data: {
        category: { name: "Books" },
        products: [],
      },
    };

    axios.get.mockResolvedValue(mockResponse);

    render(
      <MemoryRouter initialEntries={["/category/books"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Category - Books")).toBeInTheDocument();
      expect(screen.getByText("0 result found")).toBeInTheDocument();
    });
  });

  test("handles API error gracefully", async () => {
    useParams.mockReturnValue({ slug: "furniture" });

    axios.get.mockRejectedValue(new Error("API Error"));

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Ensure category name does not appear due to API failure
    await waitFor(() => {
      expect(screen.queryByText("Category - Furniture")).not.toBeInTheDocument();
    });
  });

  test("should navigate to product details page when 'More Details' is clicked", async () => {
    useParams.mockReturnValue({ slug: "electronics" });
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
  
    const mockResponse = {
      data: {
        category: { name: "Electronics" },
        products: [
          {
            _id: "1",
            name: "Laptop",
            price: 999,
            slug: "laptop",
            description: "Powerful gaming laptop",
          },
        ],
      },
    };
  
    axios.get.mockResolvedValue(mockResponse);
  
    render(
      <MemoryRouter initialEntries={["/category/electronics"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );
  
    // Wait for products to be displayed
    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  
    // Click "More Details"
    fireEvent.click(screen.getByText("More Details"));
  
    // Ensure navigation was triggered correctly
    expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
  });


  test("should navigate to product details page when 'More Details' is clicked", async () => {
    useParams.mockReturnValue({ slug: "electronics" });
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
  
    const mockResponse = {
      data: {
        category: { name: "Electronics" },
        products: [
          {
            _id: "1",
            name: "Laptop",
            price: 999,
            slug: "laptop",
            description: "Powerful gaming laptop",
          },
        ],
      },
    };
  
    axios.get.mockResolvedValue(mockResponse);
  
    render(
      <MemoryRouter initialEntries={["/category/electronics"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );
  
    // Wait for products to be displayed
    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  
    // Click "More Details"
    fireEvent.click(screen.getByText("More Details"));
  
    // Ensure navigation was triggered correctly
    expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
  });
  
  test("should call getPrductsByCat when params.slug is present", async () => {
    useParams.mockReturnValue({ slug: "electronics" });
  
    const mockGetProducts = jest.spyOn(axios, "get").mockResolvedValue({
      data: {
        category: { name: "Electronics" },
        products: [
          { _id: "1", name: "Laptop", price: 999, slug: "laptop", description: "Gaming laptop" },
        ],
      },
    });
  
    render(
      <MemoryRouter initialEntries={["/category/electronics"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(mockGetProducts).toHaveBeenCalledWith("/api/v1/product/product-category/electronics");
    });
  
    mockGetProducts.mockRestore(); // Clean up after test
  });

  test("should NOT call getPrductsByCat when params.slug is missing", async () => {
    useParams.mockReturnValue({}); // No slug provided
  
    const mockGetProducts = jest.spyOn(axios, "get").mockResolvedValue({ data: {} });
  
    render(
      <MemoryRouter initialEntries={["/category/"]}>
        <Routes>
          <Route path="/category/:slug?" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(mockGetProducts).not.toHaveBeenCalled();
    });
  
    mockGetProducts.mockRestore(); // Clean up after test
  });
});
  