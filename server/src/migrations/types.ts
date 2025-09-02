/**
 * Shared types for database migrations
 *
 * This provides proper typing for MongoDB operations until the full MongoDB dependency is added.
 * When MongoDB is installed, these can be replaced with the official types.
 */

// MongoDB-specific types
export type ObjectId = string;

/**
 * MongoDB Index specification
 */
export type IndexSpecification = Record<string, 1 | -1 | 'text' | '2dsphere'>;

/**
 * MongoDB Index options
 */
export interface IndexOptions {
  name?: string;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  [key: string]: unknown;
}

/**
 * MongoDB document - generic document type
 */
export type MongoDocument = Record<string, unknown>;

/**
 * MongoDB filter - used for queries
 */
export type MongoFilter = Record<string, unknown>;

/**
 * MongoDB insert result
 */
export interface InsertOneResult {
  insertedId: ObjectId;
  acknowledged: boolean;
}

/**
 * MongoDB insert many result
 */
export interface InsertManyResult {
  insertedIds: ObjectId[];
  acknowledged: boolean;
}

/**
 * MongoDB delete result
 */
export interface DeleteResult {
  deletedCount: number;
  acknowledged: boolean;
}

/**
 * Minimal MongoDB Db interface for migration typing
 */
export interface MongoDb {
  collection(name: string): MongoCollection;
}

/**
 * Minimal MongoDB Collection interface with specific types
 */
export interface MongoCollection {
  createIndex(keys: IndexSpecification, options?: IndexOptions): Promise<string>;
  insertOne(doc: MongoDocument): Promise<InsertOneResult>;
  insertMany(docs: MongoDocument[]): Promise<InsertManyResult>;
  deleteOne(filter: MongoFilter): Promise<DeleteResult>;
  deleteMany(filter: MongoFilter): Promise<DeleteResult>;
  find(filter?: MongoFilter): MongoCursor;
  drop(): Promise<boolean>;
}

/**
 * MongoDB cursor interface
 */
export interface MongoCursor {
  toArray(): Promise<MongoDocument[]>;
}

/**
 * Migration interface with proper typing
 */
export interface Migration {
  up: (db: MongoDb) => Promise<void>;
  down: (db: MongoDb) => Promise<void>;
  migrationInfo: {
    version: string;
    name: string;
    description: string;
    date: string;
  };
}
