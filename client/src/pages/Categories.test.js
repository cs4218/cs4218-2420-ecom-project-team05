import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Categories from "../pages/Categories";
import useCategory from "../hooks/useCategory";

// Mock the useCategory hook
jest.mock("../hooks/useCategory");

// Mock the useAuth and useCart hooks (needed for Header)
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Ensure it returns an array
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[]]), // Ensure it returns an empty array
}));

jest.mock("../components/Layout", () => ({ title, children }) => (
  <>
    <title>{title}</title>
    <div>{children}</div>
  </>
));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Categories Component", () => {
  test("renders category buttons correctly", () => {
    // Mock category data
    const mockCategories = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Books", slug: "books" },
    ];
    useCategory.mockReturnValue(mockCategories);

    // Render component with MemoryRouter for routing support
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Check if categories are displayed as buttons
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
  });

  test("renders no categories when list is empty", () => {
    useCategory.mockReturnValue([]);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // No categories present to be clickable
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
