import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("Products Component", () => {
  const mockProducts = [
    {
      _id: "1",
      name: "NUS T-shirt",
      slug: "nus-t-shirt",
      description: "Plain NUS T-shirt for sale",
      photo: "t-shirt.jpg",
    }, {
      _id: "2",
      name: "The Law of Contract in Singapore",
      slug: "law-contract-singapore",
      description: "A bestselling book in Singapore",
      photo: "book.jpg",
    }, {
      _id: "3",
      name: "Nokia 3310",
      slug: "nokia-3310",
      description: "A high-end smartphone",
      photo: "phone.jpg",
    }
  ]

const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

beforeEach(() => {
  jest.clearAllMocks()
})

it("renders Products component with the loading state", () => {
  // Mock axios to return a pending promise
  axios.get.mockImplementation(() => new Promise(() => {}))
  render(
    <BrowserRouter>
    <Products />
    </BrowserRouter>
  )

  expect(screen.getByTestId("layout")).toBeInTheDocument();
  expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  expect(screen.getByText("All Products List")).toBeInTheDocument();
})

it("fetches and displays products successfully", async () => {
  // Mock successful API response
  axios.get.mockResolvedValue({
    data: { products: mockProducts }
  })

  render(
    <BrowserRouter>
    <Products />
    </BrowserRouter>
  )

  await waitFor(() => {
    mockProducts.forEach((product) => {
      expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.description)).toBeInTheDocument();
        const productLink = screen.getByText(product.name).closest("a");
        expect(productLink).toHaveAttribute(
          "href",
          `/dashboard/admin/product/${product.slug}`
        )
    })
  })

  // Verify that the API was called correctly
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
  })

  it("displays correct product images", async () => {
    axios.get.mockResolvedValue({
      data: { products: mockProducts },
  })
  render(
    <BrowserRouter>
      <Products />
    </BrowserRouter>
  );

  // Wait for products to be loaded
  await waitFor(() => {
    mockProducts.forEach((product) => {
      const images = screen.getAllByRole("img");
      const productImage = images.find(img => img.alt === product.name);
      expect(productImage).toBeInTheDocument();
      expect(productImage).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${product._id}`
        );
      });
    });
  });

  it("handles API error correctly", async () => {
    const errorMessage = "Network Error";
    axios.get.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    // Wait for error to be handled
    await waitFor(() => {
      expect(console.log).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
    })
  })

  it("renders empty state when no products are returned", async () => {
    // Mock API response with empty products array
    axios.get.mockResolvedValue({
      data: { products: [] },
    })

    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      // No product cards should be rendered
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    })
  })
})
