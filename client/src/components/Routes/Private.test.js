import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import { test, describe, beforeEach, jest, expect } from "@jest/globals";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";
import React from "react";


jest.mock("axios");
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));
jest.mock("../Spinner", () => () => <div>Loading...</div>);

const MockComponent = () => <div>Private Component</div>;

const renderWithRouter = (authMock) => {
  useAuth.mockReturnValue(authMock);
  render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route path="/private" element={<PrivateRoute />}>
          <Route index element={<MockComponent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe("PrivateRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Spinner when no token is present", async () => {
    renderWithRouter([null, jest.fn()]);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders Spinner when authCheck fails", async () => {
    axios.get.mockResolvedValue({ data: { ok: false } });
    renderWithRouter([{ token: "validToken" }, jest.fn()]);
    await waitFor(() => expect(screen.getByText("Loading...")).toBeInTheDocument());
  });

  test("renders Outlet when authCheck succeeds", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });
    renderWithRouter([{ token: "validToken" }, jest.fn()]);
    await waitFor(() => expect(screen.getByText("Private Component")).toBeInTheDocument());
  });

  test("does not call authCheck API when no auth token", async () => {
    renderWithRouter([null, jest.fn()]);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test("calls authCheck API when token is available", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });
    renderWithRouter([{ token: "validToken" }, jest.fn()]);
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth"));
  });
});