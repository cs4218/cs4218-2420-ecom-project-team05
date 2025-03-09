import { renderHook, act } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

describe("useSearch Hook", () => {
  test("should initialize with default search state", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    expect(result.current[0]).toEqual({
      keyword: "",
      results: [],
    });
  });

  test("should update search state when setAuth is called", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    const newSearchState = {
      keyword: "example",
      results: ["item1", "item2"],
    };

    act(() => {
      result.current[1](newSearchState);
    });

    expect(result.current[0]).toEqual(newSearchState);
  });

});