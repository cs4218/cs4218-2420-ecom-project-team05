import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "./userModel";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User Model Tests", () => {
  it("should create a user with valid data", async () => {
    const user = new User({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "password123",
      phone: "1234567890",
      address: {},
      answer: "Some answer",
    });

    const savedUser = await user.save();

    // Check that user is saved correctly
    expect(savedUser.name).toBe("John Doe");
    expect(savedUser.email).toBe("johndoe@example.com");
    expect(savedUser.password).toBe("password123");
    expect(savedUser.phone).toBe("1234567890");
    expect(savedUser.address).toEqual({});
    expect(savedUser.answer).toBe("Some answer");
    expect(savedUser.role).toBe(0);
    expect(savedUser).toHaveProperty("createdAt");
    expect(savedUser).toHaveProperty("updatedAt");
  });

  it("should throw validation error if required fields are missing", async () => {
    const user = new User({
      // Missing required fields
    });

    try {
      await user.save();
    } catch (error) {
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.phone).toBeDefined();
      expect(error.errors.address).toBeDefined();
      expect(error.errors.answer).toBeDefined();
    }
  });

  it("should throw an error if email is not unique", async () => {
    const user1 = new User({
      name: "Jane Doe",
      email: "janedoe@example.com",
      password: "password123",
      phone: "0987654321",
      address: {},
      answer: "Answer",
    });

    await user1.save();

    const user2 = new User({
      name: "Another User",
      email: "janedoe@example.com", // Duplicate email
      password: "password123",
      phone: "1112223333",
      address: {},
      answer: "Answer",
    });

    try {
      await user2.save();
    } catch (error) {
      expect(error.code).toBe(11000); // Mongoose duplicate key error code
    }
  });

  it("should have default role value as 0", async () => {
    const user = new User({
      name: "Default Role User",
      email: "default@example.com",
      password: "password123",
      phone: "1234567890",
      address: {},
      answer: "Answer",
    });

    const savedUser = await user.save();

    // Check if role is set to 0 by default
    expect(savedUser.role).toBe(0);
  });

  it("should throw validation error for invalid email format", async () => {
    const user = new User({
      name: "Invalid Email User",
      email: "invalidemail", // Invalid email format
      password: "password123",
      phone: "1234567890",
      address: {},
      answer: "Answer",
    });

    try {
      await user.save();
    } catch (error) {
      expect(error.errors.email).toBeDefined(); // Should return validation error
    }
  });
});
