import {
  createProductController,
  getProductController,
  getSingleProductController,
} from "./productController";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import fs from "fs";
import slugify from "slugify";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase(); // Clear DB before each test
});

// Mock the braintree module
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({
    transaction: {
      sale: jest.fn().mockResolvedValue({ success: true }),
    },
  })),
  Environment: {
    Sandbox: "sandbox",
  },
}));

describe("Product Controllers", () => {
  let category, product;

  beforeEach(async () => {
    // Create a test category
    category = await categoryModel.create({ name: "Test Category" });

    // Create a test product
    product = await productModel.create({
      name: "Test Product",
      slug: "test-product",
      description: "Test product description",
      price: 100,
      category: category._id,
      quantity: 10,
    });
  });

  it("should create a product successfully", async () => {
    const req = {
      fields: {
        name: "New Product",
        description: "New product description",
        price: 50,
        category: category._id.toString(), // Ensure it's a valid ObjectId
        quantity: 5,
      },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Created Successfully",
      })
    );

    const createdProduct = await productModel.findOne({
      name: "New Product",
    });
    expect(createdProduct).toBeTruthy();
    expect(createdProduct.price).toBe(50);
  });

  it("getProductController should return products", async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        counTotal: 1,
        products: expect.any(Array),
      })
    );
  });

  it("getSingleProductController should return a single product", async () => {
    const req = { params: { slug: "test-product" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        product: expect.objectContaining({
          name: "Test Product",
          slug: "test-product",
        }),
      })
    );
  });

  it("getSingleProductController should return 500 if product is not found", async () => {
    const req = { params: { slug: "non-existent-product" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Error while getitng single product/i),
      })
    );
  });
});
