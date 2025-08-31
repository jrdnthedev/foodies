import express from 'express';
import { ApiResponse, PaginatedResponse, Vendor } from '../types/index';

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
    const vendor = mockVendors.find((vendor: Vendor) => vendor.id === id);

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found',
      });
      return;
    }

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
    const newVendor: Vendor = {
      id: (mockVendors.length + 1).toString(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockVendors.push(newVendor);

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
