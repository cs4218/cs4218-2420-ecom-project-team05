import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchInput from "../../components/Form/SearchInput";  // Ensure correct path
import { useSearch } from "../../context/search";
import axios from "axios";
import "@testing-library/jest-dom";

// Mock dependencies
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("axios");

// Mock react-router-dom and useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("SearchInput Component", () => {
  beforeEach(() => {
    // Mock useSearch hook
    useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);
  });

  test("triggers API call and navigates on form submit", async () => {
    const mockSetValues = jest.fn();
    
    useSearch.mockReturnValue([{ keyword: "Laptop", results: [] }, mockSetValues]);
    axios.get.mockResolvedValue({ data: [{ _id: "1", name: "Laptop" }] });

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const form = screen.getByRole("search");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Laptop");
      expect(mockSetValues).toHaveBeenCalledWith({ keyword: "Laptop", results: [{ _id: "1", name: "Laptop" }] });
      expect(mockNavigate).toHaveBeenCalledWith("/search");  // ✅ Ensure navigate is called
    });
  });
});
