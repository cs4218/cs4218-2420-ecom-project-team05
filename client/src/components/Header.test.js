import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Header from "./Header";
import "@testing-library/jest-dom";

jest.mock("./Form/SearchInput", () => {
  const React = require("react");
  return function DummySearchInput() {
    return React.createElement(
      "div",
      { "data-testid": "search-input" },
      "Search Input"
    );
  };
});

// Mock the useCategory hook
jest.mock("../hooks/useCategory", () => {
  return jest.fn(() => [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Books", slug: "books" },
  ]);
});

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

// Mock auth and cart contexts
jest.mock("../context/auth", () => {
  const React = require("react");
  const mockAuth = [{ user: null, token: "" }, jest.fn()];

  return {
    useAuth: jest.fn(() => mockAuth),
    AuthProvider: ({ children }) => React.createElement("div", null, children),
  };
});

jest.mock("../context/cart", () => {
  const React = require("react");
  const mockCart = [[], jest.fn()];

  return {
    useCart: jest.fn(() => mockCart),
    CartProvider: ({ children }) => React.createElement("div", null, children),
  };
});

const renderHeader = (authState = null, cartState = []) => {
  // Set up mock return values for the hooks
  require("../context/auth").useAuth.mockReturnValue([
    authState || { user: null, token: "" },
    jest.fn(),
  ]);

  require("../context/cart").useCart.mockReturnValue([cartState, jest.fn()]);

  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
};

describe("Header Component", () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("renders the navbar with logo", () => {
    renderHeader();
    const logo = screen.getByText("🛒 Virtual Vault");
    expect(logo).toBeInTheDocument();
  });

  it("renders login and register links when user is not authenticated", () => {
    renderHeader();
    const registerLink = screen.getByRole("link", { name: "Register" });
    const loginLink = screen.getByRole("link", { name: "Login" });

    expect(registerLink).toBeInTheDocument();
    expect(loginLink).toBeInTheDocument();
  });

  it("renders user dropdown when user is authenticated", () => {
    const authState = {
      user: { name: "Test User", role: 0 },
      token: "test-token",
    };

    renderHeader(authState);

    const userDropdown = screen.getByText("Test User");
    expect(userDropdown).toBeInTheDocument();

    // Login and Register should not be shown when user is authenticated
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.queryByText("Register")).not.toBeInTheDocument();
  });

  it("shows correct dashboard link for regular users", () => {
    const authState = {
      user: { name: "Regular User", role: 0 },
      token: "test-token",
    };

    renderHeader(authState);
    fireEvent.click(screen.getByText("Regular User"));

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
  });

  it("shows correct dashboard link for admin users", () => {
    const authState = {
      user: { name: "Admin User", role: 1 },
      token: "test-token",
    };

    renderHeader(authState);
    fireEvent.click(screen.getByText("Admin User"));

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
  });

  it("handles logout correctly", () => {
    const setAuth = jest.fn();
    const authState = {
      user: { name: "Test User", role: 0 },
      token: "test-token",
    };

    require("../context/auth").useAuth.mockReturnValue([authState, setAuth]);

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("Test User"));

    fireEvent.click(screen.getByRole("link", { name: "Logout" }));

    // Check if setAuth is called with correct arguments
    expect(setAuth).toHaveBeenCalledWith({
      ...authState,
      user: null,
      token: "",
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");

    const toast = require("react-hot-toast");
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });

  it("displays the correct cart count badge", () => {
    renderHeader(null, []);
    expect(screen.getByText("0")).toBeInTheDocument();

    // Simulate cart with items
    renderHeader(null, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders categories dropdown with correct categories", () => {
    renderHeader();

    // Open categories dropdown
    fireEvent.click(screen.getByText("Categories"));

    expect(screen.getByText("All Categories")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();

    const electronicsLink = screen.getByRole("link", { name: "Electronics" });
    expect(electronicsLink).toHaveAttribute("href", "/category/electronics");

    const booksLink = screen.getByRole("link", { name: "Books" });
    expect(booksLink).toHaveAttribute("href", "/category/books");
  });

  it("renders SearchInput component", () => {
    renderHeader();
    const searchInput = screen.getByTestId("search-input");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveTextContent("Search Input");
  });
});
