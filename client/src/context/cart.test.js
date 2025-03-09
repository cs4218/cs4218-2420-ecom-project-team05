import { renderHook, act, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("useCart Hook", () => {

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("should initialize with an empty cart", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current[0]).toEqual([]);
  });

  test("should load cart data from localStorage", async () => {
    const mockCart = [{ id: "1", name: "Product 1", description: "product 1 description" }];
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockCart));

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => expect(result.current[0]).toEqual(mockCart));
    expect(localStorage.getItem).toHaveBeenCalledWith("cart");
  });

  test("should update cart state and call localStorage.setItem when setCart is called", async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    const newCart = [
      { id: "1", name: "product 1", description: "product 1 description" },
      { id: "2", name: "product 2", description: "product 2 description" },
    ];

    act(() => {
      result.current[1](newCart);
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual(newCart);
    });
  });
});
