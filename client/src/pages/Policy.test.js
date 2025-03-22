import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Policy from "../pages/Policy"; // Adjust path if necessary

// Mock Layout component
jest.mock("../components/Layout", () => ({ title, children }) => (
  <>
    <title>{title}</title>
    <div>{children}</div>
  </>
));

// Ensure React Router context is available
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Policy Component", () => {
  test("should render Privacy Policy page correctly", () => {
    renderWithRouter(<Policy />);

    expect(document.title).toBe("Privacy Policy");

    const image = screen.getByAltText("policy");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");

    expect(screen.getAllByText("add privacy policy").length).toBe(7);
  });
});
