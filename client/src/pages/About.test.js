import React from "react";
import { render, screen } from "@testing-library/react";
import About from "../pages/About";
import "@testing-library/jest-dom";

// Mock Layout component to avoid rendering unnecessary children
jest.mock("../components/Layout", () => ({ title, children }) => (
  <>
    <title>{title}</title>
    <div>{children}</div>
  </>
));

describe("About Component", () => {
  test("should render About page correctly", () => {
    render(<About />);

    // Check if title is present
    expect(document.title).toBe("About us - Ecommerce app");

    // Check if image is displayed
    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/about.jpeg");

    // Check if paragraph text exists
    expect(screen.getByText("Add text")).toBeInTheDocument();
  });
});
