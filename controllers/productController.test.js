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
import mongoose from "mongoose";

// Mock data
const mockCategory = {
  _id: "category-id",
  name: "Test Category",
  slug: "test-category",
};

const mockProduct1 = {
  _id: "product1-id",
  name: "Test Product",
  slug: "test-product",
  description: "A great product",
  price: 100,
  category: mockCategory._id,
  quantity: 10,
  photo: {
    data: Buffer.from("test image data"),
    contentType: "image/png",
  },
};

const mockProduct2 = {
  _id: "product2-id",
  name: "Test Product Two",
  slug: "test-product-two",
  description: "Another great product",
  price: 120,
  category: mockCategory._id,
  quantity: 5,
};

const mockProduct3 = {
  _id: "product3-id",
  name: "Different Category Product",
  slug: "different-category-product",
  description: "A different product",
  price: 90,
  category: "different-category-id",
  quantity: 7,
};

// Mock Mongoose
jest.mock("mongoose", () => {
  const mockObjectId = jest.fn((id) => id || "mock-id");
  mockObjectId.isValid = jest.fn().mockReturnValue(true);

  return {
    connect: jest.fn(),
    connection: {
      close: jest.fn(),
    },
    Types: {
      ObjectId: mockObjectId,
    },
  };
});

// Mock the models
jest.mock("../models/productModel.js", () => {
  const createQueryableMock = () => {
    const mock = {};

    mock.select = jest.fn().mockReturnValue(mock);
    mock.populate = jest.fn().mockReturnValue(mock);
    mock.sort = jest.fn().mockReturnValue(mock);
    mock.limit = jest.fn().mockReturnValue(mock);
    mock.skip = jest.fn().mockReturnValue(mock);

    mock.then = jest.fn((callback) => Promise.resolve(callback()));

    return mock;
  };

  const modelMethods = {
    create: jest
      .fn()
      .mockImplementation((data) =>
        Promise.resolve({ ...data, _id: `${data.name || "product"}-id` })
      ),
    find: jest.fn().mockImplementation(() => {
      const queryMock = createQueryableMock();
      queryMock.estimatedDocumentCount = jest.fn().mockResolvedValue(3);
      queryMock.then = jest.fn((callback) =>
        Promise.resolve(callback([mockProduct1, mockProduct2, mockProduct3]))
      );
      return queryMock;
    }),
    findOne: jest.fn().mockImplementation((query) => {
      const product = [mockProduct1, mockProduct2, mockProduct3].find(
        (p) => p.slug === query?.slug
      );
      const queryMock = createQueryableMock();
      queryMock.then = jest.fn((callback) =>
        Promise.resolve(callback(product || null))
      );
      return queryMock;
    }),
    findById: jest.fn().mockImplementation((id) => {
      const product = [mockProduct1, mockProduct2, mockProduct3].find(
        (p) => p._id === id
      );
      const queryMock = createQueryableMock();
      queryMock.then = jest.fn((callback) =>
        Promise.resolve(callback(product || null))
      );
      return queryMock;
    }),
    findByIdAndDelete: jest.fn().mockImplementation((id) => {
      return Promise.resolve({ _id: id, name: "Deleted Product" });
    }),
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      const product = [mockProduct1, mockProduct2, mockProduct3].find(
        (p) => p._id === id
      );
      const updatedProduct = { ...product, ...update };
      return Promise.resolve(updatedProduct);
    }),
    deleteOne: jest
      .fn()
      .mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
    estimatedDocumentCount: jest.fn().mockResolvedValue(3),
  };

  const ModelConstructor = jest.fn().mockImplementation(() => {
    const instance = {};

    // Instance methods
    instance.save = jest.fn().mockResolvedValue({});

    return instance;
  });

  // Combine static methods and constructor
  return {
    __esModule: true,
    default: Object.assign(ModelConstructor, modelMethods),
  };
});

jest.mock("../models/categoryModel.js", () => {
  const modelMethods = {
    create: jest.fn().mockResolvedValue(mockCategory),
    findOne: jest.fn().mockImplementation((query) => {
      if (query?.slug === "test-category") {
        return Promise.resolve(mockCategory);
      }
      return Promise.resolve(null);
    }),
  };

  const ModelConstructor = jest.fn();

  return {
    __esModule: true,
    default: Object.assign(ModelConstructor, modelMethods),
  };
});

jest.mock("../models/orderModel.js", () => {
  const OrderModel = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({}),
  }));

  return {
    __esModule: true,
    default: OrderModel,
  };
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

// Import models after they've been mocked
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

describe("Product Controllers", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should create a product successfully", async () => {
    // Mock the entire productModel
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockProductInstance = {
      photo: {
        data: null,
        contentType: null,
      },
      save: mockSave,
    };

    // Mock productModel as a constructor function
    productModel.mockImplementation(() => mockProductInstance);

    const newProduct = {
      name: "New Product",
      description: "New product description",
      price: 50,
      category: mockCategory._id,
      quantity: 5,
    };

    const req = {
      fields: newProduct,
      files: {
        photo: {
          type: "image/jpeg",
          path: "",
          size: 1,
        },
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await createProductController(req, res);

    expect(productModel).toHaveBeenCalledWith(
      expect.objectContaining({
        name: newProduct.name,
        slug: expect.any(String),
      })
    );
    expect(mockProductInstance.photo.contentType).toBe("image/jpeg");
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("(missing description) should not create a product successfully", async () => {
    const newProduct = {
      name: "New Product",
      price: 50,
      category: mockCategory._id,
      quantity: 5,
    };

    const req = {
      fields: newProduct,
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing name) should not create a product successfully", async () => {
    const newProduct = {
      description: "New product description",
      price: 50,
      category: mockCategory._id,
      quantity: 5,
    };

    const req = {
      fields: newProduct,
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing price) should not create a product successfully", async () => {
    const newProduct = {
      name: "New Product",
      description: "New product description",
      category: mockCategory._id,
      quantity: 5,
    };

    const req = {
      fields: newProduct,
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing category) should not create a product successfully", async () => {
    const newProduct = {
      name: "New Product",
      description: "New product description",
      price: 50,
      quantity: 5,
    };

    const req = {
      fields: newProduct,
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(photo more than 1 mb) should not create a product successfully", async () => {
    const newProduct = {
      name: "New Product",
      description: "New product description",
      price: 50,
      quantity: 5,
      category: "test",
      photo: {
        data: Buffer.from("test image data"),
        contentType: "image/png",
      },
    };

    const req = {
      fields: newProduct,
      files: {
        photo: {
          size: 200000000,
        },
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing quantity) should not create a product successfully", async () => {
    const newProduct = {
      name: "New Product",
      description: "New product description",
      price: 50,
      category: mockCategory._id,
    };

    const req = {
      fields: newProduct,
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("getProductController should return products", async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductController(req, res);

    expect(productModel.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
  });

  it("getProductController should handle errors properly", async () => {
    // Save the original implementation
    const originalFindMethod = productModel.find;

    const errorMessage = "Database connection failed";
    productModel.find = jest.fn().mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    try {
      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Erorr in getting products",
        error: errorMessage,
      });
      expect(consoleSpy).toHaveBeenCalled();
    } finally {
      // Restore the original implementation
      productModel.find = originalFindMethod;
      consoleSpy.mockRestore();
    }
  });

  it("getSingleProductController should return a single product", async () => {
    const req = { params: { slug: "test-product" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getSingleProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "test-product" });
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
    // Override the default mock for this test only
    productModel.findOne.mockImplementationOnce(() => {
      const queryMock = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };
      queryMock.then = jest.fn((callback) => Promise.resolve(callback(null)));
      return queryMock;
    });

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
    const req = { params: { pid: mockProduct1._id } };
    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith(mockProduct1._id);
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("productPhotoController should not return product photo", async () => {
    const req = { params: { pid: "doesnt-exist" } };
    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith("doesnt-exist");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("deleteProductController should delete a product", async () => {
    productModel.findByIdAndDelete = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct1),
    });

    const req = { params: { pid: mockProduct1._id } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
      mockProduct1._id
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Deleted successfully",
      })
    );
  });

  it("deleteProductController should fail to delete a product", async () => {
    const mockProduct4 = {
      _id: "product4-id",
    };

    productModel.findByIdAndDelete = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(),
    });

    const req = { params: { pid: mockProduct4._id } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
      mockProduct4._id
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while deleting product",
      })
    );
  });

  it("updateProductController should update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        category: mockCategory._id,
        quantity: 20,
      },
      files: {
        photo: {
          size: 1,
        },
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockProduct1._id,
      expect.anything(),
      { new: true }
    );
  });

  it("(missing name) updateProductController should not update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        description: "Updated description",
        price: 150,
        category: mockCategory._id,
        quantity: 20,
      },
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing name) updateProductController should not update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        category: mockCategory._id,
        quantity: 20,
      },
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing description) updateProductController should not update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        name: "Updated Product",
        price: 150,
        category: mockCategory._id,
        quantity: 20,
      },
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing price) updateProductController should not update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        category: mockCategory._id,
        quantity: 20,
      },
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing category) updateProductController should not update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        quantity: 20,
      },
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(missing quantity) updateProductController should not update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        category: mockCategory._id,
      },
      files: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("(photo size > 1mb) updateProductController should not update a product", async () => {
    const req = {
      params: { pid: mockProduct1._id },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        category: mockCategory._id,
        quantity: 10,
      },
      files: {
        photo: {
          size: 100000000,
        },
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("productFiltersController should return filtered products", async () => {
    const req = { body: { checked: [mockCategory._id], radio: [50, 200] } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
  });

  it("productFiltersController should fail to return filtered products, price negative", async () => {
    const req = { body: { checked: [mockCategory._id], radio: [-1, -10] } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error WHile Filtering Products",
      })
    );
  });

  it("productCountController should return correct product count", async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productCountController(req, res);

    expect(productModel.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 3,
      })
    );
  });

  it("productListController should return paginated products", async () => {
    const req = { params: { page: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productListController(req, res);

    expect(productModel.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
  });

  it("searchProductController should return products matching keyword", async () => {
    productModel.find.mockImplementationOnce(() => {
      const queryMock = {
        select: jest.fn().mockReturnThis(),
      };
      queryMock.then = jest.fn((callback) =>
        Promise.resolve(callback([mockProduct1, mockProduct2]))
      );
      return queryMock;
    });

    const req = { params: { keyword: "Test Product" } };
    const res = {
      json: jest.fn(),
    };

    await searchProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      $or: expect.any(Array),
    });
    expect(res.json).toHaveBeenCalled();
  });

  it("realtedProductController should return related products", async () => {
    const req = { params: { pid: mockProduct1._id, cid: mockCategory._id } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await realtedProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        category: mockCategory._id,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.any(Array),
      })
    );
  });

  test("productCategoryController should return category and products", async () => {
    const req = { params: { slug: "test-category" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: "test-category",
    });
    expect(productModel.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: expect.objectContaining({ name: "Test Category" }),
        products: expect.any(Array),
      })
    );
  });

  it("braintreeTokenController should return a token", async () => {
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
    const mockProductId1 = "mock-product-id-1";
    const mockProductId2 = "mock-product-id-2";
    const mockUserId = "mock-user-id";

    const req = {
      body: {
        nonce: "fake-nonce",
        cart: [
          { _id: mockProductId1, price: 100 },
          { _id: mockProductId2, price: 50 },
        ],
      },
      user: { _id: mockUserId },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await brainTreePaymentController(req, res);

    expect(orderModel).toHaveBeenCalledWith(
      expect.objectContaining({
        products: req.body.cart,
        payment: expect.any(Object),
        buyer: mockUserId,
      })
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
