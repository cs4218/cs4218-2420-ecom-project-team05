import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import UserMenu from "./UserMenu";
import "@testing-library/jest-dom";

describe("UserMenu component", () => {
  it("renders the Dashboard title", () => {
    render(
      <Router>
        <UserMenu />
      </Router>
    );

    const title = screen.getByText(/Dashboard/i);
    expect(title).toBeInTheDocument();
  });

  it("renders the menu links", () => {
    render(
      <Router>
        <UserMenu />
      </Router>
    );

    const profileLink = screen.getByText(/Profile/i);
    const ordersLink = screen.getByText(/Orders/i);

    expect(profileLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();
  });

  it("links have correct hrefs", () => {
    render(
      <Router>
        <UserMenu />
      </Router>
    );

    const profileLink = screen.getByText(/Profile/i);
    const ordersLink = screen.getByText(/Orders/i);

    expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
    expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
  });
});
