import { MongoDb } from './types';

/**
 * Migration: Insert initial vendor data
 * Date: 2025-09-02
 * Description: Inserts the initial mock vendor data into the vendors collection
 */

export const up = async (db: MongoDb): Promise<void> => {
  console.log('Inserting initial vendor data...');

  const vendorsCollection = db.collection('vendors');

  const initialVendors = [
    {
      _id: 'vendor_001',
      name: 'Taco Time',
      type: 'Mexican',
      location: {
        lat: 43.6532,
        lng: -79.3832,
        address: '123 Queen St W, Toronto, ON',
      },
      schedule: [
        {
          vendorId: 'vendor_001',
          date: '2025-08-29',
          startTime: '11:30',
          endTime: '14:00',
          location: 'Downtown Park',
          source: 'Instagram',
          confidence: 0.85, // High confidence score
        },
      ],
      socialLinks: {
        instagram: 'https://instagram.com/tacotime_to',
        twitter: 'https://twitter.com/tacotime_to',
      },
      claimedBy: null,
      createdAt: new Date('2025-08-01T00:00:00Z'),
      updatedAt: new Date('2025-08-01T00:00:00Z'),
    },
    {
      _id: 'vendor_002',
      name: 'Rolling Sushi',
      type: 'Japanese',
      location: {
        lat: 43.651,
        lng: -79.347,
        address: '145 Oak St, Toronto, ON',
      },
      schedule: [
        {
          vendorId: 'vendor_002',
          date: '2025-08-29',
          startTime: '17:00',
          endTime: '20:00',
          location: 'Harbourfront Market',
          source: 'Twitter',
          confidence: 0.72, // Medium confidence score
        },
      ],
      socialLinks: {
        instagram: 'https://instagram.com/rollingsushi',
        twitter: 'https://twitter.com/rollingsushi',
      },
      claimedBy: 'vendor_user_002',
      createdAt: new Date('2025-08-01T00:00:00Z'),
      updatedAt: new Date('2025-08-01T00:00:00Z'),
    },
    {
      _id: 'vendor_003',
      name: 'Curry in a Hurry',
      type: 'Indian',
      location: {
        lat: 43.6629,
        lng: -79.3957,
        address: '456 Bloor St W, Toronto, ON',
      },
      schedule: [],
      socialLinks: {
        instagram: 'https://instagram.com/curryinahurry',
        twitter: null,
      },
      claimedBy: null,
      createdAt: new Date('2025-08-01T00:00:00Z'),
      updatedAt: new Date('2025-08-01T00:00:00Z'),
    },
  ];

  await vendorsCollection.insertMany(initialVendors);

  console.log(`Inserted ${initialVendors.length} initial vendors`);
};

export const down = async (db: MongoDb): Promise<void> => {
  console.log('Removing initial vendor data...');

  const vendorsCollection = db.collection('vendors');

  // Remove the initial vendors by their IDs
  await vendorsCollection.deleteMany({
    _id: { $in: ['vendor_001', 'vendor_002', 'vendor_003'] },
  });

  console.log('Initial vendor data removed');
};

// Migration metadata
export const migrationInfo = {
  version: '002',
  name: 'insert_initial_vendors',
  description: 'Inserts initial mock vendor data',
  date: '2025-09-02',
};
