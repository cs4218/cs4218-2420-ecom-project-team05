import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import "@testing-library/jest-dom";

describe("AdminMenu component", () => {
  it("renders the Admin Panel title", () => {
    render(
      <Router>
        <AdminMenu />
      </Router>
    );

    const title = screen.getByText(/Admin Panel/i);
    expect(title).toBeInTheDocument();
  });

  it("renders the menu links", () => {
    render(
      <Router>
        <AdminMenu />
      </Router>
    );

    const createCategoryLink = screen.getByText(/Create Category/i);
    const createProductLink = screen.getByText(/Create Product/i);
    const productsLink = screen.getByText(/Products/i);
    const ordersLink = screen.getByText(/Orders/i);

    expect(createCategoryLink).toBeInTheDocument();
    expect(createProductLink).toBeInTheDocument();
    expect(productsLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();
  });

  it("links have correct hrefs", () => {
    render(
      <Router>
        <AdminMenu />
      </Router>
    );

    const createCategoryLink = screen.getByText(/Create Category/i);
    const createProductLink = screen.getByText(/Create Product/i);
    const productsLink = screen.getByText(/Products/i);
    const ordersLink = screen.getByText(/Orders/i);

    expect(createCategoryLink).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category"
    );
    expect(createProductLink).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product"
    );
    expect(productsLink).toHaveAttribute("href", "/dashboard/admin/products");
    expect(ordersLink).toHaveAttribute("href", "/dashboard/admin/orders");
  });
});
