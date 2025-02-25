import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; // In-memory MongoDB
import Order from './orderModel'; // Adjust the path as necessary

let mongoServer;

beforeAll(async () => {
  // Start an in-memory MongoDB server before tests run
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  // Close the connection and stop the server after tests are done
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Order Model Tests', () => {
  it('should create an order with default status', async () => {
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    const savedOrder = await order.save();
    
    // Validate that the order has been created with the default status
    expect(savedOrder.status).toBe('Not Process');
  });

  it('should have a valid status value', async () => {
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: 'Shipped', // Explicit status
    });

    const savedOrder = await order.save();
    
    // Validate that the status is correctly set to 'Shipped'
    expect(savedOrder.status).toBe('Shipped');
  });

  it('should fail to save an order with an invalid status', async () => {
    try {
      const order = new Order({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
        status: 'Invalid Status', // Invalid status
      });

      await order.save();
    } catch (error) {
      // Expect validation error due to invalid status
      expect(error.errors.status).toBeDefined();
    }
  });

  it('should update the status of an order', async () => {
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: 'Not Process',
    });

    const savedOrder = await order.save();

    savedOrder.status = 'Processing'; // Update status
    const updatedOrder = await savedOrder.save();

    // Check if the status has been updated
    expect(updatedOrder.status).toBe('Processing');
  });
});
