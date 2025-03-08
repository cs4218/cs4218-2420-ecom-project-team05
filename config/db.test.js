import mongoose from "mongoose";
import connectDB from "./db"; // Adjust the path accordingly

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

describe("Database Connection Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should connect to MongoDB successfully", async () => {
    mongoose.connect.mockResolvedValue({
      connection: { host: "localhost" },
    });

    console.log = jest.fn(); // Mock console.log to capture output

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Connected To Mongodb Database localhost")
    );
  });

  it("should handle MongoDB connection error", async () => {
    const errorMessage = "MongoDB connection failed";
    mongoose.connect.mockRejectedValue(new Error(errorMessage));

    console.log = jest.fn(); // Mock console.log

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`Error in Mongodb Error: ${errorMessage}`)
    );
  });
});
