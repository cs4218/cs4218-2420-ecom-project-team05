import { requireSignIn, isAdmin } from './authMiddleware';  // Adjust the import path
import JWT from "jsonwebtoken";
import userModel from "../models/userModel"; // Mock the user model


// Mocking JWT and userModel
jest.mock("jsonwebtoken");
consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output

jest.mock("../models/userModel", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

describe("Middleware Tests", () => {
  describe("requireSignIn", () => {
    let req;
  let res;
  let next;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {
        authorization: "Bearer token",
      },
    };
    res = {}; // doesnt use res
    next = jest.fn(); // mock the next fn to verify if it is called
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

    it("should allow access with a valid token", async () => {
      // Mock JWT.verify to return a decoded token
      const mockDecodedId = { _id: "mockUserId" };
      JWT.verify.mockReturnValueOnce(mockDecodedId);

      await requireSignIn(req, res, next);

      // Check that the next() function is called and the user is added to req
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockDecodedId);  // Ensure the decoded token is added to req.user
    });

    it("should deny access with an invalid token", async () => {
      // Mock JWT.verify to simulate an error (invalid token)
      const mockError = new Error("Invalid token");
      JWT.verify.mockImplementationOnce(() => {
        throw mockError;
      });
  
      await requireSignIn(req, res, next);
  
      expect(next).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe("isAdmin", () => {
    let req;
    let res;
    let next;
    let consoleLogSpy;

    beforeEach(() => {
      jest.clearAllMocks(); 

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      next = jest.fn(); 
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
    });

    afterAll(() => {
      consoleLogSpy.mockRestore();
    });

    it("should allow access if user is admin", async () => {
      const mockUser = { _id: "mockUserId", role: 1 };  // Role 1 = Admin
      const req = { user: mockUser };  // Simulate a user object attached to the request

      userModel.findById.mockResolvedValue(mockUser);  // Mock DB call to return an admin user

      await isAdmin(req, res, next);

      // Check if next() is called to allow access
      expect(next).toHaveBeenCalled();
    });

    it("should deny access if user is not admin", async () => {
      const mockUser = { _id: "mockUserId", role: 0 };  // Role 0 = Normal user
      const req = { user: mockUser };  // Simulate a user object attached to the request

      const next = jest.fn();

      userModel.findById.mockResolvedValue(mockUser);  // Mock DB call to return a normal user

      await isAdmin(req, res, next);

      // Check if the user is denied access and the proper error message is sent
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "UnAuthorized Access",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle errors in isAdmin middleware", async () => {
      const req = { user: { _id: "mockUserId" } };
      userModel.findById.mockRejectedValue(new Error("DB Error"));  // Simulate a DB error

      await isAdmin(req, res, next);

      // Check if error response is sent
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error in admin middleware",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
