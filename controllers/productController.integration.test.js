import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import JWT from "jsonwebtoken";

import app from "../app.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";

jest.setTimeout(30000); // in case setup takes a bit

jest.mock("braintree", () => {
    return {
      Environment: { Sandbox: "sandbox" },
      BraintreeGateway: jest.fn().mockImplementation(() => ({
        transaction: {
          sale: jest.fn((data, cb) =>
            cb(null, {
              success: true,
              transaction: {
                id: "fake-transaction-id",
                amount: data.amount,
                status: "submitted_for_settlement",
              },
            })
          ),
        },
        clientToken: {
          generate: jest.fn((_, cb) =>
            cb(null, { clientToken: "fake-client-token" })
          ),
        },
      })),
    };
  });

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Braintree Payment Integration", () => {
    let user;
    let token;
  
    beforeEach(async () => {
      // Create a fake user
      user = await userModel.create({
        name: "Test User",
        email: "test@example.com",
        password: "password",
        phone: "1234567890",
        address: "123 Test St",
        answer: "Test",
      });
  
      // Generate JWT for auth
      process.env.JWT_SECRET = "test_secret";
      token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
    });
  
    afterEach(async () => {
      await productModel.deleteMany();
      await orderModel.deleteMany();
      await userModel.deleteMany();
    });
  
    test("should process payment and create order", async () => {

      const category = await categoryModel.create({
          name: "Test Category",
          slug: "test-category"
      });
      const product = await productModel.create({
          name: "Checkout Product",
          slug: "checkout-product",
          description: "desc",
          price: 99,
          quantity: 5,
          shipping: true,
          category: category._id,
      });
  
      const cart = [
        { _id: product._id.toString(), name: product.name, price: product.price },
      ];
  
      const res = await request(app)
        .post("/api/v1/product/braintree/payment")
        .set("Authorization", token)
        .send({
          nonce: "fake-valid-nonce",
          cart,
        });
  
      // 4. Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
  
      // 5. Verify order created
      const orders = await orderModel.find({ buyer: user._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products.length).toBe(1);
      expect(orders[0].payment.transaction.amount).toBe(99);
      expect(orders[0].payment.transaction.id).toBe("fake-transaction-id");
    });
});

describe("Product Controller Integration Tests", () => {

  afterEach(async () => {
    await productModel.deleteMany();
    await categoryModel.deleteMany();
  });

  test("GET /api/v1/product/get-product should return list of products", async () => {
    const category = await categoryModel.create({ name: "Cat1", slug: "cat1" });

    await productModel.create({
      name: "Product A",
      slug: "product-a",
      description: "Desc A",
      price: 100,
      quantity: 10,
      category: category._id,
      shipping: true,
    });

    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe("Product A");
  });

  test("GET /api/v1/product/get-product/:slug should return a single product", async () => {
    const category = await categoryModel.create({ name: "Cat2", slug: "cat2" });

    const product = await productModel.create({
      name: "Product B",
      slug: "product-b",
      description: "Desc B",
      price: 200,
      quantity: 5,
      category: category._id,
      shipping: false,
    });

    const res = await request(app).get(`/api/v1/product/get-product/${product.slug}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product.name).toBe("Product B");
  });

  test("POST /api/v1/product/product-filters should filter products by category and price", async () => {
    const cat = await categoryModel.create({ name: "FilterCat", slug: "filter-cat" });

    await productModel.create([
      {
        name: "Low Price Product",
        slug: "low-price",
        description: "Cheap",
        price: 50,
        quantity: 1,
        category: cat._id,
        shipping: true,
      },
      {
        name: "High Price Product",
        slug: "high-price",
        description: "Expensive",
        price: 1000,
        quantity: 1,
        category: cat._id,
        shipping: true,
      },
    ]);

    const res = await request(app).post("/api/v1/product/product-filters").send({
      checked: [cat._id],
      radio: [0, 100],
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe("Low Price Product");
  });

  test("GET /api/v1/product/product-count should return the total number of products", async () => {
    const category = await categoryModel.create({ name: "CountCat", slug: "count-cat" });

    await productModel.create({
      name: "Counted Product",
      slug: "counted-product",
      description: "Test",
      price: 20,
      quantity: 5,
      category: category._id,
    });

    const res = await request(app).get("/api/v1/product/product-count");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/v1/product/product-list/1 should return paginated products", async () => {
    const cat = await categoryModel.create({ name: "PageCat", slug: "page-cat" });

    for (let i = 0; i < 8; i++) {
      await productModel.create({
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Desc ${i}`,
        price: 10 * i,
        quantity: 2,
        category: cat._id,
        shipping: true,
      });
    }

    const res = await request(app).get("/api/v1/product/product-list/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBeLessThanOrEqual(6);
  });

  test("GET /api/v1/product/search/:keyword should return matching products", async () => {
    const cat = await categoryModel.create({ name: "SearchCat", slug: "search-cat" });
  
    await productModel.create({
      name: "SpecialProduct",
      slug: "special-product",
      description: "something special",
      price: 150,
      quantity: 3,
      category: cat._id,
      shipping: true,
    });
  
    const res = await request(app).get("/api/v1/product/search/special");
  
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("SpecialProduct");
  });
  
  test("GET /api/v1/product/product-category/:slug should return products by category slug", async () => {
    const cat = await categoryModel.create({ name: "Category1", slug: "category-1" });
  
    await productModel.create({
      name: "Cat Product",
      slug: "cat-product",
      description: "From Category",
      price: 20,
      quantity: 2,
      category: cat._id,
      shipping: true,
    });
  
    const res = await request(app).get("/api/v1/product/product-category/category-1");
  
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Category1");
    expect(res.body.products.length).toBe(1);
  });  

  test("GET /api/v1/product/get-product/:slug should return 500 if product is not found", async () => {
    const res = await request(app).get("/api/v1/product/get-product/nonexistent-product");
  
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Error while getting single product");
  });

  test("GET /product-photo/:pid returns 500 if product not found", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/v1/product/product-photo/${id}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Erorr while getting photo");
  });

  test("POST /product-filters returns 400 for negative price", async () => {
    const category = await categoryModel.create({ name: "Test", slug: "test-cat" });

    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [category._id], radio: [-100, -50] });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Error WHile Filtering Products");
  });

  test("GET /product-list/1 returns 400 on DB error", async () => {
    const spy = jest.spyOn(productModel, "find").mockImplementation(() => {
      throw new Error("mocked failure");
    });

    const res = await request(app).get("/api/v1/product/product-list/1");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("error in per page ctrl");

    spy.mockRestore();
  });

  test("GET /search/:keyword returns 400 on DB error", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  
    const spy = jest
      .spyOn(productModel, "find")
      .mockImplementation(() => {
        throw new Error("search fail");
      });
  
    const res = await request(app).get("/api/v1/product/search/anything");
  
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Error In Search Product API");
  
    spy.mockRestore();
    logSpy.mockRestore();
  });

  test("GET /product-category/:slug returns 400 on DB error", async () => {
    const spy = jest.spyOn(categoryModel, "findOne").mockRejectedValue(new Error("fail"));

    const res = await request(app).get("/api/v1/product/product-category/test-cat");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Error While Getting products");

    spy.mockRestore();
  });
});