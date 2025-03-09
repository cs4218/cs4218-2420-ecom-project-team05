import {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  updateProductController,
  deleteProductController,
  realtedProductController,
  searchProductController,
  brainTreePaymentController,
  braintreeTokenController,
} from "./productController";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
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

// Mock the braintree module
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({
    clientToken: {
      generate: jest.fn((_, cb) =>
        cb(null, { success: true, clientToken: "fake-token" })
      ),
    },
    transaction: {
      sale: jest.fn((data, callback) => callback(null, { success: true })),
    },
  })),
  Environment: {
    Sandbox: "sandbox",
  },
}));

describe("Product Controllers", () => {
  let category, product1, product2, product3;

  beforeEach(async () => {
    category = await categoryModel.create({
      name: "Test Category",
      slug: "test-category",
    });

    product1 = await productModel.create({
      name: "Test Product",
      slug: "test-product",
      description: "A great product",
      price: 100,
      category: category._id,
      quantity: 10,
      photo: {
        data: Buffer.from("test image data"),
        contentType: "image/png",
      },
    });

    product2 = await productModel.create({
      name: "Test Product Two",
      slug: "test-product-two",
      description: "Another great product",
      price: 120,
      category: category._id,
      quantity: 5,
    });

    product3 = await productModel.create({
      name: "Different Category Product",
      slug: "different-category-product",
      description: "A different product",
      price: 90,
      category: new mongoose.Types.ObjectId(),
      quantity: 7,
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
        message: expect.stringMatching(/Error while getting single product/i),
      })
    );
  });

  it("productPhotoController should return product photo", async () => {
    const req = { params: { pid: product1._id } };
    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productPhotoController(req, res);

    expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("deleteProductController should delete a product", async () => {
    const req = { params: { pid: product1._id } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Deleted successfully",
      })
    );

    const deletedProduct = await productModel.findById(product1._id);
    expect(deletedProduct).toBeNull();
  });

  it("updateProductController should update a product", async () => {
    const req = {
      params: { pid: product1._id },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        category: category._id.toString(),
        quantity: 20,
      },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Updated Successfully",
      })
    );

    const updatedProduct = await productModel.findById(product1._id);
    expect(updatedProduct.name).toBe("Updated Product");
    expect(updatedProduct.price).toBe(150);
  });

  it("productFiltersController should return filtered products", async () => {
    const req = { body: { checked: [category._id], radio: [50, 200] } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
    expect(res.send.mock.calls[0][0].products.length).toBeGreaterThan(0)
  });

  it("productCountController should return correct product count", async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("productListController should return paginated products", async () => {
    const req = { params: { page: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
    expect(res.send.mock.calls[0][0].products.length).toBeGreaterThan(0)
  });

  it("searchProductController should return products matching keyword", async () => {
    const req = { params: { keyword: "Test Product" } };
    const res = {
      json: jest.fn(),
    };

    await searchProductController(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "Test Product" }),
        expect.objectContaining({ name: "Test Product Two" }),
      ])
    );
  });

  it("realtedProductController should return related products", async () => {
    const req = { params: { pid: product1._id, cid: category._id } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await realtedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
    expect(res.send.mock.calls[0][0].products.length).toBeGreaterThan(0)
    expect(res.send.mock.calls[0][0].products[0]._id).not.toBe(product1._id);
  });

  test("productCategoryController should return category and products", async () => {
    const req = { params: { slug: "test-category" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: expect.objectContaining({ name: "Test Category" }),
        products: expect.arrayContaining([
          expect.objectContaining({ name: "Test Product" }),
        ]),
      })
    );
  });

  test("braintreeTokenController should return a token", async () => {
    const req = {};
    const res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await braintreeTokenController(req, res);

    expect(res.send).toHaveBeenCalledWith({
      success: true,
      clientToken: "fake-token",
    });
  });

  it("brainTreePaymentController should process payment", async () => {
    const mockProductId1 = new mongoose.Types.ObjectId();
    const mockProductId2 = new mongoose.Types.ObjectId();

    const req = {
      body: {
        nonce: "fake-nonce",
        cart: [
          { _id: mockProductId1, price: 100 },
          { _id: mockProductId2, price: 50 },
        ],
      },
      user: { _id: new mongoose.Types.ObjectId() },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    orderModel.prototype.save = jest.fn().mockResolvedValue({});

    await brainTreePaymentController(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
