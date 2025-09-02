# Database Migrations

This document describes the MongoDB migration system for the foodies application.

## Overview

The migration system is designed to help manage database schema changes and data migrations in a controlled and versioned manner. Currently, all database logic is commented out to allow development with mock data.

## Migration Files Location

Migration files are located in `server/src/migrations/`:

### 001_create_vendors_collection.ts

- Creates the vendors collection with proper indexes
- Sets up indexes for efficient querying by name, type, location, and full-text search

### 002_insert_initial_vendors.ts

- Inserts the initial mock vendor data into the vendors collection
- Provides seed data for development and testing

## Migration Runner

The `MigrationRunner` class (`server/src/migrations/migration-runner.ts`) handles:

- Running pending migrations in order
- Tracking applied migrations
- Rolling back migrations
- Database connection management

## Database Service

The `DatabaseService` class (`server/src/services/database.ts`) provides:

- MongoDB connection management
- CRUD operations for vendors
- Search and filtering capabilities
- Pagination support

## Usage

### Running Migrations (Mock Mode)

```bash
cd server

# Run all pending migrations
npm run migrate

# Rollback the last migration
npm run migrate:rollback
```

### When Ready for Production

1. **Install MongoDB dependencies:**

   ```bash
   cd server
   npm install mongodb
   ```

2. **Set environment variables in `server/.env`:**

   ```bash
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=foodies
   ```

3. **Uncomment database logic in:**
   - `server/src/migrations/migration-runner.ts`
   - `server/src/services/database.ts`
   - `server/src/controllers/vendor-controller.ts`
   - `server/src/migrations/migrate.ts`

4. **Package.json scripts are already configured:**
   ```json
   {
     "scripts": {
       "migrate": "npx tsx src/migrations/migrate.ts",
       "migrate:rollback": "npx tsx src/migrations/migrate.ts rollback"
     }
   }
   ```

## Creating New Migrations

1. Create a new file in `server/src/migrations/` following the naming convention:

   ```
   ###_description_of_migration.ts
   ```

2. Export `up`, `down`, and `migrationInfo`:

   ```typescript
   export const up = async (db: any): Promise<void> => {
     // Migration logic
   };

   export const down = async (db: any): Promise<void> => {
     // Rollback logic
   };

   export const migrationInfo = {
     version: '003',
     name: 'migration_name',
     description: 'Description of what this migration does',
     date: '2025-09-02',
   };
   ```

## MongoDB Schema Design

### Vendors Collection

```javascript
{
  _id: "vendor_001",              // Unique identifier
  name: "Taco Time",              // Vendor name
  type: "Mexican",                // Cuisine type
  location: {                     // Location information
    lat: 43.6532,
    lng: -79.3832,
    address: "123 Queen St W, Toronto, ON"
  },
  schedule: [                     // Array of scheduled appearances
    {
      vendorId: "vendor_001",
      date: "2025-08-29",
      startTime: "11:30",
      endTime: "14:00",
      location: "Downtown Park",
      source: "Instagram"
    }
  ],
  socialLinks: {                  // Social media links
    instagram: "https://instagram.com/tacotime_to",
    twitter: "https://twitter.com/tacotime_to",
    facebook: "https://facebook.com/tacotime_to",
    website: "https://tacotime.com"
  },
  claimedBy: "user_id",          // ID of user who claimed this vendor
  createdAt: ISODate("2025-08-01T00:00:00Z"),
  updatedAt: ISODate("2025-08-01T00:00:00Z")
}
```

### Indexes

- `name` - For searching by vendor name
- `type` - For filtering by cuisine type
- `location.lat, location.lng` - For geospatial queries
- `claimedBy` - For user-specific queries
- `createdAt, updatedAt` - For sorting
- Text index on `name` and `type` - For full-text search

## Development Notes

- All database logic is currently commented out
- Mock data is used in the controller for development
- The migration system is ready to use once MongoDB is set up
- Database service provides a clean interface for data operations
- Error handling and logging are built in

## Future Enhancements

- Add support for transaction-based migrations
- Implement migration dependency checking
- Add data validation and sanitization
- Set up automated backups before migrations
- Add migration testing framework
