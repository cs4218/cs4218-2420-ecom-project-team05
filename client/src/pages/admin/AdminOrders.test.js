import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { useAuth } from "../../context/auth";
import AdminOrders from "./AdminOrders";
import moment from "moment";
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock("../styles/Header.css", () => ({}), { virtual: true });
jest.mock("../../styles/Header.css", () => ({}), { virtual: true });
jest.mock("../../styles/AdminMenu.css", () => ({}), { virtual: true });
jest.mock("../../styles/Layout.css", () => ({}), { virtual: true });

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn()
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn().mockReturnValue([[], jest.fn()])
}));

// Mock the components used in AdminOrders
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div title={title}>{children}</div>
));

jest.mock("../../components/Header", () => () => <div>Header Component</div>);

// Mock Antd
jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  const Select = ({ children, onChange, defaultValue, bordered }) => (
    <select 
      data-testid="antd-select" 
      defaultValue={defaultValue} 
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  
  Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
  
  return {
    ...antd,
    Select
  };
});

describe("AdminOrders Component", () => {
  beforeEach(() => {
    useAuth.mockReturnValue([
      { token: "mockToken" },
      jest.fn()
    ]);
  });

  afterEach(() => {  
    jest.clearAllMocks();
  });

  const mockOrders = [
    {
      _id: "order1",
      status: "Not Processed",
      buyer: { name: "John Doe" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {_id: "product1", name: "Phone", description: "A sample", price: 99.99},
      ]
    },
    {
      _id: "order2",
      status: "Processing",
      buyer: { name: "Jane Doe" },
      createAt: new Date().toISOString(),
      payment: { success: false },
      products: [
        {_id: "product2", name: "NUS TShirt", description: "A comfy shirt", price: 29.99, quantity: 2},
        {_id: "product3", name: "Laptop", description: "A cool laptop", price: 2999.99},
      ]
    }
  ];

  it("renders AdminOrders component", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(<AdminOrders />);
    
    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
  });

  it("should fetch and display orders on load", async() => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("Phone")).toBeInTheDocument();
      expect(screen.getByText("NUS TShirt")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });

  it("should handle empty orders", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  it("should allow admin to change order status", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({});
  
    render(<AdminOrders />);
  
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  
    const selectElements = screen.getAllByTestId("antd-select");
    expect(selectElements.length).toBeGreaterThan(0);

    fireEvent.change(selectElements[0], { 
      target: { value: "Shipped" }
    });
  
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order1", {
        status: "Shipped",
      });
    });
  });

  it("should handle API failure when updating order status", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error("Failed to update"));

    const consoleSpy = jest.spyOn(console, 'log');
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    
    const selectElements = screen.getAllByTestId("antd-select");
    expect(selectElements.length).toBeGreaterThan(0);
    
    // Change the first select element's value
    fireEvent.change(selectElements[0], { 
      target: { value: "Delivered" }
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it("should correctly display payment status", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  it("should display the correct order time", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      const orderTime = moment(mockOrders[0].createAt).fromNow();
      const timeElements = screen.getAllByText(orderTime);
      expect(timeElements[0]).toBeInTheDocument();
    });
  });

  it("should correctly render multiple products in an order", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("Phone")).toBeInTheDocument();
      expect(screen.getByText("NUS TShirt")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });

  it("should handle an order with no products", async () => {
    const emptyProductOrder = {
      _id: "order3",
      status: "Not Processed",
      buyer: { name: "Empty Buyer" },
      createAt: new Date().toISOString(),
      payment: { success: false },
      products: [],
    };

    axios.get.mockResolvedValueOnce({ data: [emptyProductOrder] });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("Empty Buyer")).toBeInTheDocument();
      expect(screen.queryByText("Product")).not.toBeInTheDocument();
    });
  });

  it("should handle an order with no buyer", async () => {
    const noBuyerOrder = {
      _id: "order4",
      status: "Not Processed",
      buyer: null,
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [{ _id: "prod4", name: "New Item", description: "A test item", price: 80 }],
    };

    axios.get.mockResolvedValueOnce({ data: [noBuyerOrder] });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("New Item")).toBeInTheDocument();
      expect(screen.queryByText("undefined")).not.toBeInTheDocument();
    });
  });

  it("should display a placeholder if a product has no image", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      const images = screen.getAllByRole("img");
      images.forEach((img) => {
        expect(img).toBeInTheDocument();
      });
    });
  });

  it("loads orders on mount when auth token exists", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(<AdminOrders />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
  });

  it("doesn't call getOrders when auth token is missing", () => {
    useAuth.mockReturnValue([
      { user: {}, token: "" }, 
      jest.fn() 
    ]);
    
    axios.get.mockClear();
    
    render(<AdminOrders />);
    // Verify getOrders wasn't called (axios.get wasn't called)
    expect(axios.get).not.toHaveBeenCalled();
  });
});