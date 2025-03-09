import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Category from "./categoryModel";

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

describe("Category Model Tests", () => {
  it("should create a category successfully", async () => {
    const category = new Category({
      name: "Electronics",
      slug: "electronics",
    });

    const savedCategory = await category.save();
    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe("Electronics");
    expect(savedCategory.slug).toBe("electronics");
  });

  it("should store slug in lowercase", async () => {
    const category = new Category({
      name: "Home Appliances",
      slug: "Home-Appliances",
    });

    const savedCategory = await category.save();
    expect(savedCategory.slug).toBe("home-appliances"); // Ensure lowercase transformation
  });

  it("should allow duplicate category names", async () => {
    const category1 = new Category({
      name: "Books",
      slug: "books",
    });
    await category1.save();

    const category2 = new Category({
      name: "Books",
      slug: "books-duplicate",
    });

    const savedCategory = await category2.save();
    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe("Books");
  });

  it("should allow empty category name and slug", async () => {
    const category = new Category({});

    const savedCategory = await category.save();
    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBeUndefined();
    expect(savedCategory.slug).toBeUndefined();
  });
});
