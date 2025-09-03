import express from 'express';
import { ApiResponse, PaginatedResponse, Vendor } from '../types/index';
// import { getDatabaseService } from '../services/database';

/**
 * Vendor Controller
 *
 * This controller handles all vendor-related HTTP requests.
 * Currently using mock data with commented-out database logic for development.
 *
 * TODO: Uncomment database service calls when ready to use MongoDB
 */

// Mock data for development - remove when using real database
const mockVendors: Vendor[] = [
  {
    id: 'vendor_001',
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
  },
  {
    id: 'vendor_002',
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
  },
  {
    id: 'vendor_003',
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
  },
];

export const getAllVendors = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;

    // TODO: Uncomment when ready to use MongoDB
    // const dbService = getDatabaseService();
    // await dbService.connect();
    //
    // const filter: { type?: string } = {};
    // if (type) {
    //   filter.type = type;
    // }
    //
    // const { vendors, total } = await dbService.findVendors(page, limit, filter);
    //
    // const response: PaginatedResponse<Vendor> = {
    //   success: true,
    //   data: vendors,
    //   pagination: {
    //     page,
    //     limit,
    //     total,
    //     totalPages: Math.ceil(total / limit),
    //   },
    // };

    // MOCK DATA LOGIC - Remove when using real database
    let filteredVendors = mockVendors;

    if (type) {
      filteredVendors = mockVendors.filter(
        (vendor: Vendor) => vendor.type.toLowerCase() === type.toLowerCase()
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

    const response: PaginatedResponse<Vendor> = {
      success: true,
      data: paginatedVendors,
      pagination: {
        page,
        limit,
        total: filteredVendors.length,
        totalPages: Math.ceil(filteredVendors.length / limit),
      },
    };
    // END MOCK DATA LOGIC

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getVendorById = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // TODO: Uncomment when ready to use MongoDB
    // const dbService = getDatabaseService();
    // await dbService.connect();
    //
    // const vendor = await dbService.findVendorById(id);
    //
    // if (!vendor) {
    //   res.status(404).json({
    //     success: false,
    //     error: 'Vendor not found',
    //   });
    //   return;
    // }

    // MOCK DATA LOGIC - Remove when using real database
    const vendor = mockVendors.find((vendor: Vendor) => vendor.id === id);

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found',
      });
      return;
    }
    // END MOCK DATA LOGIC

    const response: ApiResponse<Vendor> = {
      success: true,
      data: vendor,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createVendor = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    // TODO: Uncomment when ready to use MongoDB
    // const dbService = getDatabaseService();
    // await dbService.connect();
    //
    // const vendorData = {
    //   ...req.body,
    //   // id will be generated by MongoDB as _id
    // };
    //
    // const newVendor = await dbService.createVendor(vendorData);

    // MOCK DATA LOGIC - Remove when using real database
    const newVendor: Vendor = {
      id: `vendor_${Date.now()}`, // Generate unique ID for mock data
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockVendors.push(newVendor);
    // END MOCK DATA LOGIC

    const response: ApiResponse<Vendor> = {
      success: true,
      data: newVendor,
      message: 'Vendor created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateVendor = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // TODO: Uncomment when ready to use MongoDB
    // const dbService = getDatabaseService();
    // await dbService.connect();
    //
    // const updatedVendor = await dbService.updateVendor(id, req.body);
    //
    // if (!updatedVendor) {
    //   res.status(404).json({
    //     success: false,
    //     error: 'Vendor not found',
    //   });
    //   return;
    // }

    // MOCK DATA LOGIC - Remove when using real database
    const vendorIndex = mockVendors.findIndex((vendor: Vendor) => vendor.id === id);

    if (vendorIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found',
      });
      return;
    }

    const updatedVendor: Vendor = {
      ...mockVendors[vendorIndex],
      ...req.body,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    mockVendors[vendorIndex] = updatedVendor;
    // END MOCK DATA LOGIC

    const response: ApiResponse<Vendor> = {
      success: true,
      data: updatedVendor,
      message: 'Vendor updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteVendor = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // TODO: Uncomment when ready to use MongoDB
    // const dbService = getDatabaseService();
    // await dbService.connect();
    //
    // const deleted = await dbService.deleteVendor(id);
    //
    // if (!deleted) {
    //   res.status(404).json({
    //     success: false,
    //     error: 'Vendor not found',
    //   });
    //   return;
    // }

    // MOCK DATA LOGIC - Remove when using real database
    const vendorIndex = mockVendors.findIndex((vendor: Vendor) => vendor.id === id);

    if (vendorIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found',
      });
      return;
    }

    mockVendors.splice(vendorIndex, 1);
    // END MOCK DATA LOGIC

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Vendor deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const searchVendors = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = req.query.q as string;

    if (!searchTerm) {
      res.status(400).json({
        success: false,
        error: 'Search term is required',
      });
      return;
    }

    // TODO: Uncomment when ready to use MongoDB
    // const dbService = getDatabaseService();
    // await dbService.connect();
    //
    // const { vendors, total } = await dbService.searchVendors(searchTerm, page, limit);

    // MOCK DATA LOGIC - Remove when using real database
    const filteredVendors = mockVendors.filter(
      (vendor: Vendor) =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

    const vendors = paginatedVendors;
    const total = filteredVendors.length;
    // END MOCK DATA LOGIC

    const response: PaginatedResponse<Vendor> = {
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
