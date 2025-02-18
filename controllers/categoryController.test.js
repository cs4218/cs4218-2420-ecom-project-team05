import { createCategoryController, updateCategoryController } from './categoryController';
import categoryModel from '../models/categoryModel';
import slugify from 'slugify';

// Mock dependencies
jest.mock('../models/categoryModel');
jest.mock('slugify');

describe('createCategoryController', () => {
  let req;
  let res;
  let consoleLogSpy;
  
  beforeEach(() => {
    req = {
      body: { name: 'Test Category' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    consoleLogSpy = jest.spyOn(console, 'log');
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return error if name is missing', async () => {
    req.body = {};

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Name is required'
    });
  });

  it('should handle existing category', async () => {
    const existingCategory = {
      name: 'Test Category',
      slug: 'test-category'
    };
    
    categoryModel.findOne.mockResolvedValue(existingCategory);

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: 'Test Category' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Category Already Exists'
    });
  });

  it('should create new category successfully', async () => {
    const mockCategory = {
      name: 'Test Category',
      slug: 'test-category'
    };

    categoryModel.findOne.mockResolvedValue(null);
    slugify.mockReturnValue('test-category');
    
    const saveMock = jest.fn().mockResolvedValue(mockCategory);
    categoryModel.mockImplementation(() => ({
      save: saveMock
    }));

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: 'Test Category' });
    expect(slugify).toHaveBeenCalledWith('Test Category');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'new category created',
      category: mockCategory
    });
  });

  it('should handle database errors', async () => {
    const mockError = new Error('Database error');
    categoryModel.findOne.mockRejectedValue(mockError);

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: 'Error in Category'
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });
});

describe('updateCategoryController', () => {
  let req;
  let res;
  let consoleLogSpy;
  
  beforeEach(() => {
    req = {
      body: { name: 'Updated Category' },
      params: { id: '123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    consoleLogSpy = jest.spyOn(console, 'log');
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should successfully update category', async () => {
    const mockUpdatedCategory = {
      _id: '123',
      name: 'Updated Category',
      slug: 'updated-category'
    };

    slugify.mockReturnValue('updated-category');
    categoryModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedCategory);

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '123',
      { 
        name: 'Updated Category',
        slug: 'updated-category'
      },
      { new: true }
    );
    expect(slugify).toHaveBeenCalledWith('Updated Category');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      messsage: 'Category Updated Successfully',
      category: mockUpdatedCategory
    });
  });

  it('should handle non-existent category', async () => {
    categoryModel.findByIdAndUpdate.mockResolvedValue(null);
    slugify.mockReturnValue('updated-category');

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      messsage: 'Category Updated Successfully',
      category: null
    });
  });

  it('should handle database errors', async () => {
    const mockError = new Error('Database error');
    categoryModel.findByIdAndUpdate.mockRejectedValue(mockError);

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: 'Error while updating category'
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });

  it('should handle missing id parameter', async () => {
    req.params = {};
    const mockError = new Error('Invalid ID');
    
    categoryModel.findByIdAndUpdate.mockRejectedValue(mockError);

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: mockError,
      message: 'Error while updating category'
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });
});
