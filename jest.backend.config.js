export default {
  // display name
  displayName: "backend",
  
  preset: '@shelf/jest-mongodb',

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/middlewares/*.test.js", "<rootDir>/models/*.test.js", "<rootDir>/config/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "models/**", "config/**", "middlewares/**"],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },

};