/* eslint-disable testing-library/prefer-screen-queries */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

// Mock useNavigate and useLocation hooks
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: "/dashboard" }),
}));

describe("Login Component", () => {
  // Helper function to render component
  const renderLogin = () => {
    return render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
  };

  // Helper function to fill in form
  const fillForm = (email, password, getByPlaceholderText) => {
    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: email },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: password },
    });
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    const { getByPlaceholderText } = renderLogin();

    expect(getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
  });

  it("inputs should be initially empty", () => {
    const { getByPlaceholderText } = renderLogin();
    expect(getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(getByPlaceholderText("Enter Your Password").value).toBe("");
  });

  it("should allow typing email and password", () => {
    const { getByPlaceholderText } = renderLogin();
    fillForm("test@example.com", "password123", getByPlaceholderText);

    expect(getByPlaceholderText("Enter Your Email").value).toBe(
      "test@example.com"
    );
    expect(getByPlaceholderText("Enter Your Password").value).toBe(
      "password123"
    );
  });

  it("should navigate to forgot-password when forgot password button is clicked", () => {
    const { getByText } = renderLogin();
    fireEvent.click(getByText("Forgot Password"));

    expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
  });

  it("should login the user successfully with correct credentials", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Login successful",
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("test@example.com", "password123", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
        email: "test@example.com",
        password: "password123",
      });
      expect(toast.success).toHaveBeenCalledWith("Login successful", {
        duration: 5000,
        icon: "🙏",
        style: {
          background: "green",
          color: "white",
        },
      });
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should login successfully with uppercase email (case insensitive)", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Login successful",
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("TEST@EXAMPLE.COM", "password123", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should login successfully with email containing leading/trailing spaces", async () => {
    // The email with spaces is passed as-is to the server
    axios.post.mockResolvedValueOnce({
      data: {
        success: true, // Server accepts the email with spaces
        message: "Login successful",
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("  test@example.com  ", "password123", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      // Check that the API was called with exactly what was input
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
        email: "test@example.com",
        password: "password123",
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should display error for unregistered email", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Invalid email or password",
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("nonexistent@example.com", "password123", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });
  });

  it("should handle server error response", async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Invalid email or password"
        }
      }
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("test@example.com", "password123", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });
  });

  it("should handle invalid email format response from server", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Invalid email or password",
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("user@domain", "password123", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });
  });

  it("should prevent form submission with empty email due to required attribute", async () => {
    const { getByPlaceholderText, getByText } = renderLogin();

    // Only fill password
    fireEvent.change(getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });

    // Mock form validity
    const emailInput = getByPlaceholderText("Enter Your Email");
    Object.defineProperty(emailInput, "validity", {
      get: () => ({ valid: false }),
    });
    Object.defineProperty(emailInput.form, "checkValidity", {
      value: () => false,
    });

    fireEvent.click(getByText("LOGIN"));

    // Check that axios.post was not called
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should display error for correct email with incorrect password", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Invalid email or password", // The actual message your server returns
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("test@example.com", "wrongpassword", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });
  });

  it("should prevent form submission with empty password due to required attribute", async () => {
    const { getByPlaceholderText, getByText } = renderLogin();

    // Only fill email
    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });

    // Mock form validity
    const passwordInput = getByPlaceholderText("Enter Your Password");
    Object.defineProperty(passwordInput, "validity", {
      get: () => ({ valid: false }),
    });
    Object.defineProperty(passwordInput.form, "checkValidity", {
      value: () => false,
    });

    fireEvent.click(getByText("LOGIN"));

    // Check that axios.post was not called
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should handle password length error response", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Invalid email or password",
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("test@example.com", "12345", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });
  });

  it("should handle password with leading/trailing spaces", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Invalid email or password",
      },
    });

    const { getByPlaceholderText, getByText } = renderLogin();

    fillForm("test@example.com", "  pass123  ", getByPlaceholderText);
    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
        email: "test@example.com",
        password: "  pass123  ",
      });
    });
  });

  // it('should display error message on failed login', async () => {
  //     axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

  //     const { getByPlaceholderText, getByText } = render(
  //         <MemoryRouter initialEntries={['/login']}>
  //             <Routes>
  //                 <Route path="/login" element={<Login />} />
  //             </Routes>
  //         </MemoryRouter>
  //     );

  //     fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
  //     fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
  //     fireEvent.click(getByText('LOGIN'));

  //     await waitFor(() => expect(axios.post).toHaveBeenCalled());
  //     expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  // });
});
