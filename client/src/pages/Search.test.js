import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";

import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";

import Search from "../pages/Search";
import { useSearch } from "../context/search";

// Mock dependencies
jest.mock("react-hot-toast");
const mockSetCart = jest.fn();
const mockNavigate = jest.fn();
useNavigate.mockReturnValue(mockNavigate);
jest.mock("../context/cart", () => ({ useCart: jest.fn(() => [[], mockSetCart]) }));

jest.mock("../context/cart", () => ({
  useCart: jest.fn().mockReturnValue([[], () => {}]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

// Mock localStorage
const setItemMock = jest.fn();
Object.defineProperty(window, "localStorage", {
  value: {
    setItem: setItemMock,
    getItem: jest.fn(() => JSON.stringify([])),
  },
  writable: true,
});

const mockProduct = {
  _id: "123",
  name: "Test Product",
  description: "This is a test product",
  price: 100,
  category: { _id: "cat1", name: "Test Category" },
};

describe("Search Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn(() => JSON.stringify([]));
  });

  test("renders the search component with no results message", () => {
    useSearch.mockReturnValue([{ results: [] }]);

    render(<Search />);

    expect(screen.getByText("Search Resuts")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  test("renders search results when products are found", () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Description 1", price: 100 },
      { _id: "2", name: "Product 2", description: "Description 2", price: 200 },
    ];

    useSearch.mockReturnValue([{ results: mockProducts }]);

    render(<Search />);

    expect(screen.getByText("Found 2")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("$ 100")).toBeInTheDocument();
    expect(screen.getByText("$ 200")).toBeInTheDocument();
  });

  test("truncates long product descriptions", () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      description:
        "This is a very long description exceeding thirty characters",
      price: 100,
    };
    useSearch.mockReturnValue([{ results: [mockProduct] }]);

    render(<Search />);

    expect(
      screen.getByText("This is a very long descriptio...")
    ).toBeInTheDocument();
  });

  test("adds product to cart on click", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Description 1", price: 100 }
    ];
    useSearch.mockReturnValue([{ results: mockProducts }]);

    render(<Search />);

    const setCart = jest.fn();

    useCart.mockReturnValue([[], setCart]);

    await waitFor(() => expect(screen.getByText("ADD TO CART")).toBeInTheDocument());

    fireEvent.click(screen.getByText("ADD TO CART"));

  expect(setItemMock).toHaveBeenCalledWith(
    "cart",
    JSON.stringify([mockProducts[0]])
  ); 
     expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  // test("should add the product to the cart and update localStorage when 'Add to Cart' is clicked", () => {
  //   const mockProduct = {
  //     _id: "1",
  //     name: "Product 1",
  //     slug: "product-1",
  //     description: "This is a test product",
  //     price: 100,
  //   };

  //   useSearch.mockReturnValue([{ results: [mockProduct] }]);

  //   render(<Search />);

  //   const addToCartButton = screen.getByText("ADD TO CART");
  //   fireEvent.click(addToCartButton);

  //   expect(setItemMock).toHaveBeenCalledWith(
  //     "cart",
  //     JSON.stringify([mockProduct])
  //   );

  //   expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  // });

  test("navigates to related product when clicking More Details", async () => {
        const mockProducts = [
      { _id: "1", name: "Product 1", description: "Description 1", price: 100, slug: "related-1"}
    ];
    useSearch.mockReturnValue([{ results: mockProducts }]);

    render(<Search />);
    await waitFor(() => expect(screen.getAllByText("More Details").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("More Details")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/product/related-1");
  });
});