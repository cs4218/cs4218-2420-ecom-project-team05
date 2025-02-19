import React from "react";
import { fireEvent, waitFor, render, screen } from "@testing-library/react";
import { test, jest } from "@jest/globals";
import axios from "axios";
import {
  MemoryRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import CategoryProduct from "./CategoryProduct";

jest.mock("axios");

// Mock useParams to return a slug
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useParams: jest.fn(),
    useNavigate: jest.fn(),
  }));

jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);

describe("CategoryProduct Component", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test("renders category name and products correctly", async () => {
      useParams.mockReturnValue({ slug: "electronics" });
  
      const mockResponse = {
        data: {
          category: { name: "Electronics" },
          products: [
            {
              _id: "1",
              name: "Laptop",
              price: 999,
              slug: "laptop",
              description: "Powerful gaming laptop",
            },
          ],
        },
      };
  
      axios.get.mockResolvedValue(mockResponse);
  
      render(
        <MemoryRouter initialEntries={["/category/electronics"]}>
          <Routes>
            <Route path="/category/:slug" element={<CategoryProduct />} />
          </Routes>
        </MemoryRouter>
      );
  
      // Wait for the API call to resolve
      await waitFor(() => {
        expect(screen.getByText("Category - Electronics")).toBeInTheDocument();
        expect(screen.getByText("Laptop")).toBeInTheDocument();
        expect(screen.getByText("$999.00")).toBeInTheDocument();
        expect(screen.getByText("Powerful gaming laptop...")).toBeInTheDocument();
      });
    });
  
    test("renders '0 result found' when no products are returned", async () => {
      useParams.mockReturnValue({ slug: "books" });
  
      const mockResponse = {
        data: {
          category: { name: "Books" },
          products: [],
        },
      };
  
      axios.get.mockResolvedValue(mockResponse);
  
      render(
        <MemoryRouter initialEntries={["/category/books"]}>
          <Routes>
            <Route path="/category/:slug" element={<CategoryProduct />} />
          </Routes>
        </MemoryRouter>
      );
  
      await waitFor(() => {
        expect(screen.getByText("Category - Books")).toBeInTheDocument();
        expect(screen.getByText("0 result found")).toBeInTheDocument();
      });
    });
  
    test("handles API error gracefully", async () => {
      useParams.mockReturnValue({ slug: "furniture" });
  
      axios.get.mockRejectedValue(new Error("API Error"));
  
      render(
        <MemoryRouter>
          <CategoryProduct />
        </MemoryRouter>
      );
  
      // Ensure category name does not appear due to API failure
      await waitFor(() => {
        expect(screen.queryByText("Category - Furniture")).not.toBeInTheDocument();
      });
    });
});
  