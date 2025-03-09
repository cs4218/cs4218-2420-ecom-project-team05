import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Footer from "./Footer";
import "@testing-library/jest-dom";

describe("Footer Component", () => {
  const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it("renders the footer with copyright text", () => {
    renderWithRouter(<Footer />);

    const copyrightElement = screen.getByText(
      /All Rights Reserved © TestingComp/i
    );
    expect(copyrightElement).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    renderWithRouter(<Footer />);

    const aboutLink = screen.getByRole("link", { name: /About/i });
    const contactLink = screen.getByRole("link", { name: /Contact/i });
    const policyLink = screen.getByRole("link", { name: /Privacy Policy/i });

    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
    expect(policyLink).toBeInTheDocument();
  });

  it("navigation links have correct paths", () => {
    renderWithRouter(<Footer />);

    const aboutLink = screen.getByRole("link", { name: /About/i });
    const contactLink = screen.getByRole("link", { name: /Contact/i });
    const policyLink = screen.getByRole("link", { name: /Privacy Policy/i });

    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(contactLink).toHaveAttribute("href", "/contact");
    expect(policyLink).toHaveAttribute("href", "/policy");
  });
});
