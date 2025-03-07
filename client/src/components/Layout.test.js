import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";
import { Helmet } from "react-helmet";

jest.mock("../components/Header", () => () => (
  <header data-testid="header">Mock Header</header>
));
jest.mock("../components/Footer", () => () => (
  <footer data-testid="footer">Mock Footer</footer>
));

test("renders Layout with default props", () => {
  render(
    <Layout>
      <div data-testid="children">Test Content</div>
    </Layout>
  );

  expect(screen.getByTestId("header")).toBeInTheDocument();
  expect(screen.getByTestId("footer")).toBeInTheDocument();
  expect(screen.getByTestId("children")).toBeInTheDocument();
});

test("renders Layout with custom title", async () => {
  render(
    <Layout title="Custom Title">
      <div data-testid="children">Test Content</div>
    </Layout>
  );

  await waitFor(() => {
    expect(document.title).toBe("Custom Title");
  });
});

test("renders meta tags correctly", async () => {
  render(
    <Layout
      description="Test Description"
      keywords="test, layout"
      author="Test Author"
    >
      <div data-testid="children">Test Content</div>
    </Layout>
  );

  await waitFor(() => {
    const helmet = Helmet.peek();
    expect(helmet.metaTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "description",
          content: "Test Description",
        }),
        expect.objectContaining({ name: "keywords", content: "test, layout" }),
        expect.objectContaining({ name: "author", content: "Test Author" }),
      ])
    );
  });
});
