import { hashPassword, comparePassword } from "./authHelper"; // Adjust the import path
import bcrypt from "bcrypt";
import {jest} from '@jest/globals'

describe("Password Utils", () => {
  describe("hashPassword", () => {
    it("should hash the password correctly", async () => {
      const mockHashedPassword = "mockhashedpassword";

      // Mock bcrypt.hash to resolve to the mocked hashed password
      const bcryptHash = jest.fn().mockResolvedValue(mockHashedPassword);
      bcrypt.hash = bcryptHash;

      const password = "password123";

      // Call the hashPassword function
      const result = await hashPassword(password);

      // Check that bcrypt.hash was called with correct arguments
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);

      // Check if the returned result matches the mock
      expect(result).toBe(mockHashedPassword);
    });

    it("should handle errors correctly", async () => {
      // Mock bcrypt.hash to reject with an error
      const bcryptHash = jest.fn().mockRejectedValue(new Error("Hashing error"));
      bcrypt.hash = bcryptHash;

      const password = "password123";

      // Call the hashPassword function
      const result = await hashPassword(password);

      // Check that the function does not throw an error and returns undefined
      expect(result).toBeUndefined();
    });
  });

  describe("comparePassword", () => {
    it("should compare the password correctly", async () => {
      // Mock bcrypt.compare to resolve to true (passwords match)
      const bcryptCompare = jest.fn().mockResolvedValue(true);
      bcrypt.compare = bcryptCompare;

      const password = "password123";
      const hashedPassword = "mockhashedpassword";

      // Call the comparePassword function
      const result = await comparePassword(password, hashedPassword);

      // Check that bcrypt.compare was called with correct arguments
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);

      // Check if the result is true
      expect(result).toBe(true);
    });

    it("should return false if passwords don't match", async () => {
      // Mock bcrypt.compare to resolve to false (passwords don't match)
      const bcryptCompare = jest.fn().mockResolvedValue(false);
      bcrypt.compare = bcryptCompare;

      const password = "password123";
      const hashedPassword = "mockhashedpassword";

      // Call the comparePassword function
      const result = await comparePassword(password, hashedPassword);

      // Check if the result is false
      expect(result).toBe(false);
    });

    it("should handle errors correctly", async () => {
        // Mock bcrypt.compare to reject with an error
        bcrypt.compare.mockRejectedValue(new Error("Comparison Error"));
  
        const password = "password123";
        const hashedPassword = "mockhashedpassword";
  
        // Call the comparePassword function and check that it rejects with the expected error
        await expect(comparePassword(password, hashedPassword)).rejects.toThrow("Comparison Error");
      });
  });
});
