import { createProductController } from "./productController";
import productModel from "../models/productModel.js";
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

describe("createProductController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      fields: {
        name: "Test Product",
        description: "Product description",
        price: 100,
        category: "66db427fdb0119d9234b27ed",
        quantity: 10,
      },
      files: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  it("should create a product successfully", async () => {
    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Created Successfully",
      })
    );
  });
});
