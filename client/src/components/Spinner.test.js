import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter} from "react-router-dom";
import Spinner from "./Spinner";
import { act } from "react-dom/test-utils";
import "@testing-library/jest-dom"

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({ pathname: "/current" })),
  };
});

describe("Spinner Component", () => {
  let navigate;

  beforeEach(() => {
    navigate = jest.fn();
    jest
      .spyOn(require("react-router-dom"), "useNavigate")
      .mockReturnValue(navigate);
  });

  it("renders Spinner and displays countdown", () => {
    render(
      <MemoryRouter>
        <Spinner path="login" />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/redirecting to you in 3 second/i)
    ).toBeInTheDocument();
  });

  it("redirects after countdown reaches 0", async () => {
    jest.useFakeTimers();
    render(
      <MemoryRouter>
        <Spinner path="login" />
      </MemoryRouter>
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(navigate).toHaveBeenCalledWith("/login", { state: "/current" });
    jest.useRealTimers();
  });

  it("updates countdown state correctly", async () => {
    jest.useFakeTimers();
    render(
      <MemoryRouter>
        <Spinner path="dashboard" />
      </MemoryRouter>
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText(/redirecting to you in 2 second/i)
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText(/redirecting to you in 1 second/i)
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(navigate).toHaveBeenCalledWith("/dashboard", { state: "/current" });
    jest.useRealTimers();
  });
});
