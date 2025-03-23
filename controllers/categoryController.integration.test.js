import request from "supertest";
import app from "../app"; // Your express app
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Category Controller Integration Tests", () => {
  afterEach(async () => {
    await categoryModel.deleteMany(); // Clean up categories after each test
  });

  test("GET /api/v1/category/get-category should return list of categories", async () => {
    await categoryModel.create({
      name: "mqTestCategory",
      slug: "mqTestCategory"
    });

    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.length).toBe(1);
    expect(res.body.category[0].name).toBe("mqTestCategory");
  });

  test("GET /api/v1/category/single-category/:slug should return a single category", async () => {
    const category = await categoryModel.create({
      name: "mqTestCat2",
      slug: "mqTestCat2"
    });

    const res = await request(app).get(`/api/v1/category/single-category/${category.slug}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("mqTestCat2");
  });

  test("GET /api/v1/category/single-category/:slug returns 200 when no category found", async () => {
    const res = await request(app).get("/api/v1/category/single-category/no");

    expect(res.statusCode).toBe(200);
    expect(res.body.category).toBe(null);
  });

  test("GET /api/v1/category/single-category/:slug returns 500 on DB error", async () => {
    const spy = jest.spyOn(categoryModel, "findOne").mockRejectedValue(new Error("fail"));

    const res = await request(app).get("/api/v1/category/single-category/test-cat");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error While getting Single Category");

    spy.mockRestore();
  });
});

describe("Category Controller Admin Features Integration Test", () => {
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
      role: 1
    });

    // Generate JWT for auth
    process.env.JWT_SECRET = "test_secret";
    token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
  });

  afterEach(async () => {
    await userModel.deleteMany(); // Clean up user data after each test
    await productModel.deleteMany();
  });

  test("POST /api/v1/category/create-category should create category", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({ name: "Electronics" });
  
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("New category created");
  });

  test("POST /api/v1/category/delete-category should return 400 when category contains some product", async () => {
    const category = await categoryModel.create({
      name: "taggedCat",
      slug: "taggedCat"
    });

    await productModel.create({
      name: "Product A",
      slug: "product-a",
      description: "Desc A",
      price: 100,
      quantity: 10,
      category: category._id,
      shipping: true,
    });

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${category._id}`)
      .set("Authorization", token)
      .send({ name: "taggedCat" });
  
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Error while deleting category, category belongs to existing product");
  });


});
