import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Product from "./productModel";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Product Model Tests", () => {
  it("should create a product successfully", async () => {
    const product = new Product({
      name: "Sample Product",
      slug: "sample-product",
      description: "This is a sample product.",
      price: 19.99,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      photo: {
        data: Buffer.from("sample data"),
        contentType: "image/png",
      },
      shipping: true,
    });

    const savedProduct = await product.save();
    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.name).toBe("Sample Product");
    expect(savedProduct.slug).toBe("sample-product");
    expect(savedProduct.price).toBe(19.99);
    expect(savedProduct.category).toBeDefined();
    expect(savedProduct.quantity).toBe(10);
    expect(savedProduct.photo.data).toBeDefined();
    expect(savedProduct.shipping).toBe(true);
  });

  it("should require all mandatory fields", async () => {
    const product = new Product({});

    try {
      await product.save();
    } catch (error) {
      expect(error.errors.name).toBeDefined();
      expect(error.errors.slug).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.price).toBeDefined();
      expect(error.errors.category).toBeDefined();
      expect(error.errors.quantity).toBeDefined();
    }
  });

  it("should not allow negative price", async () => {
    const product = new Product({
      name: "Invalid Price Product",
      slug: "invalid-price",
      description: "Product with negative price",
      price: -10,
      category: new mongoose.Types.ObjectId(),
      quantity: 5,
    });

    try {
      await product.save();
    } catch (error) {
      expect(error.errors.price).toBeDefined();
    }
  });

  it("should not allow negative quantity", async () => {
    const product = new Product({
      name: "Invalid Quantity Product",
      slug: "invalid-quantity",
      description: "Product with negative quantity",
      price: 10,
      category: new mongoose.Types.ObjectId(),
      quantity: -5,
    });

    try {
      await product.save();
    } catch (error) {
      expect(error.errors.quantity).toBeDefined();
    }
  });

  it("should default shipping to undefined", async () => {
    const product = new Product({
      name: "No Shipping Product",
      slug: "no-shipping",
      description: "Product without defined shipping",
      price: 10,
      category: new mongoose.Types.ObjectId(),
      quantity: 5,
    });

    const savedProduct = await product.save();
    expect(savedProduct.shipping).toBeUndefined();
  });
});
