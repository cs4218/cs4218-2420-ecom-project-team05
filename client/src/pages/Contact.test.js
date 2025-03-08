import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom"; 
import Contact from "../pages/Contact"; 
import '@testing-library/jest-dom';


jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock("../hooks/useCategory");

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  

jest.mock("react-icons/bi", () => ({
  BiMailSend: () => <span>Mail Icon</span>,
  BiPhoneCall: () => <span>Phone Icon</span>,
  BiSupport: () => <span>Support Icon</span>,
}));


describe("Contact Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

  it("renders the Contact component correctly", () => {
    // Render the Contact component wrapped in BrowserRouter for routing context
    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    // Check if the heading is rendered
    expect(screen.getByText("CONTACT US")).toBeInTheDocument();

    // Check if the image is rendered correctly
    const imgElement = screen.getByAltText("contactus");
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute("src", "/images/contactus.jpeg");

    // Check if the email, phone, and toll-free number are rendered correctly
    expect(screen.getByText(/www.help@ecommerceapp.com/i)).toBeInTheDocument();
    expect(screen.getByText(/012-3456789/i)).toBeInTheDocument();
    expect(screen.getByText(/1800-0000-0000/i)).toBeInTheDocument();
  });

  it("renders the icons correctly", () => {
    // Render the Contact component wrapped in BrowserRouter
    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    // Check if the correct icons are displayed
    expect(screen.getByText(/www.help@ecommerceapp.com/i)).toContainHTML('<svg');
    expect(screen.getByText(/012-3456789/i)).toContainHTML('<svg');
    expect(screen.getByText(/1800-0000-0000/i)).toContainHTML('<svg');
  });
});
