import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Pagenotfound from "../pages/Pagenotfound";

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

describe("Pagenotfound Component", () => {
  test("should render 404 page correctly", () => {
    renderWithRouter(<Pagenotfound />);

    expect(document.title).toBe("go back- page not found");

    expect(screen.getByText("404")).toBeInTheDocument();

    expect(screen.getByText("Oops ! Page Not Found")).toBeInTheDocument();
  });

  test("should have a Go Back link that navigates to home page", () => {
    renderWithRouter(<Pagenotfound />);

    const goBackLink = screen.getByText("Go Back");
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveAttribute("href", "/");
  });
});
