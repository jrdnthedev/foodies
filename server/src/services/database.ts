// import { MongoClient, Db, Collection } from 'mongodb';
import { Vendor } from '../types/vendor';

/**
 * MongoDB Database Service
 *
 * This service handles all database operations for the foodies application.
 * Currently using mock data with commented-out database logic for development.
 */

export class DatabaseService {
  // private client: MongoClient;
  // private db: Db;
  private isConnected: boolean = false;

  constructor(
    private connectionString: string,
    private databaseName: string
  ) {
    // TODO: Initialize MongoDB client when ready to use real database
    // this.client = new MongoClient(connectionString);
  }

  /**
   * Connect to MongoDB database
   * Currently using mock connection for development
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    console.log('Database Service: Using mock mode - database connection skipped');
    this.isConnected = true;

    // TODO: Uncomment when ready to use real database
    // try {
    //   await this.client.connect();
    //   this.db = this.client.db(this.databaseName);
    //   console.log(`Connected to MongoDB database: ${this.databaseName}`);
    //   this.isConnected = true;
    // } catch (error) {
    //   console.error('Failed to connect to MongoDB:', error);
    //   throw error;
    // }
  }

  /**
   * Disconnect from MongoDB database
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    console.log('Database Service: Disconnected (mock mode)');
    this.isConnected = false;

    // TODO: Uncomment when ready to use real database
    // try {
    //   await this.client.close();
    //   console.log('Disconnected from MongoDB');
    //   this.isConnected = false;
    // } catch (error) {
    //   console.error('Failed to disconnect from MongoDB:', error);
    //   throw error;
    // }
  }

  /**
   * Get vendors collection
   * Currently returns null since we're using mock data
   */
  private getVendorsCollection(): null {
    // TODO: Uncomment when ready to use real database
    // if (!this.isConnected) {
    //   throw new Error('Database not connected');
    // }
    // return this.db.collection<Vendor>('vendors');

    console.log('Database Service: Mock mode - returning null collection');
    return null;
  }

  /**
   * Find all vendors with pagination and filtering
   */
  async findVendors(
    page: number = 1,
    limit: number = 10,
    filter: { type?: string } = {}
  ): Promise<{ vendors: Vendor[]; total: number }> {
    console.log(
      `Database Service: Mock mode - findVendors called with page=${page}, limit=${limit}, filter=`,
      filter
    );

    // TODO: Uncomment when ready to use real database
    // const collection = this.getVendorsCollection();
    // const query: any = {};
    //
    // if (filter.type) {
    //   query.type = new RegExp(filter.type, 'i'); // Case-insensitive search
    // }
    //
    // const skip = (page - 1) * limit;
    //
    // const [vendors, total] = await Promise.all([
    //   collection.find(query).skip(skip).limit(limit).toArray(),
    //   collection.countDocuments(query)
    // ]);
    //
    // return { vendors, total };

    // Return empty result for mock mode
    return { vendors: [], total: 0 };
  }

  /**
   * Find vendor by ID
   */
  async findVendorById(id: string): Promise<Vendor | null> {
    console.log(`Database Service: Mock mode - findVendorById called with id=${id}`);

    // TODO: Uncomment when ready to use real database
    // const collection = this.getVendorsCollection();
    // return await collection.findOne({ _id: id });

    // Return null for mock mode
    return null;
  }

  /**
   * Create a new vendor
   */
  async createVendor(vendor: Omit<Vendor, 'id'>): Promise<Vendor> {
    console.log('Database Service: Mock mode - createVendor called with vendor:', vendor);

    // TODO: Uncomment when ready to use real database
    // const collection = this.getVendorsCollection();
    //
    // const newVendor = {
    //   ...vendor,
    //   _id: new ObjectId().toString(),
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // };
    //
    // const result = await collection.insertOne(newVendor);
    //
    // if (!result.acknowledged) {
    //   throw new Error('Failed to create vendor');
    // }
    //
    // return { ...newVendor, id: newVendor._id };

    // Return mock vendor for development
    const mockVendor: Vendor = {
      id: 'mock_' + Date.now(),
      ...vendor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return mockVendor;
  }

  /**
   * Update vendor by ID
   */
  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | null> {
    console.log(
      `Database Service: Mock mode - updateVendor called with id=${id}, updates:`,
      updates
    );

    // TODO: Uncomment when ready to use real database
    // const collection = this.getVendorsCollection();
    //
    // const updateData = {
    //   ...updates,
    //   updatedAt: new Date()
    // };
    //
    // delete updateData.id; // Remove id from updates as it's the _id field
    //
    // const result = await collection.findOneAndUpdate(
    //   { _id: id },
    //   { $set: updateData },
    //   { returnDocument: 'after' }
    // );
    //
    // if (!result.value) {
    //   return null;
    // }
    //
    // return { ...result.value, id: result.value._id };

    // Return null for mock mode
    return null;
  }

  /**
   * Delete vendor by ID
   */
  async deleteVendor(id: string): Promise<boolean> {
    console.log(`Database Service: Mock mode - deleteVendor called with id=${id}`);

    // TODO: Uncomment when ready to use real database
    // const collection = this.getVendorsCollection();
    // const result = await collection.deleteOne({ _id: id });
    // return result.deletedCount === 1;

    // Return false for mock mode
    return false;
  }

  /**
   * Search vendors by text
   */
  async searchVendors(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ vendors: Vendor[]; total: number }> {
    console.log(
      `Database Service: Mock mode - searchVendors called with term=${searchTerm}, page=${page}, limit=${limit}`
    );

    // TODO: Uncomment when ready to use real database
    // const collection = this.getVendorsCollection();
    //
    // const query = {
    //   $text: { $search: searchTerm }
    // };
    //
    // const skip = (page - 1) * limit;
    //
    // const [vendors, total] = await Promise.all([
    //   collection.find(query)
    //     .score({ score: { $meta: 'textScore' } })
    //     .sort({ score: { $meta: 'textScore' } })
    //     .skip(skip)
    //     .limit(limit)
    //     .toArray(),
    //   collection.countDocuments(query)
    // ]);
    //
    // return { vendors, total };

    // Return empty result for mock mode
    return { vendors: [], total: 0 };
  }
}

// Export singleton instance
let dbService: DatabaseService | null = null;

export const getDatabaseService = (): DatabaseService => {
  if (!dbService) {
    // TODO: Replace with actual connection string from environment variables
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const databaseName = process.env.MONGODB_DATABASE || 'foodies';

    dbService = new DatabaseService(connectionString, databaseName);
  }

  return dbService;
};
