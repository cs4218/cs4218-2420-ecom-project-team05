import React from "react";
import { render, screen, act } from "@testing-library/react";
import useCategory from "../hooks/useCategory";
import axios from "axios";
import '@testing-library/jest-dom';

jest.mock("axios");

describe("useCategory Hook", () => {
  beforeEach(() => {
    // Mock the console.log to prevent error logs during tests
    global.console.log = jest.fn();
  });

  it("fetches categories correctly", async () => {
    // Mock the axios.get call to simulate a successful response
    const mockCategories = {
      data: {
        category: ["Category 1", "Category 2"],
      },
    };
    axios.get.mockResolvedValue(mockCategories);

    // Custom component to test the hook
    const TestComponent = () => {
      const categories = useCategory();
      return <div>{categories.join(", ")}</div>;
    };

    // Render the TestComponent
    render(<TestComponent />);

    // Wait for the hook to update with the fetched categories
    await act(async () => {});

    // Check if the categories were correctly set
    expect(screen.getByText("Category 1, Category 2")).toBeInTheDocument();
  });

  it("handles errors correctly", async () => {
    // Mock axios to simulate an error
    axios.get.mockRejectedValue(new Error("Network error"));

    // Custom component to test the hook
    const TestComponent = () => {
      const categories = useCategory();
      return <div>{categories.length === 0 ? "No categories" : categories.join(", ")}</div>;
    };

    // Render the TestComponent
    render(<TestComponent />);

    // Wait for any state updates (even though there should be none since an error occurred)
    await act(async () => {});

    // Check if the categories array remains empty after an error
    expect(screen.getByText("No categories")).toBeInTheDocument();
  });
});
