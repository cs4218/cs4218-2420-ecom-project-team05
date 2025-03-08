import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useNavigate, MemoryRouter, Routes, Route, useParams } from "react-router-dom";
import { act } from "react-dom/test-utils";
import axios from "axios";
import ProductDetails from "../pages/ProductDetails";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "@testing-library/jest-dom";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));
const mockSetCart = jest.fn();

jest.mock("../context/cart", () => ({ useCart: jest.fn(() => [[], mockSetCart]) }));

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
    useParams: jest.fn(),
}));

const mockNavigate = jest.fn();
useNavigate.mockReturnValue(mockNavigate);

jest.mock("../components/Layout", () => ({ title, children }) => (
    <>
      <title>{title}</title>
      <div>{children}</div>
    </>
));

beforeEach(() => {
  jest.clearAllMocks(); // Clears call history but keeps mock implementations
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.getItem = jest.fn(() => JSON.stringify([]));
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

// Test Data
const mockProduct = {
  _id: "123",
  name: "Test Product",
  description: "This is a test product",
  price: 100,
  category: { _id: "cat1", name: "Test Category" },
};

const mockRelatedProducts = [
  { _id: "456", name: "Related Product 1", price: 50, description: "Desc 1", slug: "related-1" },
  { _id: "789", name: "Related Product 2", price: 75, description: "Desc 2", slug: "related-2" },
];

describe("ProductDetails Component", () => {
  beforeEach(async () => {

    useParams.mockReturnValue({ slug: "mock-product" });

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("/api/v1/product/related-product/")) {
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      }
      return Promise.reject(new Error("API Error"));
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });
  });

  test("fetches and displays product details", async () => {
    await waitFor(() => {
      expect(screen.getByText(/Name : Test Product/i)).toBeInTheDocument();
      expect(screen.getByText(/Description : This is a test product/i)).toBeInTheDocument();
      expect(screen.getByText(/Category : Test Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Price :\$100.00/i)).toBeInTheDocument();
    });
  });

  test("displays message if no related products are found", async () => {
    axios.get.mockResolvedValueOnce({ data: { product: mockProduct } });
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByText(/No similar products found/i)).toBeInTheDocument();
  });

  test("logs error if product fetch fails", async () => {
    const mockError = new Error("Failed to fetch product");
    axios.get.mockRejectedValueOnce(mockError);
    console.log = jest.fn();

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(console.log).toHaveBeenCalledWith(mockError));
  });

  test("logs error if simlar product fetch fails", async () => {
    const mockError = new Error("Failed to fetch similar product");
    axios.get.mockResolvedValueOnce({ data: { product: mockProduct }}).mockRejectedValueOnce(mockError);
    console.log = jest.fn();

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(console.log).toHaveBeenCalledWith(mockError);
  });

  test("adds product to cart on click", async () => {

    const setCart = jest.fn();

    useCart.mockReturnValue([[], setCart]);

    await waitFor(() => expect(screen.getByText("ADD TO CART")).toBeInTheDocument());

    fireEvent.click(screen.getByText("ADD TO CART"));

    expect(mockSetCart).toHaveBeenCalledWith([mockProduct]);
    expect(localStorage.setItem).toHaveBeenCalledWith("cart", JSON.stringify([mockProduct]));
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("navigates to related product when clicking More Details", async () => {
    await waitFor(() => expect(screen.getAllByText("More Details").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("More Details")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/product/related-1");
  });

  test("does not fetch product when slug is missing", async () => {
    useParams.mockReturnValue({ slug: "" });
  
    axios.get.mockClear();
  
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });
  
    expect(axios.get).not.toHaveBeenCalled();
  });
  
});
