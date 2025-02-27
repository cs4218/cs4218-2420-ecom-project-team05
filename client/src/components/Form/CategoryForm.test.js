import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm"; // Adjust the import path accordingly

describe("CategoryForm", () => {
  let handleSubmit, setValue;

  beforeEach(() => {
    handleSubmit = jest.fn(); // Mock handleSubmit function
    setValue = jest.fn(); // Mock setValue function
  });

  it("renders the form with an input and submit button", () => {
    // Render the CategoryForm component
    render(<CategoryForm handleSubmit={handleSubmit} value="" setValue={setValue} />);

    // Check if the input and button are rendered
    expect(screen.getByPlaceholderText("Enter new category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("updates the input value when typing", () => {
    // Render the CategoryForm component with an initial value
    render(<CategoryForm handleSubmit={handleSubmit} value="Initial value" setValue={setValue} />);

    const input = screen.getByPlaceholderText("Enter new category");

    // Simulate typing into the input field
    fireEvent.change(input, { target: { value: "New category" } });

    // Check if setValue is called with the correct value
    expect(setValue).toHaveBeenCalledWith("New category");
  });

  it("calls handleSubmit when the form is submitted", () => {
    // Render the CategoryForm component
    render(<CategoryForm handleSubmit={handleSubmit} value="New category" setValue={setValue} />);
  
    // Find the submit button
    const button = screen.getByRole("button", { name: /submit/i });
  
    // Simulate form submission by clicking the submit button
    fireEvent.submit(button);
  
    // Check if handleSubmit is called when the form is submitted
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
