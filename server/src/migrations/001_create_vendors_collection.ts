import { MongoDb } from './types';

/**
 * Migration: Create vendors collection with proper indexes
 * Date: 2025-09-02
 * Description: Creates the vendors collection with indexes for efficient querying
 */

export const up = async (db: MongoDb): Promise<void> => {
  console.log('Creating vendors collection...');

  // Create the vendors collection
  const vendorsCollection = db.collection('vendors');

  // Create indexes for better performance
  await vendorsCollection.createIndex({ name: 1 }); // Index on name for search
  await vendorsCollection.createIndex({ type: 1 }); // Index on type for filtering
  await vendorsCollection.createIndex({ 'location.lat': 1, 'location.lng': 1 }); // Geospatial index
  await vendorsCollection.createIndex({ claimedBy: 1 }); // Index on claimedBy for user queries
  await vendorsCollection.createIndex({ createdAt: 1 }); // Index on createdAt for sorting
  await vendorsCollection.createIndex({ updatedAt: 1 }); // Index on updatedAt for sorting

  // Create a text index for full-text search on name and type
  await vendorsCollection.createIndex(
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'vendors_text_search',
    }
  );

  console.log('Vendors collection created with indexes');
};

export const down = async (db: MongoDb): Promise<void> => {
  console.log('Dropping vendors collection...');

  // Drop the vendors collection
  await db.collection('vendors').drop();

  console.log('Vendors collection dropped');
};

// Migration metadata
export const migrationInfo = {
  version: '001',
  name: 'create_vendors_collection',
  description: 'Creates the vendors collection with proper indexes',
  date: '2025-09-02',
};
