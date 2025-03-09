import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter as Router} from "react-router-dom"
import AdminDashboard from "./AdminDashboard"
import { useAuth } from "../../context/auth"
// import { useCategory } from "../../hooks/useCategory"
import { useCart } from "../../context/cart"
import { useSearch } from "../../context/search"
import '@testing-library/jest-dom'

// Mock useAuth, useCart, and useCategory
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(),
}))
jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [[]]),
}))
jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "", results: [] }, jest.fn()]), // Mock search state and setter
}));

describe("AdminDashboard", () => {
    describe("When user is authenticated", () => {
    beforeEach(() => {
        useAuth.mockReturnValue([{
            user: {
                name: "Admin Name",
                email: "admin@example.com",
                phone: "1234567890",
            },
        },
    jest.fn()])
    })

it("displays the admin's details and admin menu", () => {
    render(
        <Router>
            <AdminDashboard />
        </Router>
    )

// Check if the screen correctly displays the admin's details
expect(screen.getByText((content) => content.includes("Admin Name : Admin Name"))).toBeInTheDocument();
expect(screen.getByText((content) => content.includes("Admin Email : admin@example.com"))).toBeInTheDocument();
expect(screen.getByText((content) => content.includes("Admin Contact : 1234567890"))).toBeInTheDocument();


// Ensure that admin menu is displayed on the side
expect(screen.queryByTestId("admin-menu")).toBeInTheDocument()
    })
})

describe("When user is not authenticated", () => {
    beforeEach (() => {
        useAuth.mockReturnValue([{
            user: null,
        },
    jest.fn()])
    })

    it("prevents unauthenticated users from accessing the dashboard", () => {
        render(
            <Router>
                <AdminDashboard />
            </Router>
        )

    // No admin details to be present on the screen
    expect(screen.queryByText(/Admin Name:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Admin Email:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Admin Contact:/i)).not.toBeInTheDocument();

    // Admin menu should not be present
    expect(screen.queryByTestId("admin-menu")).not.toBeInTheDocument()
        })
    })
})



